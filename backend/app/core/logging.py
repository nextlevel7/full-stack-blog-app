from __future__ import annotations

import os
from logging.config import dictConfig


def configure_logging() -> None:
    """Configure structured logging for the API process."""
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                }
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "level": log_level,
                    "formatter": "default",
                }
            },
            "root": {
                "level": log_level,
                "handlers": ["console"],
            },
        }
    )


__all__ = ["configure_logging"]
