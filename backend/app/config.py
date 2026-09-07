"""Application settings — everything comes from environment variables.

Secrets (database credentials, SECRET_KEY) are NEVER hardcoded here; they are
read from the environment / `backend/.env` (git-ignored). See `.env.example`.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "change_me"


class Settings(BaseSettings):
    """Typed application configuration (12-factor style)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------- application
    app_name: str = "Kisan Kraya Seva API"
    app_version: str = "1.0.0"
    environment: str = "development"  # development | test | production
    debug: bool = True

    # ---------------------------------------------------------------- database
    # e.g. postgresql+psycopg://kisan_app:<password>@localhost:5432/kisan_procurement
    database_url: str
    db_echo: bool = False
    test_database_url: str = ""

    # ---------------------------------------------------------------- security
    secret_key: str = _DEFAULT_SECRET
    token_ttl_minutes: int = 60 * 12  # 12h
    require_officer_auth: bool = False
    cors_origins: str = (
        "http://localhost:8081,http://localhost:19006,http://localhost:5173"
    )

    # ------------------------------------------------------------------- queue
    minutes_per_farmer: int = 7
    demo_otp: str = "123456"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def secret_is_default(self) -> bool:
        return self.secret_key == _DEFAULT_SECRET


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
