from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from ..core.security import TokenError, decode_access_token
from ..models.user import UserRecord
from ..services.posts import PostService, get_post_service
from ..services.users import UserService, get_user_service


def get_posts_service() -> PostService:
    return get_post_service()


def get_users_service() -> UserService:
    return get_user_service()


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
