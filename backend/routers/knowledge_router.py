"""Knowledge base routes: boards, sensors, modules, protocols, templates."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional

from models import Board, Sensor, Module, Protocol, Template
from auth import get_current_user
from database import get_db

router = APIRouter(tags=["knowledge"])


@router.get("/boards", response_model=List[Board])
async def list_boards():
    db = get_db()
    return [Board(**d) async for d in db.boards.find({}, {"_id": 0})]


@router.get("/boards/{slug}", response_model=Board)
async def get_board(slug: str):
    db = get_db()
    d = await db.boards.find_one({"slug": slug}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Board not found")
    return Board(**d)


@router.get("/sensors", response_model=List[Sensor])
async def list_sensors():
    db = get_db()
    return [Sensor(**d) async for d in db.sensors.find({}, {"_id": 0})]


@router.get("/modules", response_model=List[Module])
async def list_modules():
    db = get_db()
    return [Module(**d) async for d in db.modules.find({}, {"_id": 0})]


@router.get("/protocols", response_model=List[Protocol])
async def list_protocols():
    db = get_db()
    return [Protocol(**d) async for d in db.protocols.find({}, {"_id": 0})]


@router.get("/templates", response_model=List[Template])
async def list_templates(board: Optional[str] = None, language: Optional[str] = None):
    db = get_db()
    q = {}
    if board:
        q["board"] = board
    if language:
        q["language"] = language
    return [Template(**d) async for d in db.templates.find(q, {"_id": 0})]


@router.get("/templates/{slug}", response_model=Template)
async def get_template(slug: str):
    db = get_db()
    d = await db.templates.find_one({"slug": slug}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Template not found")
    return Template(**d)
