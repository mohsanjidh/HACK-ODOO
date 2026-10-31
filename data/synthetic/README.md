# 📁 Synthetic Datasets & Seeder

This directory holds the authentic synthetic data for the Brightloop Subscription Management System, created by **MRINAL V**.

### Expected Files:
1. `customers.csv` (or JSON):
   - `id`, `name`, `email`, `company_name`, `phone`, `role` (`customer`, `staff`, `admin`)
2. `plans.csv`:
   - `id`, `name`, `category` (*Individual, Family, Healthcare, Enterprise, Student*), `billing_cycle` (*monthly, yearly*), `base_price`, `min_qty`, `features`
3. `subscriptions.csv`:
   - `id`, `subscription_number`, `customer_email`, `plan_name`, `status` (*Active, Confirmed, Closed, Expired*), `start_date`, `expiry_date`
4. `invoices.csv`:
   - `id`, `invoice_number`, `subscription_number`, `amount`, `tax_amount`, `discount_amount`, `status` (*Paid, Confirmed, Overdue*), `due_date`, `payment_method`
5. `seed.py`:
   - Python script that reads these files and populates the local SQLite database.

