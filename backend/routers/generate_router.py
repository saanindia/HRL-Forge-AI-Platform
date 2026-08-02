"""AI Generation routes."""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException

from models import GenerateRequest, GenerateResponse, HistoryEntry
from auth import get_current_user
from database import get_db
from ai_engine.provider_manager import provider_manager, PromptBuilder, ResponseFormatter

router = APIRouter(prefix="/generate", tags=["generate"])


@router.post("", response_model=GenerateResponse)
async def generate(req: GenerateRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    session_id = f"{user['id']}:{req.project_id or 'adhoc'}"
    user_msg = PromptBuilder.build(
        prompt=req.prompt,
        board=req.board,
        language=req.language,
        framework=req.framework,
        mode=req.mode,
        existing_code=req.existing_code,
    )

    try:
        raw = await provider_manager.complete(
            system_message=PromptBuilder.SYSTEM_ENGINEER,
            user_message=user_msg,
            session_id=session_id,
            provider=req.provider,
            model=req.model,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    parsed = ResponseFormatter.parse(raw)
    entry = HistoryEntry(
        user_id=user["id"],
        project_id=req.project_id,
        mode=req.mode,
        board=req.board,
        language=req.language,
        prompt=req.prompt,
        code=parsed["code"],
        explanation=parsed["explanation"],
        libraries=parsed["libraries"],
        connections=parsed["connections"],
        optimization=parsed["optimization"],
        raw=raw,
    )
    await db.history.insert_one(entry.model_dump())

    # Auto-update project code if project_id provided and mode produces code
    if req.project_id and parsed["code"] and req.mode in ("generate", "fix", "optimize"):
        await db.projects.update_one(
            {"id": req.project_id, "user_id": user["id"]},
            {"$set": {"code": parsed["code"], "updated_at": datetime.now(timezone.utc).isoformat()}},
        )

    return GenerateResponse(
        id=entry.id,
        code=parsed["code"],
        explanation=parsed["explanation"],
        libraries=parsed["libraries"],
        connections=parsed["connections"],
        optimization=parsed["optimization"],
        raw=raw,
        created_at=entry.created_at,
    )


@router.get("/providers")
async def list_providers(user: dict = Depends(get_current_user)):
    return provider_manager.list_providers()
