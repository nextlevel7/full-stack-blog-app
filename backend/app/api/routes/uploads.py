from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ...core.config import get_settings
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/uploads", tags=["uploads"])
settings = get_settings()
uploads_dir = settings.data_dir / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)


@router.post("/images", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    _user=Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Invalid file")
    suffix = Path(file.filename).suffix or ".bin"
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = uploads_dir / filename
    contents = await file.read()
    destination.write_bytes(contents)
    return {"url": f"/uploads/{filename}"}
