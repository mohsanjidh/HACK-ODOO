@echo off
echo ========================================================
echo  Brightloop Subscription Management System
echo  Odoo x Make-A-Ton 9.0 Kochi Hackathon 2026
echo ========================================================
echo.

echo [1/3] Checking SQLite database...
if not exist "backend\brightloop.db" (
    echo Database not found. Seeding authentic synthetic dataset...
    python data\synthetic\seed.py
) else (
    echo Database found: backend\brightloop.db
)

echo.
echo [2/3] Starting FastAPI Backend server on http://127.0.0.1:8000 ...
echo [3/3] Opening Brightloop Platform in browser...
start http://127.0.0.1:8000

python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
