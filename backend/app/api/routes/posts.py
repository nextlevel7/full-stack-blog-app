from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ...models.user import UserRecord
from ...schemas.post import PostCreate, PostPublic, PostUpdate
from ...services.posts import PostService
from ...utils.editor import editorjs_to_html
from ..dependencies import get_current_user, get_posts_service

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/", response_model=list[PostPublic])
def list_posts(service: PostService = Depends(get_posts_service)):
    return service.list_posts()


@router.get("/mine", response_model=list[PostPublic])
def my_posts(
    current_user: UserRecord = Depends(get_current_user),
    service: PostService = Depends(get_posts_service),
):
    return service.list_posts_by_author(current_user["id"])


@router.post("/", response_model=PostPublic, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    current_user: UserRecord = Depends(get_current_user),
    service: PostService = Depends(get_posts_service),
):
    author_name = payload.author_name or current_user["username"]
    body_html = editorjs_to_html(payload.body)
    return service.create_post(
        title=payload.title,
        body=body_html,
        body_blocks=payload.body,
        author_name=author_name,
        author_id=current_user["id"],
    )


@router.get("/{slug}", response_model=PostPublic)
def retrieve_post(slug: str, service: PostService = Depends(get_posts_service)):
    record = service.get_post(slug)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return record


@router.patch("/{slug}", response_model=PostPublic)
def update_post(
    slug: str,
    payload: PostUpdate,
    current_user: UserRecord = Depends(get_current_user),
    service: PostService = Depends(get_posts_service),
):
    record = service.get_post(slug)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if record.get("author_id") and record["author_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to edit this post")
    body_html = editorjs_to_html(payload.body) if payload.body is not None else None
    updated = service.update_post(
        slug,
        title=payload.title,
        body=body_html,
        body_blocks=payload.body,
        author_name=payload.author_name,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return updated


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    slug: str,
    current_user: UserRecord = Depends(get_current_user),
    service: PostService = Depends(get_posts_service),
):
    record = service.get_post(slug)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if record.get("author_id") and record["author_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to delete this post")
    deleted = service.delete_post(slug)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return None
