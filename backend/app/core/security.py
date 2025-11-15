from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from typing import Any, Tuple

import jwt

from .config import get_settings


class TokenError(Exception):
    """Raised when a token cannot be decoded."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, subject: str, username: str, ttl_seconds: int | None = None) -> str:
    settings = get_settings()
    ttl = ttl_seconds or settings.access_token_ttl_seconds
    now = _now()
    payload = {
        "sub": subject,
        "username": username,
        "iat": int(now.timestamp()),
        "exp": int(now.timestamp() + ttl),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm], options={"verify_aud": False})
    except jwt.ExpiredSignatureError as exc:  # pragma: no cover - library passthrough
        raise TokenError("Token expired") from exc
    except jwt.InvalidTokenError as exc:  # pragma: no cover - library passthrough
        raise TokenError("Invalid token") from exc


def hash_password(password: str) -> Tuple[str, str]:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return base64.b64encode(salt).decode("utf-8"), base64.b64encode(digest).decode("utf-8")


def verify_password(password: str, *, salt_b64: str, digest_b64: str) -> bool:
    salt = base64.b64decode(salt_b64.encode("utf-8"))
    expected = base64.b64decode(digest_b64.encode("utf-8"))
    computed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 390000)
    return hmac.compare_digest(expected, computed)
