import os
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TEST_DB = ROOT / "backend" / "test_brightloop.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["SEED_ON_STARTUP"] = "true"
os.environ["ENV"] = "test"


def pytest_sessionfinish(session, exitstatus):
    from backend.core.database import engine

    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()
