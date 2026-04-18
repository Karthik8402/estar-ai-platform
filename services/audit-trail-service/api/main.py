"""Audit Trail Service FastAPI entry point.

Run with:
    uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from agents.scheduler import start_scheduler, stop_scheduler
from api.errors import register_exception_handlers
from api.routes import activity, agents, anomalies, config_routes, health, integrity, reports, summary
from config.settings import get_settings
from db.database import engine
from db.models import Base

logger = logging.getLogger("audit-trail-service")
settings = get_settings()


def _cors_origins() -> list[str]:
    return ["*"] if settings.CORS_ALLOW_ALL else settings.ALLOWED_ORIGINS


def _cors_allow_credentials() -> bool:
    return not settings.CORS_ALLOW_ALL


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create optional development tables and start optional background agents."""
    if settings.AUTO_CREATE_TABLES:
        try:
            Base.metadata.create_all(bind=engine)
        except SQLAlchemyError as exc:
            logger.error("Database startup failed. Check DATABASE_URL and database reachability.", exc_info=True)
            raise RuntimeError(
                "Database connection failed during startup. "
                "Verify DATABASE_URL or configure DATABASE_URL_FALLBACK in .env."
            ) from exc

    logger.info("%s v%s starting on port %s", settings.SERVICE_NAME, settings.SERVICE_VERSION, settings.SERVICE_PORT)
    logger.info(
        "Database: %s",
        settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "configured",
    )
    logger.info("AI provider: %s", settings.AI_PROVIDER)

    if settings.ENABLE_SCHEDULER:
        start_scheduler()
    else:
        logger.info("Background scheduler disabled by ENABLE_SCHEDULER=false")

    yield

    if settings.ENABLE_SCHEDULER:
        stop_scheduler()
    logger.info("%s shutting down", settings.SERVICE_NAME)


app = FastAPI(
    title="Audit Trail Service - MS-1",
    description="Multi-agent AI system monitoring audit trails for 21 CFR Part 11 compliance",
    version=settings.SERVICE_VERSION,
    lifespan=lifespan,
)

register_exception_handlers(app)


@app.middleware("http")
async def add_request_context(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id
    started = time.perf_counter()

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-Ms"] = f"{(time.perf_counter() - started) * 1000:.2f}"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=_cors_allow_credentials(),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mandatory contract endpoints (no prefix; mounted at root)
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
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "docs": "/docs",
        "health": "/health",
    }
