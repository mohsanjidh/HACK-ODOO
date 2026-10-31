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

---

## 🔐 MRINAL V (Synthetic Data, DB Seeder & User Portal Backend)

*(Add your entries below as you develop)*

---

## 🎨 D Haritha (Frontend UI, Dashboard & Portals)

*(Add your entries below as you develop)*

---
