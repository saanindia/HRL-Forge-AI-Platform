"""Wiring share routes — public shareable links."""
from fastapi import APIRouter, Depends, HTTPException

from models import WiringShare, WiringShareCreate
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/wiring", tags=["wiring"])


@router.post("/share", response_model=WiringShare)
async def create_share(payload: WiringShareCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    share = WiringShare(user_id=user["id"], **payload.model_dump())
    await db.wiring_shares.insert_one(share.model_dump())
    return share


@router.get("/share/{token}", response_model=WiringShare)
async def get_share(token: str):
    """Public endpoint — no auth required."""
    db = get_db()
    doc = await db.wiring_shares.find_one({"token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Share not found")
    # Increment view count (fire-and-forget)
    await db.wiring_shares.update_one({"token": token}, {"$inc": {"view_count": 1}})
    doc["view_count"] = doc.get("view_count", 0) + 1
    return WiringShare(**doc)
