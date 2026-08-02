"""Project CRUD routes."""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List

from models import Project, ProjectCreate, ProjectUpdate
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[Project])
async def list_projects(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1)
    return [Project(**doc) async for doc in cursor]


@router.post("", response_model=Project)
async def create_project(payload: ProjectCreate, user: dict = Depends(get_current_user)):
    db = get_db()
    project = Project(user_id=user["id"], **payload.model_dump())
    await db.projects.insert_one(project.model_dump())
    return project


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**doc)


@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.projects.update_one(
        {"id": project_id, "user_id": user["id"]}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return Project(**doc)


@router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    result = await db.projects.delete_one({"id": project_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@router.post("/{project_id}/clone", response_model=Project)
async def clone_project(project_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    doc.pop("id", None)
    clone = Project(user_id=user["id"], name=doc["name"] + " (Copy)",
                    description=doc.get("description", ""), board=doc["board"],
                    language=doc["language"], framework=doc.get("framework"),
                    code=doc.get("code", ""))
    await db.projects.insert_one(clone.model_dump())
    return clone
