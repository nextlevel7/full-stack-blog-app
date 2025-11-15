from __future__ import annotations

from typing import Any, Optional

import logging

from ..models.post import PostRecord
from ..repositories.posts import PostRepository
from ..utils.text import slugify


class PostService:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository
        self.logger = logging.getLogger(self.__class__.__name__)

    def list_posts(self) -> list[PostRecord]:
        posts = self.repository.list_posts()
        return [self.repository.to_record(post) for post in posts]

    def get_post(self, slug: str) -> Optional[PostRecord]:
        post = self.repository.get_by_slug(slug)
        return self.repository.to_record(post) if post else None

    def create_post(
        self,
        *,
        title: str,
        body: str,
        body_blocks: dict[str, Any] | None,
        author_name: str,
        author_id: str,
    ) -> PostRecord:
        slug = self._generate_slug(title)
        record = self.repository.create_post(
            title=title,
            slug=slug,
            body=body,
            body_blocks=body_blocks or {},
            author_name=author_name,
            author_id=author_id,
        )
        return self.repository.to_record(record)

    def update_post(
        self,
        slug: str,
        *,
        title: Optional[str] = None,
        body: Optional[str] = None,
        body_blocks: Optional[dict[str, Any]] = None,
        author_name: Optional[str] = None,
    ) -> Optional[PostRecord]:
        post = self.repository.get_by_slug(slug)
        if not post:
            return None
        if title:
            post.title = title
            post.slug = self._generate_slug(title, current_slug=slug)
        if body is not None:
            post.body = body
        if body_blocks is not None:
            post.body_blocks = body_blocks
        if author_name:
            post.author_name = author_name
        updated = self.repository.save(post)
        return self.repository.to_record(updated)

    def delete_post(self, slug: str) -> bool:
        post = self.repository.get_by_slug(slug)
        if not post:
            return False
        self.repository.delete(post)
        return True

    def list_posts_by_author(self, author_id: str) -> list[PostRecord]:
        posts = self.repository.list_posts_by_author(author_id)
        return [self.repository.to_record(post) for post in posts]

    def _generate_slug(self, title: str, current_slug: str | None = None) -> str:
        base = slugify(title) or "post"
        slug = base
        counter = 1
        existing_slugs = self.repository.fetch_slugs_with_prefix(base)
        if current_slug:
            existing_slugs.discard(current_slug)
        while slug in existing_slugs:
            counter += 1
            slug = f"{base}-{counter}"
        return slug
