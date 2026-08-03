"""Auth routes: register, login, me, google."""
import os
from fastapi import APIRouter, HTTPException, Depends
import httpx

from models import (
    UserRegister,
    UserLogin,
    UserPublic,
    TokenResponse,
    UserDB,
    GoogleAuthRequest,
)
from auth import hash_password, verify_password, create_access_token, get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_ISSUERS = {"https://accounts.google.com", "accounts.google.com"}


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
    """Verify a Google Identity Services ID token and issue our own JWT.

    Uses Google's public tokeninfo endpoint to validate the token signature,
    audience and issuer. No client secret required — this is a public
    ID-token exchange, safe for SPA-style Google Sign-In.
    """
    expected_aud = os.environ.get("GOOGLE_CLIENT_ID", "")
    if not expected_aud:
        raise HTTPException(
            status_code=503,
            detail="Google sign-in is not configured on this server (GOOGLE_CLIENT_ID unset).",
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get(
                GOOGLE_TOKENINFO_URL, params={"id_token": payload.id_token}
            )
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Google unreachable: {e}")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    info = r.json()

    if info.get("aud") != expected_aud:
        raise HTTPException(status_code=401, detail="Google token audience mismatch")
    if info.get("iss") not in GOOGLE_ISSUERS:
        raise HTTPException(status_code=401, detail="Invalid Google token issuer")
    email = (info.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="No email on Google profile")

    db = get_db()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": info.get("name") or existing.get("name") or email.split("@")[0],
                "avatar_url": info.get("picture") or existing.get("avatar_url"),
            }},
        )
        user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    else:
        u = UserDB(
            email=email,
            name=info.get("name") or email.split("@")[0],
            password_hash="",  # OAuth user — no local password
            avatar_url=info.get("picture"),
        )
        await db.users.insert_one(u.model_dump())
        user_doc = u.model_dump()

    token = create_access_token(user_doc["id"], user_doc.get("role", "user"))
    public = UserPublic(**{k: v for k, v in user_doc.items() if k != "password_hash"})
    return TokenResponse(access_token=token, user=public)
