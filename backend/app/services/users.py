from __future__ import annotations

import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Optional

from ..core.config import get_settings
from ..core.security import hash_password, verify_password
from ..models.user import UserRecord
from ..services.storage import JSONStorage


class UserService:
    def __init__(self, storage: JSONStorage) -> None:
        self.storage = storage

    def _load_users(self) -> list[UserRecord]:
        return [user for user in self.storage.read() if isinstance(user, dict)]

    def get_by_id(self, user_id: str) -> Optional[UserRecord]:
        for user in self._load_users():
            if user.get("id") == user_id:
                return user
        return None

    def get_by_username(self, username: str) -> Optional[UserRecord]:
        normalized = username.strip()
        for user in self._load_users():
            if user.get("username") == normalized:
                return user
        return None

    def create_user(self, *, username: str, password: str) -> UserRecord:
        username = username.strip()
        if not username:
            raise ValueError("Username cannot be empty")

        def _mutator(records: list[UserRecord]):
            if any(record.get("username") == username for record in records):
                raise ValueError("Username already exists")
            salt, digest = hash_password(password)
            user: UserRecord = {
                "id": uuid.uuid4().hex,
                "username": username,
                "salt": salt,
                "password_hash": digest,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            records.append(user)
            return True, user

        return self.storage.mutate(_mutator)

    def authenticate(self, *, username: str, password: str) -> Optional[UserRecord]:
        user = self.get_by_username(username)
        if not user:
            return None
        if verify_password(password, salt_b64=user["salt"], digest_b64=user["password_hash"]):
            return user
        return None


@lru_cache(maxsize=1)
def get_user_service() -> UserService:
    settings = get_settings()
    storage = JSONStorage(settings.data_dir / "users.json")
    return UserService(storage)
