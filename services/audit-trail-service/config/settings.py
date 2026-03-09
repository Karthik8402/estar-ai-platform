"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://epharmic:password@localhost:5432/epharmic_db"

    # JWT (deferred — not enforced yet)
    JWT_SECRET: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_MINUTES: int = 15

    # AI Provider
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""

    # Service info
    SERVICE_NAME: str = "audit-trail-service"
    SERVICE_VERSION: str = "1.0.0"
    SERVICE_PORT: int = 8001

    # CORS — set CORS_ALLOW_ALL=true in production to allow all origins
    CORS_ALLOW_ALL: bool = True
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://landing-page.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io",
        "https://audit-trail-service.ambitiousforest-7d7bdb17.southeastasia.azurecontainerapps.io",
        "https://estar.karthikdev.app",
        "https://api.estar.karthikdev.app",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
