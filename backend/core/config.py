import os

PROJECT_NAME = "Brightloop Subscription Management System"
VERSION = "1.0.0"
API_PREFIX = "/api"

# JWT configuration for future auth
SECRET_KEY = os.getenv("SECRET_KEY", "brightloop-super-secure-jwt-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
