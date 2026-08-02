"""Datasheet / Circuit assistant chat."""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from models import ChatMessage, ChatMessageIn
from auth import get_current_user
from database import get_db
from ai_engine.provider_manager import provider_manager

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_MSGS = {
    "circuit": (
        "You are HRL Forge AI Circuit Assistant. You help engineers design and debug "
        "circuits and hardware wiring. Cite pin numbers, voltage levels, current limits, "
        "and recommended components. Be concise and precise."
    ),
    "datasheet": (
        "You are HRL Forge AI Datasheet Assistant. You explain electronic component "
        "datasheets, register maps, timing diagrams, and application notes to embedded engineers. "
        "Provide worked examples when possible."
    ),
}


@router.post("/message", response_model=ChatMessage)
async def send_message(payload: ChatMessageIn, user: dict = Depends(get_current_user)):
    db = get_db()

    # Persist user message
    user_msg = ChatMessage(
        session_id=payload.session_id, user_id=user["id"],
        role="user", content=payload.message, context=payload.context or "circuit"
    )
    await db.chat_messages.insert_one(user_msg.model_dump())

    system = SYSTEM_MSGS.get(payload.context or "circuit", SYSTEM_MSGS["circuit"])
    try:
        reply = await provider_manager.complete(
            system_message=system,
            user_message=payload.message,
            session_id=f"chat:{payload.session_id}",
            provider="anthropic",
            model="claude-sonnet-4-6",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    asst_msg = ChatMessage(
        session_id=payload.session_id, user_id=user["id"],
        role="assistant", content=reply, context=payload.context or "circuit"
    )
    await db.chat_messages.insert_one(asst_msg.model_dump())
    return asst_msg


@router.get("/session/{session_id}", response_model=List[ChatMessage])
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.chat_messages.find(
        {"session_id": session_id, "user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", 1)
    return [ChatMessage(**d) async for d in cursor]


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    db = get_db()
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$session_id",
            "context": {"$first": "$context"},
            "last_message": {"$first": "$content"},
            "last_at": {"$first": "$created_at"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"last_at": -1}},
        {"$limit": 30},
    ]
    sessions = []
    async for s in db.chat_messages.aggregate(pipeline):
        sessions.append({
            "session_id": s["_id"],
            "context": s["context"],
            "last_message": s["last_message"][:120],
            "last_at": s["last_at"],
            "count": s["count"],
        })
    return sessions
