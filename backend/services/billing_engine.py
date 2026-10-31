from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models.models import Subscription, Invoice

def run_automated_billing(db: Session) -> dict:
    """
    Automated Billing Run:
    Finds all Active subscriptions that are due for billing.
    Applies idempotency check: Never bills twice for the same subscription period.
    Generates new invoices automatically with customer and line details pre-filled.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Query active subscriptions
    active_subs = db.query(Subscription).filter(Subscription.status == "Active").all()
    
    generated_count = 0
    skipped_count = 0
    total_billed = 0.0
    created_invoices = []
    
    # Get highest existing invoice number to sequence correctly
    last_inv = db.query(Invoice).order_by(Invoice.id.desc()).first()
    next_id = (last_inv.id + 1) if last_inv else 1

    for sub in active_subs:
        # Check if an invoice was already generated for this subscription cycle
        existing_invoice = db.query(Invoice).filter(
            Invoice.subscription_number == sub.subscription_number,
            Invoice.due_date == sub.expiry_date
        ).first()

        if existing_invoice:
            skipped_count += 1
            continue # Anti-duplicate guard: already invoiced for this period!

        # Determine invoice status (Overdue if expiry date was in the past, Confirmed if current)
        is_overdue = sub.expiry_date < today_str if sub.expiry_date else False
        inv_status = "Overdue" if is_overdue else "Confirmed"
        
        inv_number = f"INV-{3000 + next_id}"
        
        new_inv = Invoice(
            id=next_id,
            invoice_number=inv_number,
            subscription_number=sub.subscription_number,
            customer_name=sub.customer_name,
            customer_email=sub.customer_email,
            amount=sub.total_amount,
            tax_amount=sub.tax_amount,
            discount_amount=0.0,
            status=inv_status,
            due_date=sub.expiry_date,
            invoice_date=today_str
        )
        
        db.add(new_inv)
        created_invoices.append(inv_number)
        generated_count += 1
        total_billed += sub.total_amount
        next_id += 1

    db.commit()

    return {
        "status": "success",
        "billing_date": today_str,
        "subscriptions_scanned": len(active_subs),
        "invoices_generated": generated_count,
        "duplicates_skipped": skipped_count,
        "total_amount_billed": round(total_billed, 2),
        "sample_invoices": created_invoices[:5]
    }
