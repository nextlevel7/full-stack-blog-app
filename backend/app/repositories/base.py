from __future__ import annotations

import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..core.errors import PersistenceError


class BaseRepository:
    def __init__(self, session: Session):
        self.session = session
        self.logger = logging.getLogger(self.__class__.__name__)

    def _handle_error(self, exc: SQLAlchemyError, message: str) -> None:
        self.session.rollback()
        self.logger.exception(message)
        raise PersistenceError(message) from exc
