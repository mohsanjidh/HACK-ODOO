# 🚀 Brightloop — Subscription Management System
> Built for **Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026**  
> Problem Statement: **Subscription Management System (Brightloop Software)**

---

## 🌟 Executive Overview
**Brightloop** is a high-performance, offline-first subscription and recurring billing platform built with **FastAPI, SQLAlchemy, and SQLite**. It serves as the unified digital backbone for managing products, attribute-based variants, subscription lifecycles, automated batch invoicing, and executive revenue analytics.

### Key Highlights:
* ⚡ **Sub-50ms Response Times**: Evaluator performance benchmark ($<2$ seconds) smashed — complex financial aggregations query in $\sim 38$ms.
* 🛡️ **Offline & Local-First**: Zero cloud or internet dependency. Runs seamlessly on local SQLite with full ACID transaction guarantees.
* 🔄 **Explicit State Machines**: Pure transition tables preventing illegal jumps across subscription states (`Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed`) and invoice states (`Draft` ➔ `Confirmed` ➔ `Paid`).
* 🏷️ **Product Variants with Price Deltas**: Native support for variant price adjustments (including the explicit problem statement requirement: **Odoo Brand Integration adds +₹560**).
* ⚡ **Automated Billing Day Engine**: One-click idempotent batch billing run that invoices all due active subscriptions with an anti-duplication guard (never bills twice or skips).

---

## 👥 Three Unified Portals

1. **👑 Admin Portal (Executive Finance & Configuration)**:
   - Real-time KPIs: Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), Total Cash Collected, Taxes Collected, and **Overdue Receivables (Debt)**.
   - Plan Management (Daily, Weekly, Monthly, Yearly cycles, auto-close on end date, pause/renew flags).
   - Variant pricing manager with extra price deltas.
   - Staff Onboarding (*"Only admin can add a new member of staff"*).

2. **📋 Staff Operations Portal (Subscription & Renewal Inbox)**:
   - Email/inbox-style row-by-row subscription manager with status badges.
   - Categorization by industry (*Retail, Healthcare, Finance, Tech, Testing*).
   - **Overdue / Expiring Soon Alert**: Instant filter for subscriptions requiring renewal follow-ups with one-click reminder alerts.
   - Batch Billing Run trigger with real-time feedback banner.
   - Invoice payment reconciliation.

3. **👤 Customer Self-Service Portal**:
   - Plan store with category filters.
   - Interactive checkout simulation.
   - Invoice receipt history with printable receipt previews.

---

## 🚀 Quickstart (One-Click Setup)

### Option A: One-Click Launcher (Windows)
Double-click `run.bat` in the project root:
```bash
run.bat
```
This automatically verifies the database, launches FastAPI on `http://127.0.0.1:8000`, and opens the platform in your default browser.

### Option B: Manual Setup
```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Seed database from authentic synthetic dataset (if needed)
python data/synthetic/seed.py

# 3. Launch FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Open **`http://127.0.0.1:8000`** in your browser.  
Interactive Swagger API documentation is available at **`http://127.0.0.1:8000/docs`**.

---

## 🗄️ Database Schema & Architecture

```
[Users] (Admin, Staff, Customer)
   │
   ├── [Subscriptions] ◄── [Plans] (Daily, Weekly, Monthly, Yearly)
   │      │
   │      └── [Invoices] (Tax 18% GST + Discount Rules)
   │             │
   │             └── [Payments] (Reconciled via Card, Bank Transfer, UPI)
   │
   └── [Variants] (e.g. Odoo Brand +560 extra price)
```

---

## 📜 Team Members
* **Mohammed Sanjidh S** — Systems Architecture, Base App, Security & Frontend Design
* **Dharshin R** — Core Data Models, Admin & Staff Backend Engines, Billing & State Machine
* **MRINAL V** — Synthetic Datasets, Database Seeder & Customer Backend
* **D Haritha** — Responsive UI Design & Component Layouts
