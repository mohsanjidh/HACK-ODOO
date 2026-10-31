import uuid

import pytest
from fastapi.testclient import TestClient

from backend.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_health_and_seeded_login(client):
    assert client.get("/health").status_code == 200
    page = client.get("/")
    assert page.status_code == 200
    assert "Brightloop Customer Portal" in page.text
    assert client.get("/static/css/style.css").status_code == 200
    assert client.get("/static/js/api.js").status_code == 200
    assert client.get("/static/js/app.js").status_code == 200
    for email, password, role in (
        ("admin@brightloop.io", "Admin@123", "admin"),
        ("staff@brightloop.io", "Staff@123", "staff"),
        ("meera.bhat1@sterlingca.com", "Customer@123", "customer"),
    ):
        headers = login(client, email, password)
        me = client.get("/api/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["role"] == role


def test_password_policy_duplicate_and_reset(client):
    email = f"tester.{uuid.uuid4().hex[:8]}@example.com"
    weak = client.post(
        "/api/auth/register",
        json={"name": "Weak User", "email": email, "password": "short"},
    )
    assert weak.status_code == 422

    registered = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": "Start@123"},
    )
    assert registered.status_code == 201
    assert client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": "Start@123"},
    ).status_code == 409

    forgot = client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot.status_code == 202
    reset_url = forgot.json()["dev_reset_url"]
    token = reset_url.split("token=")[1]

    reset = client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "Reset@123"},
    )
    assert reset.status_code == 200
    assert client.post(
        "/api/auth/reset-password",
        json={"token": token, "new_password": "Reset@123"},
    ).status_code == 400
    assert client.post(
        "/api/auth/login", json={"email": email, "password": "Start@123"}
    ).status_code == 401
    assert client.post(
        "/api/auth/login", json={"email": email, "password": "Reset@123"}
    ).status_code == 200


def test_catalog_checkout_and_receipt(client):
    headers = login(client, "meera.bhat1@sterlingca.com", "Customer@123")
    plans = client.get("/api/plans")
    assert plans.status_code == 200
    assert len(plans.json()) >= 8

    plan = next(item for item in plans.json() if item["variants"])
    variant = plan["variants"][0]
    checkout = client.post(
        "/api/subscriptions/checkout",
        headers=headers,
        json={
            "plan_id": plan["id"],
            "variant_id": variant["id"],
            "quantity": plan["min_qty"],
            "payment_method": "card",
            "last4": "4242",
        },
    )
    assert checkout.status_code == 201, checkout.text
    payload = checkout.json()
    assert payload["invoice"]["status"] == "paid"
    assert payload["payment"]["amount"] == payload["invoice"]["total"]

    invoices = client.get("/api/invoices", headers=headers)
    assert invoices.status_code == 200
    invoice_id = invoices.json()["items"][0]["id"]
    receipt = client.get(f"/api/invoices/{invoice_id}/receipt", headers=headers)
    assert receipt.status_code == 200
    assert receipt.json()["invoice"]["total"] == payload["invoice"]["total"]


def test_customer_cannot_read_other_customer_records(client):
    first = login(client, "meera.bhat1@sterlingca.com", "Customer@123")
    second = login(client, "rohan.chopra99@finedgecap.com", "Customer@123")

    invoice_id = client.get("/api/invoices", headers=first).json()["items"][0]["id"]
    subscription_id = client.get("/api/subscriptions", headers=first).json()["items"][0]["id"]

    assert client.get(f"/api/invoices/{invoice_id}", headers=second).status_code == 404
    assert client.get(f"/api/subscriptions/{subscription_id}", headers=second).status_code == 404


def test_checkout_rejects_invalid_quantity_and_variant(client):
    headers = login(client, "meera.bhat1@sterlingca.com", "Customer@123")
    plan = next(item for item in client.get("/api/plans").json() if item["min_qty"] > 1)
    response = client.post(
        "/api/subscriptions/checkout",
        headers=headers,
        json={"plan_id": plan["id"], "quantity": 1, "payment_method": "card"},
    )
    assert response.status_code == 400

    response = client.post(
        "/api/subscriptions/checkout",
        headers=headers,
        json={"plan_id": plan["id"], "quantity": plan["min_qty"], "variant_id": 99999},
    )
    assert response.status_code == 400
