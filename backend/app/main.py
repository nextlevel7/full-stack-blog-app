from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .api.routes import auth, posts, root, uploads
from .core.errors import PersistenceError
from .core.config import get_settings
from .core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.version)
    uploads_dir = settings.data_dir / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("app")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=86400,
    )

    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    app.include_router(root.router)
    app.include_router(auth.router)
    app.include_router(posts.router)
    app.include_router(uploads.router)

    @app.exception_handler(PersistenceError)
    async def handle_persistence_errors(request: Request, exc: PersistenceError):
        logger.error("Database error on %s %s: %s", request.method, request.url.path, exc)
        return JSONResponse(status_code=500, content={"detail": "A database error occurred"})

    return app


app = create_app()

__all__ = ["app", "create_app"]
