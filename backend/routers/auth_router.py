"""Auth routes: register, login, me."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone

from models import UserRegister, UserLogin, UserPublic, TokenResponse, UserDB
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = UserDB(
        email=payload.email.lower(),
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    await db.users.insert_one(user.model_dump())
    token = create_access_token(user.id, user.role)
    public = UserPublic(**{k: v for k, v in user.model_dump().items() if k != "password_hash"})
    return TokenResponse(access_token=token, user=public)


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["id"], user.get("role", "user"))
    public = UserPublic(**{k: v for k, v in user.items() if k != "password_hash"})
    return TokenResponse(access_token=token, user=public)


@router.get("/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return UserPublic(**user)
