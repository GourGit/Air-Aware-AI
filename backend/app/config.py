"""Application configuration via pydantic-settings.

Reads from environment variables and/or a `.env` file.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import field_validator, model_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised, validated application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://airaware:changeme@localhost:5432/airaware_db"

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Secrets ───────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ALGORITHM: str = "HS256"

    # ── LLM / AI ──────────────────────────────────────────────
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"

    # ── External APIs ─────────────────────────────────────────
    OPENAQ_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""

    # ── URLs ──────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"

    # ── Runtime ───────────────────────────────────────────────
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ── Validators ────────────────────────────────────────────
    @field_validator("LOG_LEVEL")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}")
        return upper

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        allowed = {"development", "staging", "production", "testing"}
        lower = v.lower()
        if lower not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return lower

    @model_validator(mode="after")
    def validate_production_security(self) -> Settings:
        """Enforce strict secret and database requirements in production."""
        if self.ENVIRONMENT == "production":
            insecure_defaults = {
                "change-me-in-production",
                "dev-airaware-secret-key-32-characters-long",
                "dev-airaware-jwt-secret-key-32-chars",
                "",
            }
            if self.SECRET_KEY in insecure_defaults or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be a secure, random string with at least 32 characters in production."
                )
            if self.JWT_SECRET_KEY in insecure_defaults or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be a secure, random string with at least 32 characters in production."
                )
            if "changeme" in self.DATABASE_URL:
                raise ValueError(
                    "DATABASE_URL contains default unconfigured password in production."
                )
        return self

    # ── Computed properties ───────────────────────────────────
    @computed_field  # type: ignore[misc]
    @property
    def cors_origin_list(self) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @computed_field  # type: ignore[misc]
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @computed_field  # type: ignore[misc]
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @computed_field  # type: ignore[misc]
    @property
    def debug(self) -> bool:
        return self.ENVIRONMENT in {"development", "testing"}


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` singleton."""
    return Settings()
