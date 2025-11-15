from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["root"])
def root() -> dict:
    return {
        "message": "Blog API is running.",
        "endpoints": [
            {"method": "GET", "path": "/api/posts"},
            {"method": "POST", "path": "/api/posts"},
            {"method": "GET", "path": "/api/posts/{slug}"},
            {"method": "PATCH", "path": "/api/posts/{slug}"},
            {"method": "DELETE", "path": "/api/posts/{slug}"},
            {"method": "POST", "path": "/api/auth/register"},
            {"method": "POST", "path": "/api/auth/login"},
        ],
    }
