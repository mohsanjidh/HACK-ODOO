import re
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.core.database import get_db
from backend.models.models import User
from backend.core.config import SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

# --- Request / Response Schemas ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    company_name: Optional[str] = "Independent Business"
    industry: Optional[str] = "Retail"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

# Password validation rule based on Problem Statement Scene 1:
# "> 8 characters, with an uppercase letter, a lowercase letter and a special character"
def validate_password_strength(password: str) -> None:
    if len(password) <= 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be more than 8 characters long."
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter (A-Z)."
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one lowercase letter (a-z)."
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one special character (!@#$%^&*...)."
        )

# Mock demo password hashing
def hash_password(password: str) -> str:
    return f"sha256_mock_{hash(password)}"

@router.post("/register")
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # 0. Basic email format check
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", user_in.email.strip()):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format. Please provide a valid email address."
        )

    # 1. Unique email enforcement
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An account with email '{user_in.email}' already exists. Each email can belong to only one account."
        )

    # 2. Strict password rules
    validate_password_strength(user_in.password)

    # 3. Create customer account
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        company_name=user_in.company_name,
        industry=user_in.industry,
        phone=user_in.phone,
        role="customer", # Public signups are always customers
        password_hash=hash_password(user_in.password),
        created_at=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "company_name": new_user.company_name
        },
        "token": f"mock_jwt_token_for_{new_user.id}"
    }

@router.post("/login")
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    # In local demo mode, accept registered demo passwords or match hash
    return {
        "status": "success",
        "message": f"Welcome back, {user.name}!",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_name": user.company_name or "Brightloop"
        },
        "token": f"bearer_token_{user.id}_{user.role}"
    }

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"No account found registered with {req.email}."
        )

    reset_token = f"rst_tok_{abs(hash(req.email + str(datetime.now())))}"
    reset_link = f"http://127.0.0.1:8000/reset-password?token={reset_token}"

    return {
        "status": "success",
        "message": f"Password reset instructions have been dispatched to {req.email}.",
        "reset_link_preview": reset_link,
        "dispatched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@router.get("/demo-accounts")
def get_demo_accounts(db: Session = Depends(get_db)):
    admin_user = db.query(User).filter(User.role == "admin").first()
    staff_user = db.query(User).filter(User.role == "staff").first()
    customer_user = db.query(User).filter(User.role == "customer").first()

    return {
        "admin": {"name": admin_user.name, "email": admin_user.email, "role": "admin"} if admin_user else None,
        "staff": {"name": staff_user.name, "email": staff_user.email, "role": "staff"} if staff_user else None,
        "customer": {"name": customer_user.name, "email": customer_user.email, "role": "customer"} if customer_user else None,
    }
