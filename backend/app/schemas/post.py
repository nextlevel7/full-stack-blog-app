from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    body: dict[str, Any] = Field(default_factory=dict)
    author_name: str | None = Field(None, max_length=120)


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    body: dict[str, Any] | None = None
    author_name: str | None = Field(None, max_length=120)


class PostPublic(BaseModel):
    id: int
    title: str
    slug: str
    body: str
    body_blocks: dict[str, Any] | None = None
    author_name: str
    author_id: str | None = None
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
