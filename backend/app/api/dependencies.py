from __future__ import annotations

import logging
from typing import Generator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..core.errors import PersistenceError
from ..core.security import TokenError, decode_access_token
from ..db import SessionLocal
from ..models.user import UserRecord
from ..repositories.posts import PostRepository
from ..repositories.users import UserRepository
from ..services.posts import PostService
from ..services.users import UserService

logger = logging.getLogger(__name__)


def get_db_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    except SQLAlchemyError as exc:
        session.rollback()
        logger.exception("Database operation failed")
        raise PersistenceError("Database session error") from exc
    finally:
        session.close()


def get_posts_service(session: Session = Depends(get_db_session)) -> PostService:
    return PostService(PostRepository(session))


def get_users_service(session: Session = Depends(get_db_session)) -> UserService:
    return UserService(UserRepository(session))


def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    users: UserService = Depends(get_users_service),
) -> UserRecord:
    token = _extract_bearer_token(authorization)
    try:
        payload = decode_access_token(token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_id = str(payload.get("sub"))
    user = users.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _extract_bearer_token(header_value: str) -> str:
    parts = header_value.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header must be Bearer <token>")
    return parts[1]
