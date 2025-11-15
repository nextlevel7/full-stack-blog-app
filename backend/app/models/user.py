from __future__ import annotations

from typing import TypedDict


class UserRecord(TypedDict):
    id: str
    username: str
    salt: str
    password_hash: str
    created_at: str
