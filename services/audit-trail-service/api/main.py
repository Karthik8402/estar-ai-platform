"""Audit Trail Service — FastAPI entry point.

Run with:
    uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from db.database import engine
from db.models import Base
from agents.scheduler import start_scheduler, stop_scheduler

# Import route modules
from api.routes import health, summary, activity, anomalies, integrity, reports, agents, config_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables if they don't exist. Shutdown: cleanup."""
    settings = get_settings()

    # Auto-create tables (development convenience — use Alembic in production)
    Base.metadata.create_all(bind=engine)
    print(f"🚀 {settings.SERVICE_NAME} v{settings.SERVICE_VERSION} starting on port {settings.SERVICE_PORT}")
    print(f"📦 Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'configured'}")
    print(f"🤖 AI Provider: {settings.AI_PROVIDER}")

    start_scheduler()

    yield

    stop_scheduler()
    print(f"👋 {settings.SERVICE_NAME} shutting down")


# ─── App Setup ─────────────────────────────────────────────
app = FastAPI(
    title="Audit Trail Service — MS-1",
    description="Multi-agent AI system monitoring audit trails for 21 CFR Part 11 compliance",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Route Registration ───────────────────────────────────
# Mandatory contract endpoints (no prefix — mounted at root)
app.include_router(health.router, tags=["Contract"])
app.include_router(summary.router, tags=["Contract"])
app.include_router(activity.router, tags=["Contract"])

# Dashboard-specific endpoints
app.include_router(anomalies.router, tags=["Anomalies"])
app.include_router(integrity.router, tags=["Integrity"])
app.include_router(reports.router, tags=["Reports"])
app.include_router(agents.router, tags=["Agents"])
app.include_router(config_routes.router, tags=["Config"])


@app.get("/", tags=["Root"])
def root():
    return {
        "service": "audit-trail-service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
