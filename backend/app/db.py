from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .core.config import get_settings

settings = get_settings()
DATABASE_URL = settings.database_url

Base = declarative_base()
engine = create_engine(DATABASE_URL, future=True) if DATABASE_URL else None
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True) if engine else None


class PostORM(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    body = Column(Text, default="")
    body_blocks = Column(JSON, default=dict)
    author_name = Column(String(120), nullable=False)
    author_id = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


if engine:
    Base.metadata.create_all(engine)


def has_database() -> bool:
    return engine is not None


@contextmanager
def get_session() -> Iterator[Session]:
    if not SessionLocal:
        raise RuntimeError("Database is not configured")
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
