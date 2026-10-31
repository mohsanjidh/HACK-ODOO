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
│   │   ├── config.py           ➔ [Dharshin R] App settings, JWT secrets & CORS
│   │   ├── database.py         ➔ [Mohammed Sanjidh S] SQLAlchemy 2.0 SQLite engine & sessions
│   │   └── security.py         ➔ [Dharshin R] Bcrypt hashing & JWT utilities
│   ├── models/                 ➔ [Mohammed Sanjidh S] Core DB Models (User, Product, Plan, Sub, Invoice, Payment, Discount, Tax)
│   ├── schemas/                ➔ [Shared] Pydantic request/response validation schemas
│   ├── services/
│   │   ├── billing_engine.py   ➔ [Mohammed Sanjidh S] Automated batch billing run & idempotency guard
│   │   ├── state_machine.py    ➔ [Mohammed Sanjidh S] Subscription lifecycle (Draft->Closed)
│   │   └── discount_engine.py  ➔ [Mohammed Sanjidh S] Discount rules & tax calculations
│   ├── routers/
│   │   ├── admin.py            ➔ [Mohammed Sanjidh S] Admin APIs: Products, Plans, Taxes, Discounts, Finance Metrics
│   │   ├── staff.py            ➔ [Mohammed Sanjidh S] Staff APIs: Subscription categorization, Expiry alerts, Invoicing run
│   │   ├── user.py             ➔ [MRINAL V] Customer Portal APIs: Plan browsing, Checkout, Invoice history
│   │   └── auth.py             ➔ [MRINAL V] Authentication & Password validation endpoints
│   ├── main.py                 ➔ [Dharshin R] FastAPI root application
│   └── requirements.txt        ➔ [Dharshin R] Pinned dependencies
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

### 1. 🛠️ Mohammed Sanjidh S (Core Data Models, Admin & Staff Backend Engines, Billing & State Machine)
* **Core Data Models (`backend/models/models.py`)**:
  - [x] Implemented `User`, `Plan`, `Variant`, `Subscription`, `Invoice`, `Payment`, `DiscountRule`, `TaxRule`.
  - [x] Product Variants with price deltas (**Odoo Brand Integration adds +₹560**).
  - [x] Subscription Plans supporting all 4 frequencies (**Daily, Weekly, Monthly, Yearly**) with lifecycle flags.
* **Services & State Machines (`backend/services/`)**:
  - [x] `state_machine.py`: Explicit transition rules (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`).
  - [x] `billing_engine.py`: Automated batch billing run with anti-duplication idempotency guard.
* **Admin Engine (`backend/routers/admin.py`)**:
  - [x] Executive Finance Analytics: MRR, ARR, Total Revenue, Taxes, and Overdue Receivables (<55ms response time, beating <2s benchmark).
  - [x] Plan Management CRUD endpoints.
  - [x] Product Variants management with extra price deltas.
  - [x] Staff Onboarding endpoint (*"Only admin can add new staff"*).
  - [x] Dynamic Tax & Discount rule endpoints.
* **Staff Engine (`backend/routers/staff.py`)**:
  - [x] Email/inbox-style subscription manager with category filters (*Retail, Healthcare, Finance, Tech, Testing*).
  - [x] Expiry tracking with instant overdue alerts and simulated renewal notifications.
  - [x] Batch billing run execution endpoint.
  - [x] Invoice listing & payment reconciliation endpoint.
* **Authentication & Access Control (`backend/routers/auth.py`)**:
  - [x] User registration with unique email enforcement.
  - [x] Scene 1 strict password policy (> 8 chars, uppercase, lowercase, special character).
  - [x] User login & session management with demo accounts (Admin, Staff, Customer).
  - [x] Forgot password simulated reset token generation and email dispatch.
  - [x] Role-Based Access Control (RBAC) navigation gating and interactive auth UI modals.

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
  - Connect the views to Sanjidh's and Mrinal's FastAPI endpoints using `frontend/js/api.js`.

### 4. 👨‍💼 Dharshin R (Systems Architecture, Base App, Security & Frontend Design)
* **Core Infrastructure**:
  - FastAPI app initialization, CORS middleware, global error handling.
  - JWT token utilities and bcrypt password hashing.
  - Root `README.md` and dependency setup.
* **Frontend System Design (Co-lead with D Haritha)**:
  - Architecture of the 3-page interface (Admin, Staff, Customer views).
  - Clean UI template structure with direct form/table bindings to the backend APIs.
  - Ensuring intuitive navigation, clean role switching, and consistent spacing across all 3 portals.

---

## 🔄 WORKFLOW SEQUENCE
1. **Sanjidh** creates the core SQLite database models & schema.
2. **Mrinal** creates the synthetic data files in `data/synthetic/` and writes `seed.py` to populate SQLite.
3. **Sanjidh** builds the Admin & Staff backend API routes.
4. **Mrinal** builds the User/Customer backend API routes.
5. **Haritha** builds the 3 frontend views and wires them to the live API.
6. **All members** commit and push their individual files to `main` with entries in `CHANGELOG.md`.
