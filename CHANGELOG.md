# 📜 BRIGHTLOOP SYSTEM CHANGELOG

All team members must log every code change, module creation, and bug fix here prior to pushing to `main`. Keep entries organized under your respective section with timestamps and files modified.

---

## 👨‍💼 Mohammed Sanjidh S (Architecture, Base Setup & Frontend Design)

- **[10:15 AM]** Created `IMPLEMENTATION_PLAN.md` with team work distribution, heads-up onboarding guide, and file ownership boundaries.
- **[10:15 AM]** Initialized `CHANGELOG.md` for mandatory cross-team change tracking.
- **[12:00 PM]** Defined 3-page UI system architecture and template specifications (Admin, Staff, Customer views) in collaboration with D Haritha.

---

## 🛠️ Dharshin R (Admin & Staff Backend, Data Models & Architecture)

- **[10:42 AM]** Added official hackathon reference documentation in `docs/`:
  - `PROBLEM_STATEMENT.md`: Complete Brightloop Software requirements and scenes.
  - `EVALUATION_CRITERIA.md`: Mandatory Must-Have, Nice-to-Have, and evaluator rules (single branch `main`, hourly commits).
- **[11:55 AM]** Restructured `IMPLEMENTATION_PLAN.md` based on team alignment:
  - Created `data/synthetic/` directory for dataset.
  - Allocated Admin & Staff backend engines to Dharshin.
  - Allocated User/Customer backend & DB Seeder to Mrinal.
  - Allocated responsive 3-page UI system to Haritha.
- **[12:10 PM]** Generated and committed complete synthetic business datasets in `data/synthetic/`:
  - `customers.csv`: 102 authentic customer records across Small, Medium, and Large companies across Healthcare, Finance, Retail, and Tech. Includes default Admin and Staff accounts.
  - `plans.csv`: 8 realistic plans across all 4 billing frequencies (Daily, Weekly, Monthly, Yearly) with flags (`auto_close`, `pausable`, `renewable`).
  - `variants.csv`: Product variant definitions including **Odoo Brand Integration (+560 extra price)**.
  - `subscriptions.csv`: 100 subscriptions across lifecycle states (Draft, Quotation, Confirmed, Active, Closed) with overdue and expiring flags.
  - `invoices.csv` & `payments.csv`: 72 invoices and 50 payment reconciliations.
  - `seed.py`: Automated SQLite seeder script.
- **[12:33 PM]** Built and verified full Admin & Staff backend and interactive UI system:
  - `backend/core/database.py` & `config.py`: SQLite connection engine and session management.
  - `backend/models/models.py`: Declarative SQLAlchemy models (User, Plan, Variant, Subscription, Invoice, Payment, Rules).
  - `backend/services/state_machine.py`: Explicit transition tables for Subscriptions (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`) and Invoices (`Draft` ➔ `Confirmed` ➔ `Paid`).
  - `backend/services/billing_engine.py`: Automated batch billing run with anti-duplication idempotency guard.
  - `backend/routers/admin.py`: Executive finance dashboard metrics (<55ms query time), Plan CRUD, Variant CRUD (+560 Odoo brand delta), and Staff onboarding.
  - `backend/routers/staff.py`: Email/inbox subscription list with category filters (Healthcare, Retail, Finance, Tech, Testing), expiry tracking, simulated renewal alerts, batch billing trigger, and payment reconciliation.
  - `frontend/index.html`, `styles.css`, `app.js`: Responsive Teal UI with instant role switching across Admin, Staff, and Customer views.
  - `run.bat` & `README.md`: One-click startup launcher and comprehensive documentation.
- **[12:43 PM]** Updated `IMPLEMENTATION_PLAN.md`: Marked all Admin & Staff backend deliverables as completed and verified.
- **[12:46 PM]** Executed end-to-end automated verification test suite:
  - 8/8 Tests Passed (100% Success).
  - Verified sub-55ms query execution speed (benchmarking at 15.7ms to 32ms, well within <2s requirement).
  - Verified explicit state machine blocking illegal transitions.
  - Verified automated batch billing idempotency guard (zero duplicate invoices).
  - Live server started on `http://127.0.0.1:8000` with interactive UI and Swagger API docs at `/docs`.
- **[01:00 PM]** Implemented Authentication, Access Control & Password Policy System:
  - `backend/routers/auth.py`: Registration, Login, Forgot Password, and Demo Accounts endpoints.
  - Implemented Scene 1 strict password validation (> 8 characters, uppercase, lowercase, special character).
  - Enforced unique email constraint across all user accounts.
  - Implemented simulated forgot-password reset token generator and dispatch.
  - Added frontend auth state management, Sign In modal with 1-click demo logins, Create Account modal with live interactive password strength validator, and Forgot Password modal.
  - Enforced Role-Based Access Control (RBAC) navigation gating based on logged-in user role.
  - Verified 10/10 test cases in automated verification suite.

---

## 🔐 MRINAL V (Synthetic Data, DB Seeder & User Portal Backend)

*(Add your entries below as you develop)*

---

## 🎨 D Haritha (Frontend UI, Dashboard & Portals)

*(Add your entries below as you develop)*

---
