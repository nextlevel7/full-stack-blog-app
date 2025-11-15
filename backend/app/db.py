from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Iterator

import logging

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from .core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()
DATABASE_URL = settings.database_url
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL must be configured to start the API")

Base = declarative_base()
engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


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


class UserORM(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(120), unique=True, index=True, nullable=False)
    salt = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(engine)


@contextmanager
def get_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        logger.exception("Database session rolled back due to an error")
        raise
    finally:
        session.close()
