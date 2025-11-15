from __future__ import annotations

import logging
import uuid
from typing import Optional

from ..core.security import hash_password, verify_password
from ..models.user import UserRecord
from ..repositories.users import UserRepository


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository
        self.logger = logging.getLogger(self.__class__.__name__)

    def get_by_id(self, user_id: str) -> Optional[UserRecord]:
        user = self.repository.get_by_id(user_id)
        return self.repository.to_record(user) if user else None

    def get_by_username(self, username: str) -> Optional[UserRecord]:
        user = self.repository.get_by_username(username.strip())
        return self.repository.to_record(user) if user else None

    def create_user(self, *, username: str, password: str) -> UserRecord:
        username = username.strip()
        if not username:
            raise ValueError("Username cannot be empty")
        if self.repository.get_by_username(username):
            raise ValueError("Username already exists")
        salt, digest = hash_password(password)
        record = self.repository.create_user(
            user_id=uuid.uuid4().hex,
            username=username,
            salt=salt,
            password_hash=digest,
        )
        return self.repository.to_record(record)

    def authenticate(self, *, username: str, password: str) -> Optional[UserRecord]:
        user = self.repository.get_by_username(username.strip())
        if not user:
            return None
        if verify_password(password, salt_b64=user.salt, digest_b64=user.password_hash):
            return self.repository.to_record(user)
        return None
