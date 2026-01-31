"""
Discuss (forum) router: list/create posts, get post + replies, reply, upvote.

Route-matching: FastAPI matches the first path that fits. The dynamic path /{post_id}
matches any segment (including "new"), so GET /api/discuss/new was being handled by
get_post(post_id="new"). Beanie then tried to parse "new" as PydanticObjectId → 500.
Fix: declare static paths (e.g. /new) before /{post_id}, and validate post_id format
before calling DiscussPost.get() so invalid IDs return 404 instead of 500.
"""
import re
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from models.discuss import DiscussPost, DiscussReply
from schemas.discuss import (
    PostCreate,
    PostResponse,
    PostListResponse,
    PostDetailResponse,
    ReplyCreate,
    ReplyResponse,
)
from services.user_service import UserService
from routers.users import get_current_user_id

router = APIRouter()

# MongoDB ObjectIds are 24 hex characters. Reject invalid IDs before Beanie to avoid 500.
OBJECTID_PATTERN = re.compile(r"^[a-fA-F0-9]{24}$")


def _is_valid_object_id(value: str) -> bool:
    """Return True if value looks like a valid MongoDB ObjectId (24 hex chars)."""
    return bool(value and OBJECTID_PATTERN.match(value))


async def _post_to_response(post: DiscussPost) -> PostResponse:
    """Build PostResponse with author_name and location from User."""
    user = await UserService.get_user_by_id(post.author_id)
    author_name = user.name if user else "Unknown"
    location = post.location or (user.schoolLocation if user else None)
    replies_count = await DiscussReply.find(DiscussReply.post_id == str(post.id)).count()
    return PostResponse(
        id=str(post.id),
        author_id=post.author_id,
        author_name=author_name,
        body=post.body,
        location=location,
        upvote_count=len(post.upvote_ids),
        reply_count=replies_count,
        tags=post.tags or [],
        created_at=post.created_at,
    )


async def _reply_to_response(reply: DiscussReply) -> ReplyResponse:
    """Build ReplyResponse with author_name."""
    user = await UserService.get_user_by_id(reply.author_id)
    author_name = user.name if user else "Unknown"
    return ReplyResponse(
        id=str(reply.id),
        post_id=reply.post_id,
        author_id=reply.author_id,
        author_name=author_name,
        body=reply.body,
        created_at=reply.created_at,
    )


@router.get("", response_model=PostListResponse)
async def list_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
):
    """List posts, newest first. No auth required."""
    posts_docs = await DiscussPost.find_all().sort(-DiscussPost.created_at).skip(skip).limit(limit).to_list()
    total = await DiscussPost.count()
    posts = [await _post_to_response(p) for p in posts_docs]
    return PostListResponse(posts=posts, total=total, skip=skip, limit=limit)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Create a new post. Auth required."""
    user = await UserService.get_user_by_id(user_id)
    location = payload.location or (user.schoolLocation if user else None)
    post = DiscussPost(
        author_id=user_id,
        body=payload.body.strip(),
        location=location,
        tags=payload.tags[:20] if payload.tags else [],
    )
    await post.insert()
    return await _post_to_response(post)


# Static path must be declared before /{post_id}, otherwise GET /api/discuss/new
# is matched as get_post(post_id="new") and Beanie raises on invalid ObjectId.
@router.get("/new")
async def get_new_post_placeholder():
    """No resource at GET /new; creating a post is done via POST /api/discuss."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Post not found. Use POST /api/discuss to create a post.",
    )


@router.get("/{post_id}", response_model=PostDetailResponse)
async def get_post(post_id: str):
    """Get single post with replies. No auth required."""
    if not _is_valid_object_id(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post = await DiscussPost.get(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    replies_docs = await DiscussReply.find(DiscussReply.post_id == post_id).sort(DiscussReply.created_at).to_list()
    post_resp = await _post_to_response(post)
    replies = [await _reply_to_response(r) for r in replies_docs]
    return PostDetailResponse(post=post_resp, replies=replies)


@router.post("/{post_id}/reply", response_model=ReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    post_id: str,
    payload: ReplyCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Add a reply to a post. Auth required."""
    if not _is_valid_object_id(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post = await DiscussPost.get(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    reply = DiscussReply(post_id=post_id, author_id=user_id, body=payload.body.strip())
    await reply.insert()
    return await _reply_to_response(reply)


@router.post("/{post_id}/upvote")
async def toggle_upvote(
    post_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Toggle upvote for current user. Returns updated upvote_count."""
    if not _is_valid_object_id(post_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post = await DiscussPost.get(post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    ids = post.upvote_ids or []
    if user_id in ids:
        ids = [x for x in ids if x != user_id]
    else:
        ids = ids + [user_id]
    post.upvote_ids = ids
    await post.save()
    return {"upvote_count": len(ids)}
