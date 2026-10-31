from fastapi import HTTPException

# Explicit Subscription State Machine Transition Table
# Draft -> Quotation -> Confirmed -> Active -> Closed / Paused
SUBSCRIPTION_TRANSITIONS = {
    "Draft": {"Quotation", "Confirmed", "Closed"},
    "Quotation": {"Confirmed", "Draft", "Closed"},
    "Confirmed": {"Active", "Closed"},
    "Active": {"Paused", "Closed"},
    "Paused": {"Active", "Closed"},
    "Closed": set(), # Terminal state
}

# Explicit Invoice State Machine Transition Table
# Draft -> Confirmed -> Paid (or Overdue / Cancelled)
INVOICE_TRANSITIONS = {
    "Draft": {"Confirmed", "Cancelled"},
    "Confirmed": {"Paid", "Overdue", "Cancelled"},
    "Overdue": {"Paid", "Cancelled"},
    "Paid": set(), # Terminal state
    "Cancelled": set(), # Terminal state
}

def validate_subscription_transition(current_status: str, new_status: str) -> None:
    allowed = SUBSCRIPTION_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Illegal subscription state transition from '{current_status}' to '{new_status}'. Allowed transitions: {list(allowed)}"
        )

def validate_invoice_transition(current_status: str, new_status: str) -> None:
    allowed = INVOICE_TRANSITIONS.get(current_status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Illegal invoice state transition from '{current_status}' to '{new_status}'. Allowed transitions: {list(allowed)}"
        )
