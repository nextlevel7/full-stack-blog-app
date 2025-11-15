from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from typing import List


BASE_DIR = Path(__file__).resolve().parents[2]


def _default_data_dir() -> Path:
    env_dir = os.environ.get("DATA_DIR")
    return Path(env_dir).expanduser() if env_dir else BASE_DIR / "data"


def _default_origins() -> list[str]:
    raw = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins or ["http://localhost:3000"]


@dataclass(slots=True)
class Settings:
    app_name: str = os.environ.get("APP_NAME", "Blog API")
    api_prefix: str = "/api"
    version: str = os.environ.get("APP_VERSION", "1.0.0")
    environment: str = os.environ.get("APP_ENV", "development")
    secret_key: str = os.environ.get("SECRET_KEY", "dev-secret" )
    access_token_ttl_seconds: int = int(os.environ.get("ACCESS_TOKEN_TTL_SECONDS", "3600"))
    jwt_algorithm: str = os.environ.get("JWT_ALGORITHM", "HS256")
    data_dir: Path = field(default_factory=_default_data_dir)
    cors_allowed_origins: List[str] = field(default_factory=_default_origins)
    database_url: str | None = os.environ.get("DATABASE_URL")

    def __post_init__(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)

    @property
    def access_token_ttl(self) -> timedelta:
        return timedelta(seconds=self.access_token_ttl_seconds)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
