# 🚀 BRIGHTLOOP SUBSCRIPTION MANAGEMENT SYSTEM
## Team Implementation Plan & Work Distribution
**Event:** Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026  
**Repository:** https://github.com/mohsanjidh/HACK-ODOO.git  
**Target Branch:** `main` (STRICT: All work on `main`, no secondary branches!)

---

## ⚠️ MANDATORY HEADS-UP INSTRUCTIONS (READ FIRST!)

Welcome team! Please follow these exact steps before writing a single line of code:

### 1. Repository Setup & Clone
```bash
git clone https://github.com/mohsanjidh/HACK-ODOO.git
cd HACK-ODOO
```

### 2. Configure Your Git Identity (CRITICAL FOR Q&A EVALUATION)
The evaluators (**mebh-odoo** / **hackathon-odoo**) will inspect individual git commits and hold an afternoon Q&A based on **your specific commits**. Make sure your local git is configured with your name and GitHub email:
```bash
# Example for Mrinal:
git config user.name "MRINAL V"
git config user.email "<your-github-registered-email>"

# Example for D Haritha:
git config user.name "D Haritha"
git config user.email "<your-github-registered-email>"
```

### 3. Hourly Commit & Push Rule (Official Hackathon Requirement)
- You **MUST** commit and push your work to `main` **at least once every 1 hour**.
- Always do `git pull --rebase origin main` before pushing to avoid conflicts.
- Keep commits focused and clearly titled with your name (e.g. `feat(auth): add password regex validation [Mrinal]`).

### 4. Strict Rule: Maintain `CHANGELOG.md`
- Every time you build, edit, or fix a feature, **you MUST update `CHANGELOG.md`** under your designated section before committing.
- Format: `[TIME] - [YOUR NAME]: Added <feature details> in <filename>`.
- Code changes without a corresponding changelog entry are considered incomplete.

---

## 👥 MODULE OWNERSHIP & FILE ASSIGNMENTS

To avoid merge conflicts, every member has exclusive ownership over specific files and services. Do not edit another member's files without coordinating!

```
HACK/
├── backend/
│   ├── core/
│   │   ├── config.py           ➔ [Mohammed Sanjidh S] App settings & CORS
│   │   ├── database.py         ➔ [Mohammed Sanjidh S] SQLAlchemy engine & sessions
│   │   ├── security.py         ➔ [Mohammed Sanjidh S] JWT tokens & Bcrypt hashing
│   │   └── rbac.py             ➔ [MRINAL V] Role guards (Admin/Staff/Customer)
│   ├── models/
│   │   ├── user.py             ➔ [MRINAL V] User & Role models
│   │   ├── tax.py              ➔ [MRINAL V] Tax rule definitions
│   │   ├── discount.py         ➔ [MRINAL V] Discount rule models
│   │   ├── product.py          ➔ [Dharshin R] Product & Variant (+ price deltas)
│   │   ├── plan.py             ➔ [Dharshin R] Plan models & billing cycles
│   │   ├── subscription.py     ➔ [Dharshin R] Subscriptions & line items
│   │   ├── invoice.py          ➔ [Dharshin R] Invoices & tax totals
│   │   └── payment.py          ➔ [Dharshin R] Payments & invoice matching
│   ├── schemas/                ➔ [Shared by Owners] Pydantic request/response schemas
│   ├── services/
│   │   ├── tax_engine.py       ➔ [MRINAL V] Automated tax calculation rules
│   │   ├── discount_engine.py  ➔ [MRINAL V] Auto-apply discounts, limits, expiry
│   │   ├── billing_engine.py   ➔ [Dharshin R] Batch billing run & anti-duplicate guard
│   │   ├── lifecycle.py        ➔ [Dharshin R] Subscription state machine (Draft->Closed)
│   │   └── payment_service.py  ➔ [Dharshin R] Payment recording & balance reconciliation
│   ├── routers/
│   │   ├── auth.py             ➔ [MRINAL V] Register, Login, Password Reset
│   │   ├── discounts.py        ➔ [MRINAL V] Admin discount rule CRUD
│   │   ├── taxes.py            ➔ [MRINAL V] Admin tax rule CRUD
│   │   ├── products.py         ➔ [Dharshin R] Product catalog & variants CRUD
│   │   ├── plans.py            ➔ [Dharshin R] Plan definitions & lifecycle flags
│   │   ├── subscriptions.py    ➔ [Dharshin R] Quotes, conversion, pause/renew
│   │   ├── invoices.py         ➔ [Dharshin R] Due billing run, confirm, cancel, print
│   │   ├── payments.py         ➔ [Dharshin R] Record incoming payment & match
│   │   └── dashboard.py        ➔ [Dharshin R] Finance Lead metrics (MRR, ARR, overdue)
│   ├── main.py                 ➔ [Mohammed Sanjidh S] FastAPI root app & routing
│   └── requirements.txt        ➔ [Mohammed Sanjidh S] Python dependencies
├── frontend/
│   ├── css/
│   │   └── styles.css          ➔ [D Haritha] Design system (Teal theme, responsive)
│   ├── js/
│   │   ├── api.js              ➔ [D Haritha] Centralized fetch client & JWT storage
│   │   ├── views/
│   │   │   ├── auth.js         ➔ [D Haritha] Login / Register modal & password validator
│   │   │   ├── catalog.js      ➔ [D Haritha] Product/Plan cards & variant pricing
│   │   │   ├── subs.js         ➔ [D Haritha] Quotation builder & subscription manager
│   │   │   ├── invoices.js     ➔ [D Haritha] Invoices list, billing trigger, payment modal
│   │   │   ├── dashboard.js    ➔ [D Haritha] Finance Lead analytics & charts (<2s speed)
│   │   │   └── portal.js       ➔ [D Haritha] Customer self-service dashboard
│   │   └── app.js              ➔ [D Haritha] Navigation, role-based tab routing
│   └── index.html              ➔ [D Haritha] Clean responsive SPA container
├── IMPLEMENTATION_PLAN.md      ➔ [Team Master Plan]
├── CHANGELOG.md                ➔ [Team Master Changelog]
└── README.md                   ➔ [Mohammed Sanjidh S] Quickstart & verification
```

---

## 🎯 INDIVIDUAL SCOPES & REQUIREMENTS

### 1. Mohammed Sanjidh S (Architecture & Infrastructure)
- [ ] Initialize FastAPI project structure with CORS and global error handlers.
- [ ] Setup SQLite database with SQLAlchemy 2.0 sync session management.
- [ ] Implement JWT token generation/decoding and bcrypt password hashing utilities.
- [ ] Prepare `requirements.txt` and root `run.bat` for one-click startup.
- [ ] Assemble `README.md` with setup guide, demo credentials, and architectural highlights.

### 2. MRINAL V (Authentication, RBAC, Taxes & Discounts)
- [ ] **Strict Password Rules**: Enforce regex (>8 chars, 1 uppercase, 1 lowercase, 1 special character) on registration.
- [ ] **Unique Email Validation**: Prevent duplicate accounts.
- [ ] **Password Reset Endpoint**: Mock secure token generation and email dispatch.
- [ ] **Role Protection (RBAC)**: Admin (full access + create staff), Staff (operational), Customer (portal only).
- [ ] **Admin Tax Engine**: Configurable tax rules (e.g. GST 18%, VAT 5%) applied automatically to invoices.
- [ ] **Dynamic Discount Engine**: Fixed or percentage discounts, minimum quantity/spend thresholds, date validity, maximum usage caps, auto-apply on next billing cycle without manual effort.

### 3. Dharshin R (Product Catalog, State Machine, Billing & Finance)
- [ ] **Product & Variants**: Base products + attribute variants with dynamic price deltas (e.g. Odoo brand adds +560).
- [ ] **Subscription Plans**: Daily, Weekly, Monthly, Yearly cycles, min quantity, validity dates, auto-close / pause / renew flags.
- [ ] **Quotation Templates**: Pre-configured product lines for fast quote generation.
- [ ] **Subscription Lifecycle**: Strict state machine: `Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`.
- [ ] **Automated Billing Engine**: Idempotent batch billing run that generates invoices for all due active subscriptions with zero duplicates.
- [ ] **Payment Reconciliation**: Record payment method, amount, date, and note; link directly to invoices and mark as `Paid`.
- [ ] **Finance Lead Analytics**: Fast aggregation (<2s) of MRR, ARR, active subscriber count, and filterable overdue invoices list.

### 4. D Haritha (Frontend UI, User Portals & Analytics Views)
- [ ] **Responsive Design System**: Consistent Teal palette (`#017E84`), modern cards, accessible forms, clean typography.
- [ ] **Auth & Role Shell**: Dynamic sidebar/navbar showing only permitted actions per role (Admin vs Staff vs Customer).
- [ ] **Live Validation UI**: Visual checklist showing password requirements turning green as user types.
- [ ] **Interactive Quotation & Plan Builder**: Variant picker updating prices in real-time.
- [ ] **Billing Operations Panel**: One-click "Run Billing" button with real-time feedback and printable invoice preview.
- [ ] **Finance Lead Dashboard**: High-impact KPI metric cards (MRR, Overdue amount, Active count) with date and status filters.
- [ ] **Customer Portal**: Self-service interface for logged-in customers to view their active plans, download invoices, and view receipts.

---

## ⏰ EXECUTION TIMELINE

| Time Window | Target Milestone | Commit Checkpoint |
| :--- | :--- | :--- |
| **10:00 - 11:30 AM** | Core Foundation, Auth, Models & Frontend Shell | **Commit 1 (All members)** |
| **11:30 - 01:00 PM** | Products, Plans, Subscriptions & Quotation UI | **Commit 2 (All members)** |
| **01:00 - 02:30 PM** | Automated Billing Engine, Tax & Discount Engines | **Commit 3 (All members)** |
| **02:30 - 03:30 PM** | Payment Reconciliation, Invoicing, Portal Views | **Commit 4 (All members)** |
| **03:30 - 04:30 PM** | Finance Lead Dashboard (<2s response) & Stress Test | **Commit 5 (All members)** |
| **04:30 - 05:00 PM** | End-to-End Polish, Final Walkthrough, Readme & Video | **Final Submission Push** |

---

> [!IMPORTANT]
> **Remember:** Whenever you finish a task, add your entry into `CHANGELOG.md`, run your tests, and push immediately to `main`!
