import time
from backend.core.database import SessionLocal
from backend.models.models import User, Plan, Subscription, Invoice, Payment
from backend.routers import admin, staff, auth, user, user_extensions
from backend.routers.user_extensions import CustomerQuotationCreate, create_customer_quotation_endpoint
from backend.routers.auth import UserLogin, login_user, get_customer_dashboard_profile
from backend.routers.staff import StatusUpdate, update_subscription_status, list_subscriptions, trigger_batch_billing
from backend.services.billing_engine import run_automated_billing

def run_integration_suite():
    db = SessionLocal()
    print("=" * 60)
    print("🚀 RUNNING END-TO-END INTEGRATION TEST SUITE (HACK-ODOO)")
    print("=" * 60)

    # 1. Test Static Asset Files Existence
    import os
    frontend_dir = "frontend"
    assets_to_check = [
        "frontend/index.html",
        "frontend/css/styles.css",
        "frontend/js/app.js",
        "frontend/assets/brightloop-logo-transparent.png",
        "frontend/assets/favicon.ico",
        "frontend/assets/favicon-32x32.png",
    ]
    for asset in assets_to_check:
        assert os.path.exists(asset), f"Missing required asset: {asset}"
    print("✅ [1/7] Frontend UI assets, logos, and stylesheets verified.")

    # 2. Test Auth & Personas
    for role, email in [
        ("admin", "admin@brightloop.local"),
        ("staff", "staff@brightloop.local"),
        ("customer", "meera.bhat1@sterlingca.com")
    ]:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            # create demo user if not present
            u = User(name=f"Demo {role.title()}", email=email, role=role, password_hash="demo_hash")
            db.add(u)
            db.commit()
        res = login_user(UserLogin(email=email, password="AnyPassword"), db=db)
        assert res["status"] == "success"
        assert res["user"]["role"] == role
    print("✅ [2/7] 1-Click Persona & Demo Authentication verified.")

    # 3. Test Customer Profile API
    profile_data = get_customer_dashboard_profile("meera.bhat1@sterlingca.com", db=db)
    assert profile_data["status"] == "success"
    assert "financials" in profile_data
    assert "subscriptions" in profile_data
    assert "invoices" in profile_data
    print(f"✅ [3/7] Customer Profile API verified (Invested: ₹{profile_data['financials']['total_invested']}, Overdue: ₹{profile_data['financials']['total_overdue']}).")

    # 4. Test Customer Quotation Submission (New UI Modal -> Backend)
    quote_payload = CustomerQuotationCreate(
        customer_email="meera.bhat1@sterlingca.com",
        customer_name="Meera Bhat",
        plan_name="Brightloop ERP Core",
        variant_name="Odoo Enterprise Brand",
        quantity=2,
        unit_price=3559.0, # 2999 + 560
        tax_amount=1281.24,
        total_amount=8399.24,
        status="Quotation",
        expiry_date="2026-12-31"
    )
    quote_res = create_customer_quotation_endpoint(quote_payload, db=db)
    assert quote_res["status"] == "success"
    new_sub_num = quote_res["subscription_number"]
    assert new_sub_num.startswith("SUB-")
    print(f"✅ [4/7] Customer Quotation created in SQLite: {new_sub_num} (Status: Quotation).")

    # 5. Test Staff Operations: List & State Machine Progression
    staff_subs = list_subscriptions(db=db)
    found_sub = next((s for s in staff_subs["subscriptions"] if s["subscription_number"] == new_sub_num), None)
    assert found_sub is not None, "Quotation not found in staff subscription list"
    assert found_sub["status"] == "Quotation"

    # Advance state machine: Quotation -> Confirmed -> Active
    update_subscription_status(found_sub["id"], StatusUpdate(new_status="Confirmed"), db=db)
    sub_in_db = db.query(Subscription).filter(Subscription.id == found_sub["id"]).first()
    assert sub_in_db.status == "Confirmed"

    update_subscription_status(found_sub["id"], StatusUpdate(new_status="Active"), db=db)
    db.refresh(sub_in_db)
    assert sub_in_db.status == "Active"
    print(f"✅ [5/7] Explicit State Machine verified: Quotation ➔ Confirmed ➔ Active.")

    # 6. Test Automated Batch Billing Run (Idempotent)
    billing_res = run_automated_billing(db=db)
    assert billing_res["status"] == "success"
    assert "invoices_generated" in billing_res
    assert "duplicates_skipped" in billing_res

    # Second billing run should skip all (idempotency guard)
    second_billing = run_automated_billing(db=db)
    assert second_billing["invoices_generated"] == 0, "Idempotency violated: duplicate invoices generated"
    print(f"✅ [6/7] Batch Billing Engine & Idempotency Guard verified ({billing_res['invoices_generated']} invoices generated, {second_billing['duplicates_skipped']} duplicates skipped).")

    # 7. Test Admin Executive Metrics (<2000ms speed benchmark)
    t0 = time.perf_counter()
    metrics = admin.get_executive_metrics(db=db)
    dt_ms = (time.perf_counter() - t0) * 1000
    assert metrics["status"] == "success"
    assert metrics["metrics"]["mrr"] > 0
    assert dt_ms < 2000.0
    print(f"✅ [7/7] Admin Financial Metrics verified in {dt_ms:.2f} ms (MRR: ₹{metrics['metrics']['mrr']:,.2f}, ARR: ₹{metrics['metrics']['arr']:,.2f}).")

    print("\n" + "=" * 60)
    print("🎉 ALL 7/7 INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_integration_suite()
