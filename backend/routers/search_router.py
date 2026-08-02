"""Global search across projects, templates, history, and boards."""
from fastapi import APIRouter, Depends, Query
import re

from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/search", tags=["search"])


def _rx(q: str):
    return {"$regex": re.escape(q), "$options": "i"}


@router.get("")
async def search(
    q: str = Query(min_length=1, max_length=100),
    limit: int = Query(6, le=20),
    user: dict = Depends(get_current_user),
):
    """Return grouped search results for the current user."""
    db = get_db()
    rx = _rx(q)

    projects_cur = db.projects.find(
        {
            "user_id": user["id"],
            "$or": [
                {"name": rx},
                {"description": rx},
                {"board": rx},
                {"language": rx},
            ],
        },
        {"_id": 0, "id": 1, "name": 1, "board": 1, "language": 1},
    ).limit(limit)

    templates_cur = db.templates.find(
        {"$or": [{"name": rx}, {"description": rx}, {"tags": rx}]},
        {"_id": 0, "slug": 1, "name": 1, "board": 1, "language": 1, "difficulty": 1},
    ).limit(limit)

    history_cur = db.history.find(
        {"user_id": user["id"], "$or": [{"prompt": rx}, {"board": rx}, {"mode": rx}]},
        {"_id": 0, "id": 1, "prompt": 1, "board": 1, "mode": 1, "created_at": 1},
    ).sort("created_at", -1).limit(limit)

    boards_cur = db.boards.find(
        {"$or": [{"name": rx}, {"mcu": rx}, {"family": rx}]},
        {"_id": 0, "slug": 1, "name": 1, "mcu": 1, "family": 1},
    ).limit(limit)

    projects = [d async for d in projects_cur]
    templates = [d async for d in templates_cur]
    history = [d async for d in history_cur]
    boards = [d async for d in boards_cur]

    return {
        "query": q,
        "projects": projects,
        "templates": templates,
        "history": history,
        "boards": boards,
        "total": len(projects) + len(templates) + len(history) + len(boards),
    }
