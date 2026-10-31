from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.core.database import get_db
from backend.models.models import User, Plan, Variant, Subscription
from backend.routers.user import router

class CustomerQuotationCreate(BaseModel):
    subscription_number: Optional[str] = None
    customer_email: str
    customer_name: Optional[str] = "Customer"
    plan_name: str
    variant_name: Optional[str] = "Standard Brand License"
    quantity: int = 1
    unit_price: float = 0.0
    total_amount: float = 0.0
    tax_amount: float = 0.0
    status: str = "Quotation"
    created_at: Optional[str] = None
    expiry_date: Optional[str] = "Pending Activation"

@router.post("/customer/subscriptions")
def create_customer_quotation_endpoint(payload: CustomerQuotationCreate, db: Session = Depends(get_db)):
    """Receives quotation request from customer portal modal and persists directly to SQLite database."""
    user = db.query(User).filter(User.email == payload.customer_email).first()
    if not user:
        user = User(
            name=payload.customer_name or "Customer",
            email=payload.customer_email,
            role="customer",
            company_name="Independent Enterprise",
            industry="Retail"
        )
        db.add(user)
        db.flush()

    plan = db.query(Plan).filter(Plan.name == payload.plan_name).first() or db.query(Plan).first()
    variant = None
    if payload.variant_name:
        variant = db.query(Variant).filter(Variant.variant_name == payload.variant_name).first() or db.query(Variant).first()

    next_sub_id = (db.query(func.max(Subscription.id)).scalar() or 0) + 1
    sub_num = payload.subscription_number or f"SUB-{1000 + next_sub_id}"

    new_sub = Subscription(
        id=next_sub_id,
        subscription_number=sub_num,
        customer_id=user.id,
        customer_name=user.name,
        customer_email=user.email,
        plan_id=plan.id if plan else None,
        product_id=plan.product_id if plan else None,
        variant_id=variant.id if variant else None,
        plan_name=payload.plan_name,
        variant_name=payload.variant_name or "Standard Brand License",
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        tax_amount=payload.tax_amount,
        discount_amount=0.0,
        total_amount=payload.total_amount,
        status="Quotation",
        created_at=payload.created_at or date.today().isoformat(),
        expiry_date=payload.expiry_date or "Pending Activation"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return {
        "status": "success",
        "subscription_number": new_sub.subscription_number,
        "id": new_sub.id,
        "subscription": {
            "id": new_sub.id,
            "subscription_number": new_sub.subscription_number,
            "status": new_sub.status,
            "total_amount": new_sub.total_amount
        }
    }

@router.get("/customer/subscriptions")
def list_customer_subscriptions_endpoint(
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Subscription)
    if email:
        query = query.filter(Subscription.customer_email == email)
    return query.order_by(Subscription.id.desc()).all()
