from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    company_name = Column(String(150), nullable=True)
    company_size = Column(String(50), default="small")
    industry = Column(String(50), default="Tech")
    phone = Column(String(50), nullable=True)
    role = Column(String(20), default="customer") # admin, staff, customer
    password_hash = Column(String(255), default="demo_hash")
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

    subscriptions = relationship("Subscription", back_populates="customer")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="Retail") # Retail, Healthcare, Finance, Tech, Testing
    billing_period = Column(String(20), default="monthly") # daily, weekly, monthly, yearly
    price = Column(Float, nullable=False)
    min_qty = Column(Integer, default=1)
    auto_close = Column(Integer, default=0) # 1 = true, 0 = false
    pausable = Column(Integer, default=1)
    renewable = Column(Integer, default=1)
    description = Column(Text, nullable=True)

    subscriptions = relationship("Subscription", back_populates="plan")

class Variant(Base):
    __tablename__ = "variants"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(150), nullable=False)
    variant_name = Column(String(150), nullable=False)
    extra_price = Column(Float, default=0.0) # e.g. +560.0 for Odoo brand
    notes = Column(Text, nullable=True)

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"))
    customer_name = Column(String(150))
    customer_email = Column(String(150), index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    plan_name = Column(String(150))
    variant_name = Column(String(150), default="Standard Brand")
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    status = Column(String(30), default="Draft", index=True) # Draft, Quotation, Confirmed, Active, Closed, Paused
    start_date = Column(String(50))
    expiry_date = Column(String(50))

    customer = relationship("User", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    subscription_number = Column(String(50), index=True)
    customer_name = Column(String(150))
    customer_email = Column(String(150))
    amount = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    status = Column(String(30), default="Draft", index=True) # Draft, Confirmed, Paid, Overdue, Cancelled
    due_date = Column(String(50))
    invoice_date = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), ForeignKey("invoices.invoice_number"), index=True)
    amount = Column(Float, default=0.0)
    payment_method = Column(String(50), default="Credit Card") # Credit Card, Bank Transfer, UPI, Cash
    payment_date = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))
    status = Column(String(30), default="Successful")
    reference_note = Column(String(200), nullable=True)

class DiscountRule(Base):
    __tablename__ = "discount_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    discount_type = Column(String(20), default="percentage") # percentage, fixed
    value = Column(Float, default=10.0) # 10% or 1000
    min_purchase = Column(Float, default=0.0)
    min_quantity = Column(Integer, default=1)
    max_uses = Column(Integer, default=100)
    used_count = Column(Integer, default=0)
    scope = Column(String(30), default="subscription") # subscription, product
    is_active = Column(Boolean, default=True)

class TaxRule(Base):
    __tablename__ = "tax_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Float, default=18.0) # 18% GST
    is_active = Column(Boolean, default=True)
