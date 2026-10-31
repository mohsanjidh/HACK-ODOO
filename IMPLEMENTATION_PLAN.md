# 🚀 BRIGHTLOOP SUBSCRIPTION MANAGEMENT SYSTEM
## Updated Team Implementation Plan & Work Distribution
**Event:** Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026  
**Repository:** https://github.com/mohsanjidh/HACK-ODOO.git  
**Target Branch:** `main` (Strict: All work lands on `main`!)

---

## 📂 PROJECT STRUCTURE & WORKSPACE LAYOUT

```
HACK/
├── backend/
│   ├── core/
│   │   ├── config.py           ➔ [Mohammed Sanjidh S] App settings, JWT secrets & CORS
│   │   ├── database.py         ➔ [Dharshin R] SQLAlchemy 2.0 SQLite engine & sessions
│   │   └── security.py         ➔ [Mohammed Sanjidh S] Bcrypt hashing & JWT utilities
│   ├── models/                 ➔ [Dharshin R] Core DB Models (User, Product, Plan, Sub, Invoice, Payment, Discount, Tax)
│   ├── schemas/                ➔ [Shared] Pydantic request/response validation schemas
│   ├── services/
│   │   ├── billing_engine.py   ➔ [Dharshin R] Automated batch billing run & idempotency guard
│   │   ├── state_machine.py    ➔ [Dharshin R] Subscription lifecycle (Draft->Closed)
│   │   └── discount_engine.py  ➔ [Dharshin R] Discount rules & tax calculations
│   ├── routers/
│   │   ├── admin.py            ➔ [Dharshin R] Admin APIs: Products, Plans, Taxes, Discounts, Finance Metrics
│   │   ├── staff.py            ➔ [Dharshin R] Staff APIs: Subscription categorization, Expiry alerts, Invoicing run
│   │   ├── user.py             ➔ [MRINAL V] Customer Portal APIs: Plan browsing, Checkout, Invoice history
│   │   └── auth.py             ➔ [MRINAL V] Authentication & Password validation endpoints
│   ├── main.py                 ➔ [Mohammed Sanjidh S] FastAPI root application
│   └── requirements.txt        ➔ [Mohammed Sanjidh S] Pinned dependencies
├── data/
│   └── synthetic/              ➔ [MRINAL V] Synthetic Datasets (Customers, Plans, Subscriptions, Invoices CSVs)
│       └── seed.py             ➔ [MRINAL V] Database loader & seeder script
├── frontend/
│   ├── css/
│   │   └── styles.css          ➔ [D Haritha] Responsive Teal design system & modern tables
│   ├── js/
│   │   ├── api.js              ➔ [D Haritha] Centralized Fetch API client
│   │   ├── views/
│   │   │   ├── admin.js        ➔ [D Haritha] Admin UI: Plan creator, rule builder, financial charts
│   │   │   ├── staff.js        ➔ [D Haritha] Staff UI: Email/Inbox style subscription table & renewal actions
│   │   │   └── user.js         ➔ [D Haritha] Customer UI: Plan cards, checkout modal, receipt view
│   │   └── app.js              ➔ [D Haritha] Routing & role switching shell
│   └── index.html              ➔ [D Haritha] Single-page responsive container
├── docs/
│   ├── PROBLEM_STATEMENT.md    ➔ Official hackathon scenario
│   └── EVALUATION_CRITERIA.md  ➔ Must-haves and judging scorecard
├── IMPLEMENTATION_PLAN.md      ➔ Team Master Plan
├── CHANGELOG.md                ➔ Mandatory Cross-Team Changelog
└── README.md                   ➔ Quickstart guide & demo credentials
```

---

## 👥 ROLE & FEATURE DISTRIBUTION

### 1. 🛠️ Dharshin R (Admin & Staff Backend Engines)
* **Core Data Models (`backend/models/`)**:
  - `User`, `Product`, `ProductVariant` (with price delta support, e.g. Odoo brand `+560`), `Plan`, `Subscription`, `Invoice`, `Payment`, `DiscountRule`, `TaxRule`.
* **Admin Engine (`backend/routers/admin.py`)**:
  - CRUD for Products, Plans, Variants, Taxes, and Discounts.
  - Staff onboarding endpoint (*"Only admin can add new staff"*).
  - Executive Finance Analytics: Total Revenue, Investments, Taxes collected, Discounts given, and Overdue Receivables (<2s speed).
* **Staff Engine (`backend/routers/staff.py`)**:
  - Subscription management with category filters (*Student, Family, Healthcare, Enterprise*).
  - Expiry date tracking: Identify upcoming/past expirations and trigger simulated renewal reminders.
  - Automated batch billing trigger (generates draft/confirmed invoices with zero manual typing).

### 2. 🔐 MRINAL V (Synthetic Data, DB Seeder & User Portal Backend)
* **Synthetic Dataset Creation (`data/synthetic/`)**:
  - Create realistic CSV/JSON datasets for Customers, Plans, Subscriptions, and Invoices.
* **Database Integration & Seeder (`data/synthetic/seed.py`)**:
  - Write a Python script to populate the local SQLite database from the synthetic dataset on startup.
* **Customer / User Backend (`backend/routers/user.py` & `auth.py`)**:
  - Public Plan catalog endpoint.
  - Subscription checkout & payment simulation.
  - Invoice/Receipt history endpoint for customer self-service.
  - User registration with strict password rules and unique email checks.

### 3. 🎨 D HARITHA (Frontend UI & Templates)
* **Design & Templates (`frontend/`)**:
  - Unified Teal theme (`#017E84`) with responsive layout.
  - **Admin View**: KPI cards (MRR, Total Revenue, Overdue debt) and plan configuration modals.
  - **Staff View**: Clean **email/inbox-style** subscription list with status badges and quick renewal action buttons.
  - **Customer View**: Interactive plan cards with Monthly/Yearly toggle, payment checkout modal, and offline-accessible printable receipts.
* **Frontend-Backend Integration**:
  - Connect the views to Dharshin's and Mrinal's FastAPI endpoints using `frontend/js/api.js`.

### 4. 👨‍💼 Mohammed Sanjidh S (Base Architecture & Security)
* **Core Infrastructure**:
  - FastAPI app initialization, CORS middleware, global error handling.
  - JWT token utilities and bcrypt password hashing.
  - Root `README.md` and dependency setup.

---

## 🔄 WORKFLOW SEQUENCE
1. **Dharshin** creates the core SQLite database models & schema.
2. **Mrinal** creates the synthetic data files in `data/synthetic/` and writes `seed.py` to populate SQLite.
3. **Dharshin** builds the Admin & Staff backend API routes.
4. **Mrinal** builds the User/Customer backend API routes.
5. **Haritha** builds the 3 frontend views and wires them to the live API.
6. **All members** commit and push their individual files to `main` with entries in `CHANGELOG.md`.
