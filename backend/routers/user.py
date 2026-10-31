from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from backend.core.database import get_db
from backend.models.models import (
    DiscountRule,
    Invoice,
    InvoiceLine,
    Payment,
    Plan,
    ProductVariant,
    Subscription,
    SubscriptionLine,
    TaxRule,
    User,
    Variant,
)
from backend.routers.auth import require_customer
from backend.schemas.user import (
    CheckoutRequest,
    CheckoutResponse,
    CustomerSummary,
    InvoiceDetailResponse,
    InvoiceLineResponse,
    InvoiceListResponse,
    InvoiceResponse,
    PaymentListResponse,
    PaymentResponse,
    PlanResponse,
    ProductResponse,
    ReceiptResponse,
    SubscriptionDetailResponse,
    SubscriptionLineResponse,
    SubscriptionListResponse,
    SubscriptionResponse,
    VariantResponse,
)


router = APIRouter(prefix="/api", tags=["customer"])
MONEY = Decimal("0.01")
DEFAULT_TAX_RATE = Decimal("0.18")
PAYMENT_METHODS = {"card", "upi", "netbanking", "wallet", "bank_transfer", "credit card", "net banking", "bank transfer"}


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def add_period(start: date, period: str) -> date:
    if period == "daily":
        return start + timedelta(days=1)
    if period == "weekly":
        return start + timedelta(days=7)
    if period == "yearly":
        return start + timedelta(days=365)
    return start + timedelta(days=30)


def paid_amount(invoice: Invoice) -> Decimal:
    return sum(
        (money(payment.amount) for payment in invoice.payments if payment.status == "successful"),
        Decimal("0.00"),
    )


def invoice_is_overdue(invoice: Invoice) -> bool:
    return invoice.status not in {"paid", "cancelled"} and invoice.due_date < date.today()


def invoice_response(invoice: Invoice) -> InvoiceResponse:
    paid = paid_amount(invoice)
    return InvoiceResponse(
        id=invoice.id,
        invoice_number=invoice.invoice_number,
        subscription_number=invoice.subscription_number,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        subtotal=float(invoice.subtotal),
        discount_total=float(invoice.discount_total),
        tax_total=float(invoice.tax_total),
        total=float(invoice.total),
        currency=invoice.currency,
        is_overdue=invoice_is_overdue(invoice),
        balance_due=float(max(invoice.total - paid, Decimal("0.00"))),
    )


def invoice_detail(invoice: Invoice) -> InvoiceDetailResponse:
    base = invoice_response(invoice)
    return InvoiceDetailResponse(
        **base.model_dump(),
        customer_name=invoice.customer_name,
        customer_email=invoice.customer_email,
        lines=[InvoiceLineResponse.model_validate(line) for line in invoice.lines],
        payments=[PaymentResponse.model_validate(payment) for payment in invoice.payments],
    )


def subscription_response(sub: Subscription) -> SubscriptionResponse:
    return SubscriptionResponse.model_validate(sub)


def subscription_detail(sub: Subscription) -> SubscriptionDetailResponse:
    base = subscription_response(sub)
    return SubscriptionDetailResponse(
        **base.model_dump(),
        lines=[SubscriptionLineResponse.model_validate(line) for line in sub.lines],
        invoices=[invoice_response(invoice) for invoice in sub.invoices],
    )


def tax_rule(db: Session) -> TaxRule | None:
    return (
        db.query(TaxRule)
        .filter(TaxRule.is_active.is_(True))
        .order_by(TaxRule.id.asc())
        .first()
    )


def best_discount(
    db: Session,
    plan: Plan,
    base: Decimal,
    quantity: int,
    on_date: date,
) -> tuple[DiscountRule | None, Decimal]:
    rules = db.query(DiscountRule).filter(DiscountRule.active.is_(True)).all()
    best_rule = None
    best_amount = Decimal("0.00")

    for rule in rules:
        if rule.start_date and on_date < rule.start_date:
            continue
        if rule.end_date and on_date > rule.end_date:
            continue
        if rule.usage_limit is not None and rule.used_count >= rule.usage_limit:
            continue
        if base < money(rule.min_purchase) or quantity < rule.min_quantity:
            continue
        if rule.scope == "product" and rule.product_id != plan.product_id:
            continue

        if rule.type == "percentage":
            amount = money(base * money(rule.value) / Decimal("100"))
        else:
            amount = min(money(rule.value), base)

        if amount > best_amount:
            best_rule = rule
            best_amount = amount

    return best_rule, best_amount


def owned_subscription(db: Session, subscription_id: int, customer: User) -> Subscription:
    sub = (
        db.query(Subscription)
        .options(selectinload(Subscription.lines), selectinload(Subscription.invoices).selectinload(Invoice.payments))
        .filter(Subscription.id == subscription_id, Subscription.customer_id == customer.id)
        .first()
    )
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found")
    return sub


def owned_invoice(db: Session, invoice_id: int, customer: User) -> Invoice:
    invoice = (
        db.query(Invoice)
        .options(selectinload(Invoice.lines), selectinload(Invoice.payments), selectinload(Invoice.customer))
        .filter(Invoice.id == invoice_id, Invoice.customer_id == customer.id)
        .first()
    )
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


@router.get("/plans", response_model=list[PlanResponse])
def list_plans(
    db: Session = Depends(get_db),
    billing_period: Optional[str] = None,
    category: Optional[str] = None,
    q: Optional[str] = None,
):
    today = date.today()
    query = db.query(Plan).filter(Plan.is_active.is_(True))
    if billing_period:
        query = query.filter(Plan.billing_period == billing_period.lower())
    if category:
        query = query.filter(func.lower(Plan.category) == category.lower())
    if q:
        query = query.filter(or_(Plan.name.ilike(f"%{q}%"), Plan.description.ilike(f"%{q}%")))
    plans = query.order_by(Plan.id.asc()).all()

    response = []
    for plan in plans:
        if plan.available_from and today < plan.available_from:
            continue
        if plan.available_to and today > plan.available_to:
            continue

        variant_query = db.query(ProductVariant).filter(ProductVariant.is_active.is_(True))
        if plan.product_id is not None:
            variant_query = variant_query.filter(
                or_(ProductVariant.product_id == plan.product_id, ProductVariant.product_id.is_(None))
            )
        variants = variant_query.order_by(ProductVariant.id.asc()).all()
        response.append(
            PlanResponse(
                id=plan.id,
                name=plan.name,
                category=plan.category,
                billing_period=plan.billing_period,
                price=float(plan.price),
                min_qty=plan.min_qty,
                available_from=plan.available_from,
                available_to=plan.available_to,
                auto_close=plan.auto_close,
                pausable=plan.pausable,
                renewable=plan.renewable,
                payment_terms_days=plan.payment_terms_days,
                description=plan.description,
                product=ProductResponse.model_validate(plan.product) if plan.product else None,
                variants=[
                    VariantResponse(
                        id=variant.id,
                        name=variant.name,
                        extra_price=float(variant.extra_price),
                        sku=variant.sku,
                        effective_price=float(money(plan.price) + money(variant.extra_price)),
                    )
                    for variant in variants
                ],
            )
        )
    return response


@router.get("/plans/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(Plan, plan_id)
    if plan is None or not plan.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    today = date.today()
    if plan.available_from and today < plan.available_from:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan is not available yet")
    if plan.available_to and today > plan.available_to:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan is no longer available")

    variants = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.is_active.is_(True),
            or_(ProductVariant.product_id == plan.product_id, ProductVariant.product_id.is_(None)),
        )
        .order_by(ProductVariant.id.asc())
        .all()
    )
    return PlanResponse(
        id=plan.id,
        name=plan.name,
        category=plan.category,
        billing_period=plan.billing_period,
        price=float(plan.price),
        min_qty=plan.min_qty,
        available_from=plan.available_from,
        available_to=plan.available_to,
        auto_close=plan.auto_close,
        pausable=plan.pausable,
        renewable=plan.renewable,
        payment_terms_days=plan.payment_terms_days,
        description=plan.description,
        product=ProductResponse.model_validate(plan.product) if plan.product else None,
        variants=[
            VariantResponse(
                id=variant.id,
                name=variant.name,
                extra_price=float(variant.extra_price),
                sku=variant.sku,
                effective_price=float(money(plan.price) + money(variant.extra_price)),
            )
            for variant in variants
        ],
    )


@router.post("/subscriptions/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    plan = db.get(Plan, payload.plan_id)
    if plan is None or not plan.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    start = payload.start_date or date.today()
    if plan.available_from and start < plan.available_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan is not available on the selected date")
    if plan.available_to and start > plan.available_to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan is not available on the selected date")
    if payload.quantity < plan.min_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum quantity for this plan is {plan.min_qty}",
        )

    variant = None
    if payload.variant_id is not None:
        variant = db.get(ProductVariant, payload.variant_id)
        if variant is None or not variant.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid variant")
        if (
            plan.product_id is not None
            and variant.product_id is not None
            and plan.product_id != variant.product_id
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Variant does not belong to this product")

    payment_method = payload.payment_method.strip().lower()
    if payment_method not in PAYMENT_METHODS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported payment method")

    unit_price = money(plan.price) + (money(variant.extra_price) if variant else Decimal("0.00"))
    base = money(unit_price * payload.quantity)
    rule, discount = best_discount(db, plan, base, payload.quantity, start)
    taxable = money(base - discount)
    tax = tax_rule(db)
    rate = tax.rate if tax else DEFAULT_TAX_RATE
    tax_amount = money(taxable * rate)
    total = money(taxable + tax_amount)

    next_sub_id = (db.query(func.max(Subscription.id)).scalar() or 0) + 1
    sub = Subscription(
        id=next_sub_id,
        subscription_number=f"SUB-{1000 + next_sub_id}",
        customer_id=current_user.id,
        plan_id=plan.id,
        product_id=plan.product_id,
        variant_id=variant.id if variant else None,
        customer_name=current_user.name,
        customer_email=current_user.email,
        plan_name=plan.name,
        variant_name=variant.name if variant else None,
        quantity=payload.quantity,
        unit_price=unit_price,
        tax_amount=tax_amount,
        discount_amount=discount,
        total_amount=total,
        status="active",
        start_date=start,
        expiry_date=add_period(start, plan.billing_period),
        next_billing_date=add_period(start, plan.billing_period),
        payment_terms_days=plan.payment_terms_days,
        auto_renew=plan.renewable,
        created_at=utcnow(),
    )
    db.add(sub)
    db.flush()

    db.add(
        SubscriptionLine(
            subscription_id=sub.id,
            product_id=plan.product_id,
            variant_id=variant.id if variant else None,
            quantity=payload.quantity,
            unit_price=unit_price,
            tax_id=tax.id if tax else None,
            tax_amount=tax_amount,
            amount=base,
            description=f"{plan.name} - {variant.name}" if variant else plan.name,
        )
    )

    next_invoice_id = (db.query(func.max(Invoice.id)).scalar() or 0) + 1
    invoice = Invoice(
        id=next_invoice_id,
        invoice_number=f"INV-{2000 + next_invoice_id}",
        subscription_id=sub.id,
        customer_id=current_user.id,
        customer_name=current_user.name,
        customer_email=current_user.email,
        subscription_number=sub.subscription_number,
        invoice_date=date.today(),
        due_date=date.today() + timedelta(days=plan.payment_terms_days),
        status="paid",
        subtotal=base,
        discount_total=discount,
        tax_total=tax_amount,
        total=total,
        currency="INR",
        payment_terms_days=plan.payment_terms_days,
        discount_rule_id=rule.id if rule else None,
        created_at=utcnow(),
    )
    db.add(invoice)
    db.flush()

    db.add(
        InvoiceLine(
            invoice_id=invoice.id,
            product_id=plan.product_id,
            description=f"{plan.name} - {variant.name}" if variant else plan.name,
            quantity=payload.quantity,
            unit_price=unit_price,
            tax_id=tax.id if tax else None,
            tax_amount=tax_amount,
            discount_amount=discount,
            line_total=total,
        )
    )

    next_payment_id = (db.query(func.max(Payment.id)).scalar() or 0) + 1
    note = payload.note or ""
    if payload.last4:
        note = f"{note} card-last4={payload.last4}".strip()
    payment = Payment(
        id=next_payment_id,
        payment_reference=f"PAY-{next_payment_id:05d}",
        invoice_id=invoice.id,
        customer_id=current_user.id,
        amount=total,
        method=payment_method,
        payment_date=date.today(),
        status="successful",
        note=note,
    )
    db.add(payment)

    if rule is not None:
        rule.used_count += 1

    db.commit()

    invoice = (
        db.query(Invoice)
        .options(selectinload(Invoice.lines), selectinload(Invoice.payments))
        .filter(Invoice.id == invoice.id)
        .one()
    )
    return CheckoutResponse(
        subscription=subscription_response(sub),
        invoice=invoice_detail(invoice),
        payment=PaymentResponse.model_validate(payment),
        next_billing_date=sub.next_billing_date,
    )


@router.get("/subscriptions", response_model=SubscriptionListResponse)
def list_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    query = db.query(Subscription).filter(Subscription.customer_id == current_user.id)
    if status_filter:
        query = query.filter(Subscription.status == status_filter.lower())
    total = query.count()
    items = (
        query.order_by(Subscription.start_date.desc(), Subscription.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return SubscriptionListResponse(
        items=[subscription_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionDetailResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    return subscription_detail(owned_subscription(db, subscription_id, current_user))


@router.post("/subscriptions/{subscription_id}/cancel", response_model=SubscriptionResponse)
def cancel_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    sub = owned_subscription(db, subscription_id, current_user)
    if sub.status not in {"active", "confirmed"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active subscriptions can be cancelled")
    sub.status = "closed"
    sub.expiry_date = date.today()
    sub.next_billing_date = None
    db.commit()
    db.refresh(sub)
    return subscription_response(sub)


@router.post("/subscriptions/{subscription_id}/renew")
def renew_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    sub = owned_subscription(db, subscription_id, current_user)
    plan = db.get(Plan, sub.plan_id)
    if plan is None or not plan.renewable:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This plan cannot be renewed")

    base_date = max(sub.expiry_date, date.today())
    new_expiry = add_period(base_date, plan.billing_period)
    base = money(sub.unit_price * sub.quantity)
    tax = tax_rule(db)
    rate = tax.rate if tax else DEFAULT_TAX_RATE
    tax_amount = money(base * rate)
    total = money(base + tax_amount)

    sub.status = "active"
    sub.expiry_date = new_expiry
    sub.next_billing_date = new_expiry

    next_invoice_id = (db.query(func.max(Invoice.id)).scalar() or 0) + 1
    invoice = Invoice(
        id=next_invoice_id,
        invoice_number=f"INV-{2000 + next_invoice_id}",
        subscription_id=sub.id,
        customer_id=current_user.id,
        customer_name=current_user.name,
        customer_email=current_user.email,
        subscription_number=sub.subscription_number,
        invoice_date=date.today(),
        due_date=date.today() + timedelta(days=plan.payment_terms_days),
        status="confirmed",
        subtotal=base,
        discount_total=Decimal("0.00"),
        tax_total=tax_amount,
        total=total,
        currency="INR",
        payment_terms_days=plan.payment_terms_days,
        created_at=utcnow(),
    )
    db.add(invoice)
    db.flush()
    db.add(
        InvoiceLine(
            invoice_id=invoice.id,
            product_id=plan.product_id,
            description=sub.plan_name or plan.name,
            quantity=sub.quantity,
            unit_price=sub.unit_price,
            tax_id=tax.id if tax else None,
            tax_amount=tax_amount,
            discount_amount=Decimal("0.00"),
            line_total=total,
        )
    )
    db.commit()
    db.refresh(invoice)
    return {"subscription": subscription_response(sub), "invoice": invoice_response(invoice)}


@router.get("/invoices", response_model=InvoiceListResponse)
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    query = (
        db.query(Invoice)
        .options(selectinload(Invoice.payments))
        .filter(Invoice.customer_id == current_user.id)
    )
    if status_filter:
        query = query.filter(Invoice.status == status_filter.lower())
    if date_from:
        query = query.filter(Invoice.invoice_date >= date_from)
    if date_to:
        query = query.filter(Invoice.invoice_date <= date_to)

    total = query.count()
    items = (
        query.order_by(Invoice.invoice_date.desc(), Invoice.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return InvoiceListResponse(
        items=[invoice_response(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/invoices/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    return invoice_detail(owned_invoice(db, invoice_id, current_user))


@router.get("/invoices/{invoice_id}/receipt", response_model=ReceiptResponse)
def invoice_receipt(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    invoice = owned_invoice(db, invoice_id, current_user)
    paid = paid_amount(invoice)
    return ReceiptResponse(
        company={
            "name": "Brightloop Software",
            "email": "billing@brightloop.io",
            "address": "Kochi, India",
            "currency": "INR",
        },
        customer={
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "company_name": current_user.company_name,
        },
        invoice=invoice_detail(invoice),
        amount_paid=float(paid),
        balance_due=float(max(invoice.total - paid, Decimal("0.00"))),
    )


@router.get("/payments", response_model=PaymentListResponse)
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    query = db.query(Payment).filter(Payment.customer_id == current_user.id)
    total = query.count()
    items = (
        query.order_by(Payment.payment_date.desc(), Payment.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PaymentListResponse(
        items=[PaymentResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/customer/summary", response_model=CustomerSummary)
def customer_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    subscriptions = db.query(Subscription).filter(Subscription.customer_id == current_user.id).all()
    invoices = (
        db.query(Invoice)
        .options(selectinload(Invoice.payments))
        .filter(Invoice.customer_id == current_user.id)
        .all()
    )
    paid_revenue = sum(
        (money(payment.amount) for payment in db.query(Payment).filter(
            Payment.customer_id == current_user.id,
            Payment.status == "successful",
        ).all()),
        Decimal("0.00"),
    )
    outstanding = sum(
        (max(invoice.total - paid_amount(invoice), Decimal("0.00")) for invoice in invoices),
        Decimal("0.00"),
    )
    active = [sub for sub in subscriptions if sub.status == "active"]
    next_dates = [sub.next_billing_date for sub in active if sub.next_billing_date]
    return CustomerSummary(
        active_subscriptions=len(active),
        total_subscriptions=len(subscriptions),
        paid_revenue=float(paid_revenue),
        outstanding_amount=float(outstanding),
        overdue_invoices=sum(1 for invoice in invoices if invoice_is_overdue(invoice)),
        next_billing_date=min(next_dates) if next_dates else None,
    )


