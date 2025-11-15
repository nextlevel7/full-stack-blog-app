from __future__ import annotations

from pydantic import BaseModel, Field


class AuthRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)


class UserPublic(BaseModel):
    id: str
    username: str


class TokenResponse(BaseModel):
    token: str
    user: UserPublic
