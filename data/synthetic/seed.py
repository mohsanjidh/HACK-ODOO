"""
Brightloop Database Seeder Script
Loads the authentic synthetic dataset (CSVs) into the local SQLite database.
Usage: python data/synthetic/seed.py
"""

import csv
import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "brightloop.db")
DATA_DIR = os.path.dirname(__file__)

def read_csv(filename):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, mode="r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def seed_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    print(f"Connecting to database at {DB_PATH}...")

    # Create tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        company_name TEXT,
        company_size TEXT,
        industry TEXT,
        phone TEXT,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL DEFAULT 'pbkdf2_sha256$600000$default_demo_hash',
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        billing_period TEXT NOT NULL,
        price REAL NOT NULL,
        min_qty INTEGER NOT NULL DEFAULT 1,
        auto_close INTEGER NOT NULL DEFAULT 0,
        pausable INTEGER NOT NULL DEFAULT 1,
        renewable INTEGER NOT NULL DEFAULT 1,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS variants (
        id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        extra_price REAL NOT NULL DEFAULT 0.0,
        notes TEXT
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY,
        subscription_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        customer_name TEXT,
        customer_email TEXT,
        plan_id INTEGER,
        plan_name TEXT,
        variant_name TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        start_date TEXT,
        expiry_date TEXT,
        FOREIGN KEY(customer_id) REFERENCES users(id),
        FOREIGN KEY(plan_id) REFERENCES plans(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        subscription_number TEXT,
        customer_name TEXT,
        customer_email TEXT,
        amount REAL NOT NULL,
        tax_amount REAL NOT NULL,
        discount_amount REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL,
        due_date TEXT,
        invoice_date TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY,
        invoice_number TEXT,
        amount REAL NOT NULL,
        payment_method TEXT,
        payment_date TEXT,
        status TEXT,
        reference_note TEXT,
        FOREIGN KEY(invoice_number) REFERENCES invoices(invoice_number)
    );
    """)

    # Populate tables
    print("Seeding Users...")
    for u in read_csv("customers.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO users (id, name, email, company_name, company_size, industry, phone, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (u["id"], u["name"], u["email"], u["company_name"], u["company_size"], u["industry"], u["phone"], u["role"], u["signup_date"]))

    print("Seeding Plans...")
    for p in read_csv("plans.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO plans (id, name, category, billing_period, price, min_qty, auto_close, pausable, renewable, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p["id"], p["name"], p["category"], p["billing_period"], float(p["price"]), int(p["min_qty"]), int(p["auto_close"]), int(p["pausable"]), int(p["renewable"]), p["description"]))

    print("Seeding Variants...")
    for v in read_csv("variants.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO variants (id, product_name, variant_name, extra_price, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (v["id"], v["product_name"], v["variant_name"], float(v["extra_price"]), v["notes"]))

    print("Seeding Subscriptions...")
    for s in read_csv("subscriptions.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO subscriptions (id, subscription_number, customer_id, customer_name, customer_email, plan_id, plan_name, variant_name, quantity, unit_price, tax_amount, total_amount, status, start_date, expiry_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (s["id"], s["subscription_number"], s["customer_id"], s["customer_name"], s["customer_email"], s["plan_id"], s["plan_name"], s["variant_name"], int(s["quantity"]), float(s["unit_price"]), float(s["tax_amount"]), float(s["total_amount"]), s["status"], s["start_date"], s["expiry_date"]))

    print("Seeding Invoices...")
    for inv in read_csv("invoices.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO invoices (id, invoice_number, subscription_number, customer_name, customer_email, amount, tax_amount, discount_amount, status, due_date, invoice_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (inv["id"], inv["invoice_number"], inv["subscription_number"], inv["customer_name"], inv["customer_email"], float(inv["amount"]), float(inv["tax_amount"]), float(inv["discount_amount"]), inv["status"], inv["due_date"], inv["invoice_date"]))

    print("Seeding Payments...")
    for p in read_csv("payments.csv"):
        cursor.execute("""
            INSERT OR REPLACE INTO payments (id, invoice_number, amount, payment_method, payment_date, status, reference_note)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (p["id"], p["invoice_number"], float(p["amount"]), p["payment_method"], p["payment_date"], p["status"], p["reference_note"]))

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
