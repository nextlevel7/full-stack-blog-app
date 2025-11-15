from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from ..db import PostORM
from ..models.post import PostRecord
from .base import BaseRepository


class PostRepository(BaseRepository):
    def list_posts(self) -> list[PostORM]:
        try:
            stmt = select(PostORM).order_by(PostORM.created_at.desc())
            return self.session.execute(stmt).scalars().all()
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to list posts")

    def list_posts_by_author(self, author_id: str) -> list[PostORM]:
        try:
            stmt = select(PostORM).where(PostORM.author_id == author_id).order_by(PostORM.created_at.desc())
            return self.session.execute(stmt).scalars().all()
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to list author posts")

    def get_by_slug(self, slug: str) -> Optional[PostORM]:
        try:
            stmt = select(PostORM).where(PostORM.slug == slug)
            return self.session.execute(stmt).scalar_one_or_none()
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to fetch post")

    def fetch_slugs_with_prefix(self, prefix: str) -> set[str]:
        try:
            stmt = select(PostORM.slug).where(PostORM.slug.like(f"{prefix}%"))
            return {row[0] for row in self.session.execute(stmt).all()}
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to inspect slugs")

    def create_post(
        self,
        *,
        title: str,
        slug: str,
        body: str,
        body_blocks: dict,
        author_name: str,
        author_id: str,
    ) -> PostORM:
        try:
            record = PostORM(
                title=title,
                slug=slug,
                body=body,
                body_blocks=body_blocks,
                author_name=author_name,
                author_id=author_id,
            )
            self.session.add(record)
            self.session.commit()
            self.session.refresh(record)
            return record
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to create post")

    def save(self, post: PostORM) -> PostORM:
        try:
            self.session.add(post)
            self.session.commit()
            self.session.refresh(post)
            return post
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to update post")

    def delete(self, post: PostORM) -> None:
        try:
            self.session.delete(post)
            self.session.commit()
        except SQLAlchemyError as exc:
            self._handle_error(exc, "Failed to delete post")

    @staticmethod
    def to_record(post: PostORM) -> PostRecord:
        return {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "body": post.body,
            "body_blocks": post.body_blocks or {},
            "author_name": post.author_name,
            "author_id": post.author_id,
            "created_at": post.created_at.isoformat() if post.created_at else "",
            "updated_at": post.updated_at.isoformat() if post.updated_at else "",
        }
