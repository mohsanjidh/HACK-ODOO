"""
Brightloop Database Seeder Script
Loads the authentic synthetic dataset (CSVs or JSON) into the local SQLite database.
Usage:
    python data/synthetic/seed.py          # Seeds from CSVs
    python data/synthetic/seed.py --json   # Seeds from hackathon sample JSON
    python data/synthetic/seed.py --reset  # Drops tables first and re-seeds
"""

import csv
import json
import os
import sys
from datetime import datetime, date

# Ensure root directory is on Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.core.database import Base, engine, SessionLocal
from backend.models import (
    User,
    Product,
    Variant,
    Plan,
    TaxRule,
    DiscountRule,
    Subscription,
    SubscriptionLine,
    Invoice,
    InvoiceLine,
    Payment,
)

DATA_DIR = CURRENT_DIR
SAMPLE_JSON_PATHS = [
    os.path.join(PROJECT_ROOT, "subscription-sample-database-1k-en_GB-v2.json"),
    os.path.join(os.path.dirname(PROJECT_ROOT), "subscription-sample-database-1k-en_GB-v2.json"),
    os.path.join(r"c:\Users\harim\Desktop\odo", "subscription-sample-database-1k-en_GB-v2.json"),
]


def read_csv(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        return []
    with open(filepath, mode="r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def seed_database(reset: bool = False, use_json: bool = False):
    print(f"[Seeder] Preparing database schema (reset={reset})...")
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded and not reset
        existing_users = db.query(User).count()
        if existing_users > 0 and not reset:
            print(f"[Seeder] Database already contains {existing_users} users. Skipping seed.")
            return

        print("[Seeder] Populating default Taxes & Discount rules...")
        # 1. Tax Rules
        tax_18 = TaxRule(id=1, name="GST 18%", rate=18.0, description="Standard Indian Service GST", is_active=True)
        tax_12 = TaxRule(id=2, name="GST 12%", rate=12.0, description="Reduced IT Services GST", is_active=True)
        tax_5 = TaxRule(id=3, name="GST 5%", rate=5.0, description="Essential Digital Service GST", is_active=True)
        db.merge(tax_18)
        db.merge(tax_12)
        db.merge(tax_5)

        # 2. Discount Rules
        disc_welcome = DiscountRule(
            id=1,
            name="Welcome Offer",
            code="WELCOME10",
            discount_type="percentage",
            type="percentage",
            value=10.0,
            min_purchase=1000.0,
            min_quantity=1,
            max_uses=500,
            usage_limit=500,
            used_count=12,
            scope="subscription",
            is_active=True,
            active=True,
        )
        disc_yearly = DiscountRule(
            id=2,
            name="Annual Commitment Saver",
            code="ANNUAL20",
            discount_type="percentage",
            type="percentage",
            value=20.0,
            min_purchase=5000.0,
            min_quantity=1,
            max_uses=200,
            usage_limit=200,
            used_count=35,
            scope="subscription",
            is_active=True,
            active=True,
        )
        disc_flat = DiscountRule(
            id=3,
            name="Kochi Hackathon Flat 500",
            code="HACK500",
            discount_type="fixed",
            type="fixed",
            value=500.0,
            min_purchase=2000.0,
            min_quantity=1,
            max_uses=1000,
            usage_limit=1000,
            used_count=8,
            scope="subscription",
            is_active=True,
            active=True,
        )
        db.merge(disc_welcome)
        db.merge(disc_yearly)
        db.merge(disc_flat)

        # 3. Default Products
        prod_erp = Product(
            id=1,
            name="Brightloop ERP Core",
            type="Business Software",
            sales_price=2999.0,
            cost_price=900.0,
            notes="Core ERP platform for multi-tier enterprise recurring billing.",
            is_active=True,
        )
        prod_pos = Product(
            id=2,
            name="Brightloop POS & Retail",
            type="Business Software",
            sales_price=1999.0,
            cost_price=600.0,
            notes="Point-of-sale and omni-channel retail inventory management suite.",
            is_active=True,
        )
        prod_dev = Product(
            id=3,
            name="Brightloop Developer Sandbox",
            type="Testing",
            sales_price=499.0,
            cost_price=100.0,
            notes="Instant high-speed developer sandbox environment.",
            is_active=True,
        )
        db.merge(prod_erp)
        db.merge(prod_pos)
        db.merge(prod_dev)

        # 4. Default Variants
        var_std = Variant(
            id=1,
            product_id=1,
            product_name="Brightloop ERP Core",
            variant_name="Standard Brand",
            name="Standard Brand",
            extra_price=0.0,
            sku="BL-VAR-001",
            notes="Standard cloud instance",
            is_active=True,
        )
        var_odoo = Variant(
            id=2,
            product_id=1,
            product_name="Brightloop ERP Core",
            variant_name="Odoo Enterprise Brand",
            name="Odoo Enterprise Brand",
            extra_price=560.0,  # Official Hackathon requirement: Odoo Brand variant +560.0
            sku="BL-VAR-ODOO",
            notes="Odoo-branded co-hosted enterprise instance",
            is_active=True,
        )
        var_multi = Variant(
            id=3,
            product_id=2,
            product_name="Brightloop POS & Retail",
            variant_name="Multi-Counter Sync",
            name="Multi-Counter Sync",
            extra_price=750.0,
            sku="BL-VAR-POS-MULTI",
            notes="Unlimited terminal real-time synchronization",
            is_active=True,
        )
        db.merge(var_std)
        db.merge(var_odoo)
        db.merge(var_multi)
        db.commit()

        # Check for JSON seeding
        json_path = None
        for p in SAMPLE_JSON_PATHS:
            if os.path.exists(p):
                json_path = p
                break

        if use_json and json_path:
            seed_from_json(db, json_path)
        else:
            seed_from_csv(db)

        # Ensure essential demo customer account exists
        demo_customer = db.query(User).filter(User.email == "meera.bhat1@sterlingca.com").first()
        if not demo_customer:
            meera = User(
                id=1,
                name="Meera Bhat",
                email="meera.bhat1@sterlingca.com",
                company_name="Sterling Capital",
                company_size="Medium",
                industry="Finance",
                phone="+91 98218 15434",
                role="customer",
                password_hash="pbkdf2_sha256$600000$demo_hash",
                created_at="2026-01-15",
            )
            db.merge(meera)
            db.commit()

        db.commit()
        print(f"[Seeder] SUCCESS! Users: {db.query(User).count()}, Plans: {db.query(Plan).count()}, Subscriptions: {db.query(Subscription).count()}, Invoices: {db.query(Invoice).count()}, Payments: {db.query(Payment).count()}")

    except Exception as e:
        db.rollback()
        print(f"[Seeder] ERROR during seeding: {e}")
        raise
    finally:
        db.close()


def seed_from_csv(db):
    print("[Seeder] Seeding from CSV files...")
    # Customers
    customers_data = read_csv("customers.csv")
    for u in customers_data:
        is_staff = u.get("role") == "staff"
        user = User(
            id=int(u["id"]),
            name=u["name"],
            email=u["email"],
            company_name=u.get("company_name"),
            company_size=u.get("company_size", "small"),
            industry=u.get("industry", "Tech"),
            phone=u.get("phone", "+91 98450 12345"),
            role=u.get("role", "customer"),
            password_hash="pbkdf2_sha256$600000$demo_hash",
            created_at=u.get("signup_date", "2026-01-15"),
            commission_rate=7.5 if is_staff else 5.0,
            assigned_plan="All Plans" if is_staff else "None",
            total_commission_earned=28450.0 if is_staff else 0.0,
        )
        db.merge(user)

    # Plans
    plans_data = read_csv("plans.csv")
    staff_names = ["Arjun Nair", "Pooja Hegde", "Rahul Sharma", "Sneha Menon"]
    for idx, p in enumerate(plans_data):
        pid = int(p["id"])
        assigned_staff = staff_names[idx % len(staff_names)]
        plan = Plan(
            id=pid,
            product_id=1 if "ERP" in p["name"] else (2 if "Retail" in p["name"] or "POS" in p["name"] else 3),
            plan_code=f"BL-PLN-{pid:03d}",
            name=p["name"],
            category=p.get("category", "Retail"),
            billing_period=p.get("billing_period", "monthly"),
            price=float(p["price"]),
            min_qty=int(p.get("min_qty", 1)),
            auto_close=int(p.get("auto_close", 0)),
            pausable=int(p.get("pausable", 1)),
            renewable=int(p.get("renewable", 1)),
            description=p.get("description", ""),
            subscriber_limit=150,
            revenue_limit=750000.0,
            discount_deadline="2026-12-31",
            assigned_staff_id=2,
            assigned_staff_name=assigned_staff,
            is_active=True,
            payment_terms_days=30,
        )
        db.merge(plan)

    # Variants
    variants_data = read_csv("variants.csv")
    for v in variants_data:
        vid = int(v["id"])
        variant = Variant(
            id=vid,
            product_id=1,
            product_name=v.get("product_name", "Brightloop ERP Core"),
            variant_name=v["variant_name"],
            name=v["variant_name"],
            extra_price=float(v.get("extra_price", 0.0)),
            sku=f"BL-VAR-{vid:03d}",
            notes=v.get("notes", ""),
            is_active=True,
        )
        db.merge(variant)

    db.commit()

    # Subscriptions & Lines
    subs_data = read_csv("subscriptions.csv")
    for s in subs_data:
        sid = int(s["id"])
        qty = int(s.get("quantity", 1))
        unit_price = float(s.get("unit_price", 0.0))
        tax_amt = float(s.get("tax_amount", 0.0))
        total_amt = float(s.get("total_amount", unit_price * qty + tax_amt))
        pid = int(s.get("plan_id", 1))

        sub = Subscription(
            id=sid,
            subscription_number=s["subscription_number"],
            customer_id=int(s["customer_id"]) if s.get("customer_id") else None,
            customer_name=s.get("customer_name"),
            customer_email=s.get("customer_email"),
            plan_id=pid,
            product_id=1,
            variant_id=1,
            plan_name=s.get("plan_name"),
            variant_name=s.get("variant_name", "Standard Brand"),
            quantity=qty,
            unit_price=unit_price,
            tax_amount=tax_amt,
            discount_amount=0.0,
            total_amount=total_amt,
            status=s.get("status", "Active"),
            start_date=s.get("start_date", "2026-01-01"),
            expiry_date=s.get("expiry_date", "2026-12-31"),
            next_billing_date=s.get("expiry_date", "2026-12-31"),
            payment_terms_days=30,
            auto_renew=True,
        )
        db.merge(sub)

        # Create SubscriptionLine
        line = SubscriptionLine(
            id=sid,
            subscription_id=sid,
            product_id=1,
            variant_id=1,
            quantity=qty,
            unit_price=unit_price,
            tax_id=1,
            tax_amount=tax_amt,
            discount_amount=0.0,
            amount=total_amt,
            description=f"{s.get('plan_name')} ({s.get('variant_name', 'Standard')})",
        )
        db.merge(line)

    db.commit()

    # Invoices & Lines
    invoices_data = read_csv("invoices.csv")
    for inv in invoices_data:
        iid = int(inv["id"])
        amt = float(inv.get("amount", 0.0))
        tax_amt = float(inv.get("tax_amount", 0.0))
        disc_amt = float(inv.get("discount_amount", 0.0))
        subtot = amt - tax_amt + disc_amt

        # Find matching subscription
        sub_num = inv.get("subscription_number")
        sub_obj = db.query(Subscription).filter(Subscription.subscription_number == sub_num).first()
        cust_id = sub_obj.customer_id if sub_obj else None

        invoice = Invoice(
            id=iid,
            invoice_number=inv["invoice_number"],
            subscription_id=sub_obj.id if sub_obj else 1,
            subscription_number=sub_num,
            customer_id=cust_id,
            customer_name=inv.get("customer_name"),
            customer_email=inv.get("customer_email"),
            plan_name=sub_obj.plan_name if sub_obj else "Brightloop Plan",
            amount=amt,
            subtotal=round(subtot, 2),
            tax_amount=tax_amt,
            tax_total=tax_amt,
            discount_amount=disc_amt,
            discount_total=disc_amt,
            total=amt,
            total_amount=amt,
            currency="INR",
            status=inv.get("status", "Paid"),
            due_date=inv.get("due_date", "2026-02-15"),
            invoice_date=inv.get("invoice_date", "2026-01-15"),
            payment_terms_days=30,
            discount_rule_id=1 if disc_amt > 0 else None,
            payment_method="Credit Card",
            paid_at=inv.get("invoice_date", "2026-01-15") if inv.get("status") == "Paid" else None,
        )
        db.merge(invoice)

        # Create InvoiceLine
        inv_line = InvoiceLine(
            id=iid,
            invoice_id=iid,
            product_id=1,
            variant_id=1,
            description=f"Subscription Billing — {sub_num}",
            quantity=1,
            unit_price=subtot,
            tax_id=1,
            tax_amount=tax_amt,
            discount_amount=disc_amt,
            line_total=amt,
        )
        db.merge(inv_line)

    db.commit()

    # Payments
    payments_data = read_csv("payments.csv")
    for p in payments_data:
        pid = int(p["id"])
        inv_num = p.get("invoice_number")
        inv_obj = db.query(Invoice).filter(Invoice.invoice_number == inv_num).first()

        pmt = Payment(
            id=pid,
            payment_reference=f"BL-PAY-{pid:05d}",
            invoice_id=inv_obj.id if inv_obj else None,
            invoice_number=inv_num,
            customer_id=inv_obj.customer_id if inv_obj else None,
            amount=float(p.get("amount", 0.0)),
            payment_method=p.get("payment_method", "Credit Card"),
            method=p.get("payment_method", "Credit Card"),
            payment_date=p.get("payment_date", "2026-01-16"),
            status=p.get("status", "Successful"),
            reference_note=p.get("reference_note", "Settled via automated gateway"),
            note=p.get("reference_note", "Settled via automated gateway"),
        )
        db.merge(pmt)

    db.commit()


def seed_from_json(db, json_path):
    print(f"[Seeder] Loading from JSON: {json_path}...")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Map auxiliary tables from JSON
    profiles = {p["user_id"]: f"{p.get('first_name', '')} {p.get('last_name', '')}".strip() for p in data.get("user_profiles", []) if "user_id" in p}
    roles_map = {r["role_id"]: r.get("role_name", "customer") for r in data.get("roles", []) if "role_id" in r}
    user_roles = {ur["user_id"]: roles_map.get(ur.get("role_id"), "customer") for ur in data.get("user_roles", []) if "user_id" in ur}

    # 1. Users
    for u in data.get("users", []):
        uid = int(u["user_id"])
        raw_role = user_roles.get(uid, "customer")
        if raw_role in ["owner", "admin"]:
            role = "admin"
        elif raw_role in ["member", "manager", "staff"]:
            role = "staff"
        else:
            role = "customer"

        name = profiles.get(uid) or u.get("user_name", f"User {uid}").replace("_", " ")
        user = User(
            id=uid,
            name=name,
            email=u.get("email") or f"user{uid}@brightloop.io",
            company_name=f"{name}'s Enterprise",
            company_size="Medium",
            industry="Software & IT",
            phone="+91 98450 12345",
            role=role,
            password_hash=u.get("password_hash") or "pbkdf2_sha256$600000$demo_hash",
            created_at=u.get("registration_date", "2024-01-15"),
            commission_rate=7.5 if role == "staff" else 5.0,
            assigned_plan="All Plans" if role == "staff" else "None",
            total_commission_earned=14200.0 if role == "staff" else 0.0,
        )
        db.merge(user)

    # 2. Plans (JSON key is 'subscriptions')
    for p in data.get("subscriptions", []):
        pid = int(p["subscription_id"])
        price = float(p.get("price") or 999.0)
        raw_interval = p.get("interval", "month").lower()
        if raw_interval in ["month", "monthly"]:
            period = "monthly"
        elif raw_interval in ["year", "yearly", "annual"]:
            period = "yearly"
        elif raw_interval in ["week", "weekly"]:
            period = "weekly"
        else:
            period = "daily"

        plan = Plan(
            id=pid,
            product_id=1,
            plan_code=f"BL-PLN-{pid:03d}",
            name=p.get("subscription_name") or f"Plan {pid}",
            category="Cloud Enterprise",
            billing_period=period,
            price=price,
            min_qty=1,
            auto_close=0,
            pausable=1,
            renewable=1,
            description=p.get("description", "Enterprise recurring plan"),
            subscriber_limit=250,
            revenue_limit=1500000.0,
            assigned_staff_id=2,
            assigned_staff_name="Arjun Nair",
            is_active=True,
            payment_terms_days=30,
        )
        db.merge(plan)

    db.commit()

    # 3. User Subscriptions (JSON key is 'user_subscriptions')
    for us in data.get("user_subscriptions", []):
        sid = int(us["user_subscription_id"])
        uid = int(us.get("user_id", 1))
        pid = int(us.get("subscription_id", 1))
        plan_obj = db.get(Plan, pid)
        user_obj = db.get(User, uid)
        price = plan_obj.price if plan_obj else 999.0
        tax = round(price * 0.18, 2)
        total = round(price + tax, 2)

        sub = Subscription(
            id=sid,
            subscription_number=f"SUB-JSON-{sid:04d}",
            customer_id=uid,
            customer_name=user_obj.name if user_obj else f"Customer #{uid}",
            customer_email=user_obj.email if user_obj else f"cust{uid}@brightloop.io",
            plan_id=pid,
            product_id=1,
            variant_id=1,
            plan_name=plan_obj.name if plan_obj else f"Plan #{pid}",
            variant_name="Standard Brand",
            quantity=1,
            unit_price=price,
            tax_amount=tax,
            discount_amount=0.0,
            total_amount=total,
            status=us.get("status", "active").capitalize(),
            start_date=us.get("start_date", "2024-01-01"),
            expiry_date=us.get("end_date", "2026-12-31"),
            next_billing_date=us.get("end_date", "2026-12-31"),
            payment_terms_days=30,
            auto_renew=True,
        )
        db.merge(sub)

        line = SubscriptionLine(
            id=sid,
            subscription_id=sid,
            product_id=1,
            variant_id=1,
            quantity=1,
            unit_price=price,
            tax_id=1,
            tax_amount=tax,
            discount_amount=0.0,
            amount=total,
            description=f"Subscription: {sub.plan_name}",
        )
        db.merge(line)

    db.commit()

    # 4. Invoices (JSON key is 'billing_invoices')
    for inv in data.get("billing_invoices", []):
        iid = int(inv["invoice_id"])
        us_id = int(inv.get("user_subscription_id") or 1)
        sub_obj = db.get(Subscription, us_id)
        cust_id = sub_obj.customer_id if sub_obj else 1
        user_obj = db.get(User, cust_id)
        amt = float(inv.get("total_amount") or 1000.0)
        subtotal = round(amt / 1.18, 2)
        tax = round(amt - subtotal, 2)

        raw_status = inv.get("status", "paid").lower()
        if raw_status in ["paid", "settled", "issued"]:
            status = "Paid"
        elif raw_status in ["overdue"]:
            status = "Overdue"
        elif raw_status in ["cancelled", "void"]:
            status = "Cancelled"
        else:
            status = "Confirmed"

        invoice = Invoice(
            id=iid,
            invoice_number=f"INV-JSON-{iid:05d}",
            subscription_id=us_id,
            subscription_number=sub_obj.subscription_number if sub_obj else f"SUB-JSON-{us_id:04d}",
            customer_id=cust_id,
            customer_name=user_obj.name if user_obj else "Client",
            customer_email=user_obj.email if user_obj else "client@brightloop.io",
            plan_name=sub_obj.plan_name if sub_obj else "Enterprise Plan",
            amount=amt,
            subtotal=subtotal,
            tax_amount=tax,
            tax_total=tax,
            discount_amount=0.0,
            discount_total=0.0,
            total=amt,
            total_amount=amt,
            currency="INR",
            status=status,
            due_date=inv.get("due_date", "2026-02-28"),
            invoice_date=inv.get("invoice_date", "2026-01-28"),
            payment_terms_days=30,
            paid_at=inv.get("invoice_date") if status == "Paid" else None,
        )
        db.merge(invoice)

        line = InvoiceLine(
            id=iid,
            invoice_id=iid,
            product_id=1,
            variant_id=1,
            description=f"Billing for {invoice.subscription_number}",
            quantity=1,
            unit_price=subtotal,
            tax_id=1,
            tax_amount=tax,
            discount_amount=0.0,
            line_total=amt,
        )
        db.merge(line)

    db.commit()

    # 5. Payments
    for pmt in data.get("payments", []):
        pmt_id = int(pmt["payment_id"])
        us_id = int(pmt.get("user_subscription_id") or 1)
        sub_obj = db.get(Subscription, us_id)
        cust_id = sub_obj.customer_id if sub_obj else 1
        inv_obj = db.query(Invoice).filter(Invoice.subscription_id == us_id).first()

        p = Payment(
            id=pmt_id,
            payment_reference=f"PAY-JSON-{pmt_id:05d}",
            invoice_id=inv_obj.id if inv_obj else 1,
            invoice_number=inv_obj.invoice_number if inv_obj else "INV-JSON-00001",
            customer_id=cust_id,
            amount=float(pmt.get("amount") or 500.0),
            payment_method="Card",
            method="Card",
            payment_date=pmt.get("payment_date", "2026-01-15"),
            status="Successful",
            reference_note="Settled via sample dataset import",
            note="Settled via sample dataset import",
        )
        db.merge(p)

    db.commit()


if __name__ == "__main__":
    reset_flag = "--reset" in sys.argv
    json_flag = "--json" in sys.argv
    seed_database(reset=reset_flag, use_json=json_flag)
