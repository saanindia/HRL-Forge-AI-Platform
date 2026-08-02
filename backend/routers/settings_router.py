"""User settings routes."""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone

from models import UserSettings, UserSettingsUpdate
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


async def _get_or_create(user_id: str) -> UserSettings:
    db = get_db()
    doc = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    if doc:
        return UserSettings(**doc)
    settings = UserSettings(user_id=user_id)
    await db.settings.insert_one(settings.model_dump())
    return settings


@router.get("", response_model=UserSettings)
async def get_settings(user: dict = Depends(get_current_user)):
    return await _get_or_create(user["id"])


@router.put("", response_model=UserSettings)
async def update_settings(payload: UserSettingsUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    await _get_or_create(user["id"])
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one({"user_id": user["id"]}, {"$set": update})
    doc = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    return UserSettings(**doc)
