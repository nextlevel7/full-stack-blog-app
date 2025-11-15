from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from ..db import UserORM
from ..models.user import UserRecord
from .base import BaseRepository


class UserRepository(BaseRepository):
    def get_by_id(self, user_id: str) -> Optional[UserORM]:
        try:
            return self.session.get(UserORM, user_id)
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to fetch user by id")

    def get_by_username(self, username: str) -> Optional[UserORM]:
        try:
            stmt = select(UserORM).where(UserORM.username == username)
            return self.session.execute(stmt).scalar_one_or_none()
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to fetch user by username")

    def create_user(self, *, user_id: str, username: str, salt: str, password_hash: str) -> UserORM:
        try:
            record = UserORM(id=user_id, username=username, salt=salt, password_hash=password_hash)
            self.session.add(record)
            self.session.commit()
            self.session.refresh(record)
            return record
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to create user")

    @staticmethod
    def to_record(user: UserORM) -> UserRecord:
        return {
            "id": user.id,
            "username": user.username,
            "salt": user.salt,
            "password_hash": user.password_hash,
            "created_at": user.created_at.isoformat() if user.created_at else "",
        }
