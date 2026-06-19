"""Application configuration via environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://epharmic:change-me-in-development@localhost:5432/epharmic_db"
    DATABASE_URL_FALLBACK: str = ""
    DB_CONNECT_TIMEOUT_SECONDS: int = 8
    DB_KEEPALIVES: int = 1
    DB_KEEPALIVES_IDLE_SECONDS: int = 30
    DB_KEEPALIVES_INTERVAL_SECONDS: int = 10
    DB_KEEPALIVES_COUNT: int = 5

    # Startup/runtime controls
    AUTO_CREATE_TABLES: bool = True
    ENABLE_SCHEDULER: bool = True

    # Agent safety bounds
    AGENT_MAX_LOOKBACK_MINUTES: int = 30

    # JWT (deferred; not enforced yet)
    JWT_SECRET: str = "change-me-in-development"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 15

    # AI Provider
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""

    # Service info
    SERVICE_NAME: str = "audit-trail-service"
    SERVICE_VERSION: str = "1.0.0"
    SERVICE_PORT: int = 8001

    # Demo data simulator
    SIMULATION_INTERVAL_SECONDS: int = 240
    SIMULATION_EVENT_BATCH: int = 8

    # CORS
    CORS_ALLOW_ALL: bool = False
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://landing-page-seven-sandy-97.vercel.app",
        "https://estar.karthikdev.app",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
