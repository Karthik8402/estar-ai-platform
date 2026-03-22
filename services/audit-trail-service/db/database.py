"""SQLAlchemy engine, session factory, and dependency injection."""

import logging
import socket
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from config.settings import get_settings

logger = logging.getLogger("audit-trail-service.database")
settings = get_settings()


def _clean_database_url(url: str) -> str:
    return url.strip().strip('"').strip("'")


def _is_placeholder_database_url(url: str) -> bool:
    placeholders = ("<db_user>", "<db_password>", "<db_name>")
    return any(token in url for token in placeholders)


def _resolve_database_url() -> str:
    primary_url = _clean_database_url(settings.DATABASE_URL)
    if not primary_url or _is_placeholder_database_url(primary_url):
        raise RuntimeError(
            "DATABASE_URL is not configured with real credentials. "
            "Update your .env before starting the service."
        )

    try:
        host = make_url(primary_url).host
    except Exception:
        host = None

    if host:
        try:
            socket.getaddrinfo(host, None)
        except socket.gaierror as exc:
            fallback_url = _clean_database_url(settings.DATABASE_URL_FALLBACK) if settings.DATABASE_URL_FALLBACK else ""
            if fallback_url:
                logger.warning(
                    "Primary database host '%s' could not be resolved. Falling back to DATABASE_URL_FALLBACK.",
                    host,
                )
                return fallback_url
            raise RuntimeError(
                f"Could not resolve database host '{host}'. Check DNS/network or set DATABASE_URL_FALLBACK."
            ) from exc

    return primary_url


resolved_database_url = _resolve_database_url()
connect_args = {"connect_timeout": settings.DB_CONNECT_TIMEOUT_SECONDS} if resolved_database_url.startswith("postgresql") else {}

engine = create_engine(
    resolved_database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a DB session.
    Auto-rolls back on exception and always closes the session."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
