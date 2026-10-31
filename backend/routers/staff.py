from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import csv
import io

from backend.core.database import get_db
from backend.models.models import Subscription, Plan, Invoice, Payment, User
from backend.services.state_machine import validate_subscription_transition, validate_invoice_transition
from backend.services.billing_engine import run_automated_billing

router = APIRouter(prefix="/api/staff", tags=["Staff Operations Portal"])

class CustomerCreate(BaseModel):
    name: str
    email: str
    company_name: Optional[str] = "Independent Enterprise"
    industry: Optional[str] = "Tech"
    phone: Optional[str] = None

class StatusUpdate(BaseModel):
    new_status: str

class PaymentRecord(BaseModel):
    amount: float
    payment_method: str = "Bank Transfer" # Credit Card, Bank Transfer, UPI, Cash
    reference_note: Optional[str] = "Manual staff reconciliation"

# --- Subscription Management (Email/Inbox View) ---
@router.get("/subscriptions")
def list_subscriptions(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    expiring_soon: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    query = db.query(Subscription).outerjoin(Plan)

    if category and category != "All":
        query = query.filter(Plan.category == category)

    if status and status != "All":
        query = query.filter(Subscription.status == status)

    if search:
        search_filter = or_(
            Subscription.subscription_number.ilike(f"%{search}%"),
            Subscription.customer_name.ilike(f"%{search}%"),
            Subscription.customer_email.ilike(f"%{search}%"),
            Subscription.plan_name.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if expiring_soon:
        # Filter for overdue or expiring within next 7 days
        query = query.filter(Subscription.status == "Active", Subscription.expiry_date <= today_str)

    subs = query.order_by(Subscription.id.desc()).all()

    # Format with status highlights for Staff UI
    result = []
    for s in subs:
        is_overdue = s.expiry_date < today_str if (s.expiry_date and s.status == "Active") else False
        result.append({
            "id": s.id,
            "subscription_number": s.subscription_number,
            "customer_name": s.customer_name,
            "customer_email": s.customer_email,
            "plan_name": s.plan_name,
            "category": s.plan.category if s.plan else "General",
            "variant_name": s.variant_name,
            "quantity": s.quantity,
            "unit_price": s.unit_price,
            "total_amount": s.total_amount,
            "status": s.status,
            "start_date": s.start_date,
            "expiry_date": s.expiry_date,
            "is_overdue": is_overdue
        })

    return {
        "status": "success",
        "total_count": len(result),
        "subscriptions": result
    }

# --- State Machine Status Transition ---
@router.post("/subscriptions/{sub_id}/status")
def update_subscription_status(sub_id: int, status_in: StatusUpdate, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Validate state transition through explicit state machine
    validate_subscription_transition(sub.status, status_in.new_status)

    old_status = sub.status
    sub.status = status_in.new_status
    db.commit()

    return {
        "status": "success",
        "message": f"Subscription {sub.subscription_number} transitioned from {old_status} to {sub.status}",
        "subscription_number": sub.subscription_number,
        "new_status": sub.status
    }

# --- Renewal Reminder Action ---
@router.post("/subscriptions/{sub_id}/send-reminder")
def send_renewal_reminder(sub_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(Subscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Simulated email dispatch
    return {
        "status": "success",
        "message": f"Renewal alert sent to {sub.customer_email} for subscription {sub.subscription_number}.",
        "dispatched_to": sub.customer_email,
        "due_date": sub.expiry_date,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

# --- Billing Day: Run Batch Billing Engine ---
@router.post("/run-billing")
def trigger_batch_billing(db: Session = Depends(get_db)):
    report = run_automated_billing(db)
    return report

# --- Invoices & Payments Operations ---
@router.get("/invoices")
def list_invoices(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Invoice)
    if status and status != "All":
        query = query.filter(Invoice.status == status)
    
    invoices = query.order_by(Invoice.id.desc()).all()
    return invoices

@router.post("/invoices/{inv_id}/reconcile-payment")
def record_invoice_payment(inv_id: int, pay_in: PaymentRecord, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    validate_invoice_transition(inv.status, "Paid")

    inv.status = "Paid"

    new_payment = Payment(
        invoice_number=inv.invoice_number,
        amount=pay_in.amount,
        payment_method=pay_in.payment_method,
        payment_date=datetime.now().strftime("%Y-%m-%d"),
        status="Successful",
        reference_note=pay_in.reference_note
    )
    db.add(new_payment)
    db.commit()

    return {
        "status": "success",
        "message": f"Payment of ₹{pay_in.amount} reconciled for invoice {inv.invoice_number}.",
        "invoice_status": inv.status
    }

# --- Smart Customer CRM & Spreadsheet Center ---
@router.get("/customers")
def list_customers_crm(db: Session = Depends(get_db)):
    """Clean CRM Customer table replacing messy spreadsheets."""
    customers = db.query(User).filter(User.role == "customer").order_by(User.id.desc()).all()
    results = []
    for c in customers:
        subs = db.query(Subscription).filter(Subscription.customer_email == c.email).all()
        invoices = db.query(Invoice).filter(Invoice.customer_email == c.email).all()
        total_spend = sum(inv.amount for inv in invoices if inv.status == "Paid")
        overdue_amt = sum(inv.amount for inv in invoices if inv.status in ["Overdue", "Confirmed"])
        
        results.append({
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "company_name": c.company_name or "Direct B2B Account",
            "industry": c.industry or "Retail",
            "phone": c.phone or "N/A",
            "subscription_count": len(subs),
            "active_plans": ", ".join(list(set(s.plan_name for s in subs))) if subs else "No active plan",
            "total_spend": round(total_spend, 2),
            "overdue_debt": round(overdue_amt, 2),
            "created_at": c.created_at
        })
    return results

@router.post("/customers")
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    """Staff onboard new customer without spreadsheet friction."""
    existing = db.query(User).filter(User.email == customer_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists.")
    
    new_cust = User(
        name=customer_in.name,
        email=customer_in.email,
        company_name=customer_in.company_name,
        industry=customer_in.industry,
        phone=customer_in.phone,
        role="customer",
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_cust)
    db.commit()
    db.refresh(new_cust)
    return {"status": "success", "message": "Customer onboarded successfully", "customer": new_cust}

@router.get("/customers/export-csv")
def export_customers_spreadsheet(db: Session = Depends(get_db)):
    """
    Export clean customer spreadsheet with registered numbers, subscription plans, 
    and payment health.
    """
    customers = db.query(User).filter(User.role == "customer").order_by(User.id.asc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "Customer ID", "Company Name", "Contact Person", "Email Address", "Phone",
        "Industry", "Registered Subscriptions", "Subscribed Plans", "Total Billed (INR)", "Account Status"
    ])
    
    for c in customers:
        subs = db.query(Subscription).filter(Subscription.customer_email == c.email).all()
        invoices = db.query(Invoice).filter(Invoice.customer_email == c.email).all()
        total_spend = sum(inv.amount for inv in invoices if inv.status == "Paid")
        overdue_amt = sum(inv.amount for inv in invoices if inv.status in ["Overdue", "Confirmed"])
        plan_titles = "; ".join(list(set(s.plan_name for s in subs))) if subs else "None"
        
        status_flag = "Overdue Attention" if overdue_amt > 0 else ("Active Subscriber" if subs else "Prospective")
        
        writer.writerow([
            f"CUST-{c.id:04d}",
            c.company_name or "N/A",
            c.name,
            c.email,
            c.phone or "N/A",
            c.industry or "General",
            len(subs),
            plan_titles,
            f"INR {total_spend:,.2f}",
            status_flag
        ])
    
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=brightloop_customers_report.csv"}
    )

# --- Smart Payment Delay Notification Dispatch ---
@router.post("/invoices/{inv_id}/send-payment-reminder")
def send_payment_delay_reminder(inv_id: int, db: Session = Depends(get_db)):
    """
    Clocks out pending/delayed invoices and sends payment delay alert notice.
    """
    inv = db.query(Invoice).filter(Invoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "status": "success",
        "message": f"Payment delay notice dispatched for invoice {inv.invoice_number} (Amount: ₹{inv.amount:,.2f}).",
        "invoice_number": inv.invoice_number,
        "recipient_email": inv.customer_email,
        "amount_due": inv.amount,
        "dispatched_at": timestamp
    }
