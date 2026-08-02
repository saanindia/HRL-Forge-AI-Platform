"""Auth routes: register, login, me, google."""
import os
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import httpx

from models import UserRegister, UserLogin, UserPublic, TokenResponse, UserDB, GoogleAuthRequest
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

EMERGENT_AUTH_SESSION_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)


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


@router.post("/google", response_model=TokenResponse)
async def google_auth(payload: GoogleAuthRequest):
    """Exchange an Emergent Google OAuth session_id for our own JWT token.

    Bridges Emergent-managed Google Auth into the existing users collection so
    both auth methods produce the same `hrl_token` shape the frontend already
    understands. REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR
    REDIRECT URLS, THIS BREAKS THE AUTH.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.get(
                EMERGENT_AUTH_SESSION_URL,
                headers={"X-Session-ID": payload.session_id},
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Auth provider unreachable: {e}")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session_id")
    profile = r.json()
    email = (profile.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email returned from provider")

    db = get_db()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        # Refresh profile fields opportunistically
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": profile.get("name") or existing.get("name") or email.split("@")[0],
                "avatar_url": profile.get("picture") or existing.get("avatar_url"),
            }},
        )
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    else:
        user = UserDB(
            email=email,
            name=profile.get("name") or email.split("@")[0],
            password_hash="",  # OAuth user — no local password
            avatar_url=profile.get("picture"),
        )
        await db.users.insert_one(user.model_dump())
        user_doc = user.model_dump()

    token = create_access_token(user_doc["id"], user_doc.get("role", "user"))
    public = UserPublic(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    return TokenResponse(access_token=token, user=public)
