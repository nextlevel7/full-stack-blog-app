from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Optional

from sqlalchemy import select

from ..core.config import get_settings
from ..db import PostORM, get_session, has_database
from ..models.post import PostRecord
from ..services.storage import JSONStorage
from ..utils.text import slugify


class PostService:
    def __init__(self, storage: JSONStorage) -> None:
        self.storage = storage
        self.use_db = has_database()

    def _normalize(self, post: dict[str, Any]) -> PostRecord:
        post.setdefault("body_blocks", {})
        post.setdefault("author_id", "")
        return post  # type: ignore[return-value]

    def _orm_to_record(self, post: PostORM) -> PostRecord:
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

    def list_posts(self) -> list[PostRecord]:
        if self.use_db:
            with get_session() as session:
                posts = session.execute(select(PostORM).order_by(PostORM.created_at.desc())).scalars().all()
                return [self._orm_to_record(post) for post in posts]
        posts = [self._normalize(post) for post in self.storage.read() if isinstance(post, dict)]
        return sorted(posts, key=lambda post: post.get("created_at", ""), reverse=True)

    def get_post(self, slug: str) -> Optional[PostRecord]:
        if self.use_db:
            with get_session() as session:
                post = session.execute(select(PostORM).where(PostORM.slug == slug)).scalar_one_or_none()
                return self._orm_to_record(post) if post else None
        for post in self.storage.read():
            if isinstance(post, dict) and post.get("slug") == slug:
                return self._normalize(post)
        return None

    def create_post(
        self,
        *,
        title: str,
        body: str,
        body_blocks: dict[str, Any] | None,
        author_name: str,
        author_id: str,
    ) -> PostRecord:
        if self.use_db:
            with get_session() as session:
                slug = self._generate_slug(title, [], session=session)
                now = datetime.now(timezone.utc)
                record = PostORM(
                    title=title,
                    slug=slug,
                    body=body,
                    body_blocks=body_blocks or {},
                    author_name=author_name,
                    author_id=author_id,
                    created_at=now,
                    updated_at=now,
                )
                session.add(record)
                session.commit()
                session.refresh(record)
                return self._orm_to_record(record)

        def _mutator(posts: list[dict[str, Any]]):
            now = datetime.now(timezone.utc).isoformat()
            slug = self._generate_slug(title, posts)
            next_id = max((int(post.get("id", 0)) for post in posts), default=0) + 1
            record: PostRecord = {
                "id": next_id,
                "title": title,
                "slug": slug,
                "body": body,
                "body_blocks": body_blocks or {},
                "author_name": author_name,
                "author_id": author_id,
                "created_at": now,
                "updated_at": now,
            }
            posts.append(record)
            return True, record

        return self.storage.mutate(_mutator)

    def update_post(
        self,
        slug: str,
        *,
        title: Optional[str] = None,
        body: Optional[str] = None,
        body_blocks: Optional[dict[str, Any]] = None,
        author_name: Optional[str] = None,
    ) -> Optional[PostRecord]:
        if self.use_db:
            with get_session() as session:
                post = session.execute(select(PostORM).where(PostORM.slug == slug)).scalar_one_or_none()
                if not post:
                    return None
                if title:
                    post.title = title
                    post.slug = self._generate_slug(title, [], current_slug=slug, session=session)
                if body is not None:
                    post.body = body
                if body_blocks is not None:
                    post.body_blocks = body_blocks
                if author_name:
                    post.author_name = author_name
                post.updated_at = datetime.now(timezone.utc)
                session.commit()
                session.refresh(post)
                return self._orm_to_record(post)

        def _mutator(posts: list[dict[str, Any]]):
            for post in posts:
                if post.get("slug") == slug:
                    if title:
                        post["title"] = title
                        post["slug"] = self._generate_slug(title, posts, current_slug=slug)
                    if body is not None:
                        post["body"] = body
                    if body_blocks is not None:
                        post["body_blocks"] = body_blocks
                    if author_name:
                        post["author_name"] = author_name
                    post["updated_at"] = datetime.now(timezone.utc).isoformat()
                    return True, post
            return False, None

        return self.storage.mutate(_mutator)

    def delete_post(self, slug: str) -> bool:
        if self.use_db:
            with get_session() as session:
                post = session.execute(select(PostORM).where(PostORM.slug == slug)).scalar_one_or_none()
                if not post:
                    return False
                session.delete(post)
                session.commit()
                return True

        def _mutator(posts: list[dict[str, Any]]):
            before = len(posts)
            posts[:] = [post for post in posts if post.get("slug") != slug]
            return (len(posts) != before), len(posts) != before

        return self.storage.mutate(_mutator)

    def _generate_slug(
        self,
        title: str,
        existing_posts: list[dict[str, Any]],
        *,
        current_slug: str | None = None,
        session=None,
    ) -> str:
        base = slugify(title) or "post"
        slug = base
        counter = 1
        if self.use_db and session is not None:
            existing_slugs = {
                row[0]
                for row in session.execute(select(PostORM.slug).where(PostORM.slug.like(f"{base}%"))).all()
            }
        else:
            existing_slugs = {
                post["slug"]
                for post in existing_posts
                if isinstance(post, dict) and post.get("slug") and post.get("slug") != current_slug
            }
        while slug in existing_slugs and slug != current_slug:
            counter += 1
            slug = f"{base}-{counter}"
        return slug

    def list_posts_by_author(self, author_id: str) -> list[PostRecord]:
        if self.use_db:
            with get_session() as session:
                posts = (
                    session.execute(select(PostORM).where(PostORM.author_id == author_id).order_by(PostORM.created_at.desc()))
                    .scalars()
                    .all()
                )
                return [self._orm_to_record(post) for post in posts]
        return [post for post in self.list_posts() if post.get("author_id") == author_id]


@lru_cache(maxsize=1)
def get_post_service() -> PostService:
    settings = get_settings()
    storage = JSONStorage(settings.data_dir / "posts.json")
    return PostService(storage)
