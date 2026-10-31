from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    sales_price: float
    notes: Optional[str] = None
    is_active: bool


class VariantResponse(BaseModel):
    id: int
    name: str
    extra_price: float
    sku: Optional[str] = None
    effective_price: Optional[float] = None


class PlanResponse(BaseModel):
    id: int
    name: str
    category: str
    billing_period: str
    price: float
    min_qty: int
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    auto_close: bool
    pausable: bool
    renewable: bool
    payment_terms_days: int
    description: Optional[str] = None
    product: Optional[ProductResponse] = None
    variants: list[VariantResponse] = []


class SubscriptionLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quantity: int
    unit_price: float
    tax_amount: float
    amount: float
    description: Optional[str] = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subscription_number: str
    plan_id: int
    plan_name: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    tax_amount: float
    total_amount: float
    status: str
    start_date: date
    expiry_date: date
    next_billing_date: Optional[date] = None
    payment_terms_days: int
    auto_renew: bool


class InvoiceLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: Optional[str] = None
    quantity: int
    unit_price: float
    tax_amount: float
    discount_amount: float
    line_total: float


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_reference: str
    amount: float
    method: str
    payment_date: date
    status: str
    note: Optional[str] = None


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_number: str
    subscription_number: Optional[str] = None
    invoice_date: date
    due_date: date
    status: str
    subtotal: float
    discount_total: float
    tax_total: float
    total: float
    currency: str
    is_overdue: bool = False
    balance_due: float = 0.0


class SubscriptionDetailResponse(SubscriptionResponse):
    lines: list[SubscriptionLineResponse] = []
    invoices: list[InvoiceResponse] = []


class InvoiceDetailResponse(InvoiceResponse):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    lines: list[InvoiceLineResponse] = []
    payments: list[PaymentResponse] = []


class ReceiptResponse(BaseModel):
    company: dict
    customer: dict
    invoice: InvoiceDetailResponse
    amount_paid: float
    balance_due: float


class CheckoutRequest(BaseModel):
    plan_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(gt=0)
    start_date: Optional[date] = None
    payment_method: str = "card"
    note: Optional[str] = None
    last4: Optional[str] = Field(default=None, min_length=4, max_length=4, pattern=r"^\d{4}$")


class CheckoutResponse(BaseModel):
    subscription: SubscriptionResponse
    invoice: InvoiceDetailResponse
    payment: PaymentResponse
    next_billing_date: Optional[date] = None


class SubscriptionListResponse(BaseModel):
    items: list[SubscriptionResponse]
    total: int
    page: int
    page_size: int


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    page_size: int


class PaymentListResponse(BaseModel):
    items: list[PaymentResponse]
    total: int
    page: int
    page_size: int


class CustomerSummary(BaseModel):
    active_subscriptions: int
    total_subscriptions: int
    paid_revenue: float
    outstanding_amount: float
    overdue_invoices: int
    next_billing_date: Optional[date] = None
