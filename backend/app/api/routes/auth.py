from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ...core.security import create_access_token
from ...schemas.auth import AuthRequest, TokenResponse, UserPublic
from ...services.users import UserService
from ..dependencies import get_users_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _serialize_user(user) -> UserPublic:
    return UserPublic(id=user["id"], username=user["username"])


def _token_payload(user) -> TokenResponse:
    token = create_access_token(subject=user["id"], username=user["username"])
    return TokenResponse(token=token, user=_serialize_user(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: AuthRequest, users: UserService = Depends(get_users_service)):
    try:
        user = users.create_user(username=payload.username, password=payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _token_payload(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: AuthRequest, users: UserService = Depends(get_users_service)):
    user = users.authenticate(username=payload.username, password=payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _token_payload(user)
