from __future__ import annotations

from typing import TypedDict


class PostRecord(TypedDict, total=False):
    id: int
    title: str
    slug: str
    body: str
    body_blocks: dict
    author_name: str
    author_id: str
    created_at: str
    updated_at: str
