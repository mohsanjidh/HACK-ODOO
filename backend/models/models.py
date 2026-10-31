from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Date,
    Text,
)
from sqlalchemy.orm import relationship, synonym
from backend.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), default="demo_hash")
    role = Column(String(20), default="customer", index=True)  # admin, staff, customer
    company_name = Column(String(150), nullable=True)
    company_size = Column(String(50), default="small")
    industry = Column(String(50), default="Tech")
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

    # Staff / admin specific fields
    commission_rate = Column(Float, default=5.0)  # e.g. 5% commission on managed plans
    assigned_plan = Column(String(150), default="All Plans")
    total_commission_earned = Column(Float, default=0.0)

    # Relationships
    subscriptions = relationship("Subscription", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    type = Column(String(80), default="Business Software")
    sales_price = Column(Float, default=2999.00)
    cost_price = Column(Float, default=900.00)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    variants = relationship("Variant", back_populates="product")
    plans = relationship("Plan", back_populates="product")


class Variant(Base):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    product_name = Column(String(150), nullable=True, default="Brightloop ERP Core")
    variant_name = Column(String(150), nullable=False, default="Standard Brand")
    name = Column(String(150), nullable=True, default="Standard Brand")
    extra_price = Column(Float, default=0.0)  # e.g. +560.0 for Odoo brand
    sku = Column(String(80), nullable=True, default="BL-VAR-001")
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    product = relationship("Product", back_populates="variants")


# Alias for backward and forward compatibility
ProductVariant = Variant


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    plan_code = Column(String(50), nullable=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="Retail")  # Retail, Healthcare, Finance, Tech, Testing
    billing_period = Column(String(20), default="monthly")  # daily, weekly, monthly, yearly
    price = Column(Float, nullable=False)
    min_qty = Column(Integer, default=1)
    auto_close = Column(Integer, default=0)  # 1 = true, 0 = false
    pausable = Column(Integer, default=1)
    renewable = Column(Integer, default=1)
    description = Column(Text, nullable=True)
    subscriber_limit = Column(Integer, default=100)
    revenue_limit = Column(Float, default=500000.0)
    discount_deadline = Column(String(50), nullable=True)
    assigned_staff_id = Column(Integer, nullable=True)
    assigned_staff_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    available_from = Column(String(50), nullable=True)
    available_to = Column(String(50), nullable=True)
    payment_terms_days = Column(Integer, default=15)

    product = relationship("Product", back_populates="plans")
    subscriptions = relationship("Subscription", back_populates="plan")


class TaxRule(Base):
    __tablename__ = "tax_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Float, default=18.0)  # 18% GST (or 0.18 decimal)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    subscription_lines = relationship("SubscriptionLine", back_populates="tax")
    invoice_lines = relationship("InvoiceLine", back_populates="tax")


class DiscountRule(Base):
    __tablename__ = "discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, default="Promotional Discount")
    code = Column(String(60), nullable=True, default="PROMO")
    discount_type = Column(String(20), default="percentage")  # percentage, fixed
    type = Column(String(20), default="percentage")
    value = Column(Float, default=10.0)  # 10% or fixed amount
    min_purchase = Column(Float, default=0.0)
    min_quantity = Column(Integer, default=1)
    max_uses = Column(Integer, default=100)
    usage_limit = Column(Integer, default=100)
    used_count = Column(Integer, default=0)
    scope = Column(String(30), default="subscription")  # subscription, product
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    active = Column(Boolean, default=True)

    product = relationship("Product")
    invoices = relationship("Invoice", back_populates="discount_rule")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(60), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(150), nullable=True)
    customer_email = Column(String(150), index=True, nullable=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True)
    plan_name = Column(String(150), nullable=True)
    variant_name = Column(String(150), default="Standard Brand")
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    status = Column(String(30), default="Draft", index=True)  # Draft, Quotation, Confirmed, Active, Closed, Paused
    start_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    next_billing_date = Column(String(50), nullable=True)
    payment_terms_days = Column(Integer, default=15)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

    # Staff attribution
    assigned_staff_id = Column(Integer, nullable=True)
    assigned_staff_name = Column(String(100), nullable=True)

    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    product = relationship("Product")
    variant = relationship("Variant")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")


class SubscriptionLine(Base):
    __tablename__ = "subscription_lines"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    tax_id = Column(Integer, ForeignKey("tax_rules.id"), nullable=True)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    description = Column(String(255), nullable=True)

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")
    variant = relationship("Variant")
    tax = relationship("TaxRule", back_populates="subscription_lines")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(60), unique=True, index=True, nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"), nullable=True, index=True)
    subscription_number = Column(String(60), index=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    customer_name = Column(String(150), nullable=True)
    customer_email = Column(String(150), nullable=True)
    plan_name = Column(String(150), nullable=True)

    # Monetary amounts (support both naming conventions)
    amount = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    discount_total = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")

    status = Column(String(30), default="Draft", index=True)  # Draft, Confirmed, Paid, Overdue, Cancelled, Refunded
    due_date = Column(String(50), nullable=True)
    invoice_date = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))
    payment_terms_days = Column(Integer, default=15)
    discount_rule_id = Column(Integer, ForeignKey("discount_rules.id"), nullable=True)
    payment_method = Column(String(50), nullable=True)
    receipt_url = Column(String(255), nullable=True)
    pdf_path = Column(String(255), nullable=True)
    paid_at = Column(String(50), nullable=True)
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

    customer = relationship("User", back_populates="invoices")
    subscription = relationship("Subscription", back_populates="invoices")
    discount_rule = relationship("DiscountRule", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("variants.id"), nullable=True)
    description = Column(String(255), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    tax_id = Column(Integer, ForeignKey("tax_rules.id"), nullable=True)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product")
    tax = relationship("TaxRule", back_populates="invoice_lines")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_reference = Column(String(60), unique=True, index=True, nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True, index=True)
    invoice_number = Column(String(60), index=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, default=0.0)
    payment_method = Column(String(50), default="Credit Card")  # Card, UPI, Netbanking, Bank Transfer, Cash
    method = Column(String(50), default="Credit Card")
    payment_date = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))
    status = Column(String(30), default="Successful")  # Successful, Pending, Failed
    reference_note = Column(String(255), nullable=True)
    note = Column(String(255), nullable=True)

    invoice = relationship("Invoice", back_populates="payments")
    customer = relationship("User", back_populates="payments")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class QuotationTemplate(Base):
    __tablename__ = "quotation_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, unique=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    validity_days = Column(Integer, default=30)
    default_quantity = Column(Integer, default=1)
    notes = Column(Text, nullable=True)

    plan = relationship("Plan")
