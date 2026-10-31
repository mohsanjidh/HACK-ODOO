import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.core.config import PROJECT_NAME, VERSION
from backend.routers import admin, staff, auth

app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description="Unified backend platform for Brightloop Software Subscription Management System."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(staff.router)

# Health Check
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "system": "Brightloop Subscription Management Engine",
        "database": "SQLite Local (Offline-Ready)"
    }

# Favicon Handler
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    svg_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#017E84" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
    return Response(content=svg_icon, media_type="image/svg+xml")

# Mount static frontend directory if it exists
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/", tags=["Frontend"])
    def serve_frontend_root():
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Brightloop backend running. Frontend coming up!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
