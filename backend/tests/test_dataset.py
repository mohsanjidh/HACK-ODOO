from decimal import Decimal

from data.synthetic.seed import BASE_DIR, read_csv, validate_dataset


def load_dataset():
    data = {
        "customers": read_csv("customers.csv"),
        "products": read_csv("products.csv"),
        "variants": read_csv("variants.csv"),
        "plans": read_csv("plans.csv"),
        "taxes": read_csv("taxes.csv"),
        "discounts": read_csv("discounts.csv"),
        "subscriptions": read_csv("subscriptions.csv"),
        "subscription_lines": read_csv("subscription_lines.csv"),
        "invoices": read_csv("invoices.csv"),
        "invoice_lines": read_csv("invoice_lines.csv"),
        "payments": read_csv("payments.csv"),
        "templates": read_csv("quotation_templates.csv"),
    }
    data["users"] = data["customers"]
    return data


def test_dataset_files_exist():
    for name in (
        "customers.csv",
        "products.csv",
        "variants.csv",
        "plans.csv",
        "taxes.csv",
        "discounts.csv",
        "subscriptions.csv",
        "subscription_lines.csv",
        "invoices.csv",
        "invoice_lines.csv",
        "payments.csv",
        "quotation_templates.csv",
    ):
        assert (BASE_DIR / name).exists()


def test_dataset_is_internally_consistent():
    data = load_dataset()
    validate_dataset(data)
    assert len(data["customers"]) == 102
    assert len(data["plans"]) == 8
    assert len(data["variants"]) == 5
    assert len(data["subscriptions"]) == 100
    assert len(data["invoices"]) == 72
    assert len(data["payments"]) == 50


def test_discount_demo_rows_exist():
    invoices = read_csv("invoices.csv")
    discounted = [row for row in invoices if Decimal(row["discount_total"]) > 0]
    assert len(discounted) == 5
    for row in discounted:
        assert Decimal(row["total"]) == (
            Decimal(row["subtotal"]) - Decimal(row["discount_total"]) + Decimal(row["tax_total"])
        )
