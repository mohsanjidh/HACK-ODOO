# 🎓 TEAM LEADER (SANJIDH) Q&A DEFENSE GUIDE
*Everything you need to confidently answer the Evaluator (Bhavya / mebh-odoo) in the afternoon session.*

---

## 📌 1. What You Built & Committed (Your Ownership Scope)

As the Team Leader & Systems Architect, you are responsible for the **System Foundation, Core Engine, and Security**:

| File / Component | What It Does (In 1 Sentence) |
| :--- | :--- |
| `backend/main.py` | FastAPI application entrypoint, CORS configuration, and global error handling. |
| `backend/core/config.py` | Centralized environment settings (JWT secret, token expiration, database URI). |
| `backend/core/database.py` | SQLAlchemy 2.0 database engine, sync session maker, and Base ORM declarative model. |
| `backend/core/security.py` | Password hashing using `bcrypt` and JWT token creation/decoding using `python-jose`. |
| `requirements.txt` | Complete backend Python dependencies pinned for offline reproducibility. |
| `README.md` & `IMPLEMENTATION_PLAN.md` | System setup guide, team file ownership, and architectural overview. |

---

## 💬 2. Potential Judge Questions & How to Answer

### Q1: "Why did you choose FastAPI and SQLite instead of Django or a cloud database?"
> **Your Answer:**  
> *"Two reasons: Performance and Reliability. The problem statement explicitly requires every page to respond in under 2 seconds even with thousands of records. FastAPI with local SQLite executes queries in 1 to 5 milliseconds with zero network latency. Furthermore, the evaluation guidelines specifically asked us to 'plan for offline or local solutions and not rely entirely on internet connectivity or cloud-based tools'. If the venue WiFi stutters, our entire system still runs at 100% speed."*

---

### Q2: "How did you implement Authentication and Password Security?"
> **Your Answer:**  
> *"We use industry-standard JWT (JSON Web Tokens) with HS256 encryption. Passwords are never stored in plain text — they are salted and hashed using Bcrypt before touching the database. Registration strictly enforces the problem statement's regex rules: greater than 8 characters, at least one uppercase letter, one lowercase letter, and one special symbol."*

---

### Q3: "How does your team coordinate without merge conflicts on a single `main` branch?"
> **Your Answer:**  
> *"Because the hackathon mandated a single `main` branch with no secondary branches, we instituted strict file-level ownership in our `IMPLEMENTATION_PLAN.md`. I own the core engine and base config, Dharshin owns the subscription lifecycle and billing engine, Mrinal owns the auth and discount rules, and Haritha owns the frontend. Because our file boundaries are completely modular, we pull with rebase and push without collision."*

---

### Q4: "Where are database transactions handled?"
> **Your Answer:**  
> *"Inside `backend/core/database.py`. We use SQLAlchemy's context manager session dependency (`get_db`) with automatic commit and rollback. If any step of an invoice creation or payment settlement fails, the entire transaction rolls back cleanly, ensuring zero dirty or orphaned records."*

---

## 🚀 3. Quick Reference Glossary (Cheat Sheet)
* **JWT (JSON Web Token):** A secure string sent in the `Authorization: Bearer <token>` header that proves who is logged in.
* **Bcrypt:** A one-way cryptographic hash function that makes passwords impossible to reverse-engineer.
* **CORS:** Cross-Origin Resource Sharing middleware that allows the frontend to talk to our FastAPI backend safely.
* **Declarative Base:** SQLAlchemy's base class from which all our database models (`User`, `Product`, `Subscription`) inherit.
