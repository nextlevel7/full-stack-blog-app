from __future__ import annotations


class PersistenceError(RuntimeError):
    """Raised when the database cannot fulfill a request."""


__all__ = ["PersistenceError"]
