# 📄 OFFICIAL PROBLEM STATEMENT
## Subscription Management System (Brightloop Software)
*Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026*

---

## 1. The Challenge
Your task is to build **one unified software platform** that runs the full life of a subscription business, from setting up products and plans to sending invoices, collecting payments, and reporting revenue. Think of it as the digital backbone of a company that earns its money every month, not just once. 

Read the scenes that follow as things that actually happen in an ordinary billing month, and design the system that makes each of them easy.

---

## 2. Meet Brightloop Software
Brightloop Software sells everything on subscription: business software billed by the month or the year, add-ons customers switch on and off, and a few products that come in different variants. Customers range from small shops on a monthly plan to large companies on yearly contracts. 

An admin sets up products, plans, taxes, and discounts, a small internal team handles customers day to day, and customers want to see and manage their own subscriptions without having to email anyone.

### How Things Run Today (The Pain Points)
* **Customer subscriptions:** Tracked in a spreadsheet.
* **Renewals:** Remembered by whoever notices first.
* **Invoices:** Typed up by hand every month.
* **Payments:** Matched to invoices by scrolling through bank statements.
* **Revenue reports:** Built manually at the end of each quarter.
* *Renewals get missed, invoices go out wrong, and nobody can say how much recurring revenue the company actually has.*

---

## 3. A Month at Brightloop (Core Requirements)

### Scene 1: A New Customer Signs Up
* A small business finds Brightloop online and creates an account with their email and a password.
* **Email Rule:** Each email can belong to only one account.
* **Password Rule:** Must be more than eight characters (`> 8`), with at least one uppercase letter, one lowercase letter, and one special character.
* **Forgot Password:** If forgotten, a password reset link should arrive at their registered email.
* **Role-Based Access Control (RBAC):**
  * **Admin:** Controls the whole system, configures plans/taxes/discounts, and can add new staff members.
  * **Staff:** Handles day-to-day work with limited access.
  * **Customer:** Sees only their own subscriptions and invoices through a dedicated portal.

### Scene 2: Launching a New Plan
* Admin adds products with: **Name, Type, Sales Price, Cost Price, and Notes**.
* Offers products in **Variants** (e.g. choosing the *Odoo* brand variant adds `+560` to the base price).
* Defines **Subscription Plans**:
  * Price and Billing Cycle (**Daily, Weekly, Monthly, or Yearly**).
  * Minimum quantity requirement.
  * Availability dates (start and end dates).
  * Lifecycle flags: Auto-close on end, Pause capability, Early-close, or Renew capability.

### Scene 3: Turning a Quote into a Subscription
* Sales reps prepare offers starting from **Quotation Templates** (valid for a set number of days).
* Each subscription gets:
  * Unique subscription number.
  * Customer, Plan, Start Date, Expiry Date, and Payment Terms.
  * Line items: Product, Quantity, Unit Price, Taxes, and Line Amount.
* **Strict State Machine Progression:**
  $$\text{Draft} \longrightarrow \text{Quotation} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Closed}$$
* Anyone on the team should be able to see real-time status.

### Scene 4: Billing Day (Automated Recurring Billing)
* When billing day hits, hundreds of subscriptions are due at once.
* **Zero manual typing:** Invoices must be generated automatically from active due subscriptions, with customer details, lines, taxes, and totals pre-filled.
* **Taxes:** Calculated automatically from rules set by the admin.
* **Idempotency Guard:** Nothing should be billed twice or skipped!
* **Invoice Actions:** Confirm, cancel, send, or print any invoice.
* **Invoice Lifecycle:**
  $$\text{Draft} \longrightarrow \text{Confirmed} \longrightarrow \text{Paid}$$

### Scene 5: A Customer Asks for a Better Price (Dynamic Discounts)
* Only the **Admin** can create discount rules:
  * **Type:** Fixed amount or Percentage.
  * **Conditions:** Minimum purchase amount or Minimum quantity threshold.
  * **Limits:** Start and end dates, maximum usage limit (stops when exhausted).
  * **Scope:** Specific products or the entire subscription.
* **Auto-application:** Once a discount applies, it appears on the next invoice automatically without manual intervention and expires cleanly.

### Scene 6: The Money Comes In (Payment Tracking)
* Payments arrive via different methods and dates.
* Record payments with: **Method, Amount, Date, and Note**, matched directly against the right invoice.
* Real-time visibility into which invoices are paid and which are still outstanding/overdue.

### Scene 7: The Finance Lead at the End of the Month
* Finance lead wants one unified dashboard to see:
  * Number of active subscriptions.
  * Total revenue collected vs. amount still owed.
  * List of overdue invoices with chase filters.
  * Summary view with filters.
* **Performance Requirement:** With thousands of subscriptions on the books, every query and page must respond in **under 2 seconds**!
