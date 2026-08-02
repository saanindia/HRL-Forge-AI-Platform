"""Admin routes."""
from fastapi import APIRouter, Depends
from typing import List

from auth import require_admin
from database import get_db
from models import UserPublic

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserPublic])
async def list_users(_: dict = Depends(require_admin)):
    db = get_db()
    return [UserPublic(**{k: v for k, v in d.items() if k != "password_hash"})
            async for d in db.users.find({}, {"_id": 0})]


@router.get("/stats")
async def stats(_: dict = Depends(require_admin)):
    db = get_db()
    return {
        "users": await db.users.count_documents({}),
        "projects": await db.projects.count_documents({}),
        "generations": await db.history.count_documents({}),
        "chat_messages": await db.chat_messages.count_documents({}),
        "templates": await db.templates.count_documents({}),
    }
