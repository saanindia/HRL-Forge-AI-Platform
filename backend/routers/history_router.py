"""History routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional

from models import HistoryEntry
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[HistoryEntry])
async def list_history(
    project_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    user: dict = Depends(get_current_user),
):
    db = get_db()
    q = {"user_id": user["id"]}
    if project_id:
        q["project_id"] = project_id
    cursor = db.history.find(q, {"_id": 0}).sort("created_at", -1).limit(limit)
    return [HistoryEntry(**d) async for d in cursor]


@router.get("/{history_id}", response_model=HistoryEntry)
async def get_history(history_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.history.find_one({"id": history_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="History entry not found")
    return HistoryEntry(**doc)


@router.delete("/{history_id}")
async def delete_history(history_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    r = await db.history.delete_one({"id": history_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"ok": True}
