"""Pydantic domain models for HRL Forge AI."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, EmailStr, ConfigDict


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------- USERS ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    session_id: str


# ---------- WIRING SHARE ----------
class WiringShareCreate(BaseModel):
    prompt: str
    board: str
    board_name: Optional[str] = None
    connections: List[Dict[str, Any]] = []
    bom: List[Dict[str, Any]] = []
    libraries: List[str] = []
    notes: str = ""


class WiringShare(BaseModel):
    id: str = Field(default_factory=_uuid)
    token: str = Field(default_factory=lambda: _uuid().replace("-", "")[:12])
    user_id: str
    prompt: str
    board: str
    board_name: Optional[str] = None
    connections: List[Dict[str, Any]] = []
    bom: List[Dict[str, Any]] = []
    libraries: List[str] = []
    notes: str = ""
    view_count: int = 0
    created_at: str = Field(default_factory=_now)


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    created_at: str
    avatar_url: Optional[str] = None


class UserDB(BaseModel):
    id: str = Field(default_factory=_uuid)
    email: EmailStr
    name: str
    password_hash: str
    role: str = "user"
    created_at: str = Field(default_factory=_now)
    avatar_url: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- PROJECTS ----------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    board: str
    language: str
    framework: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    board: Optional[str] = None
    language: Optional[str] = None
    framework: Optional[str] = None
    code: Optional[str] = None


class Project(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    name: str
    description: str = ""
    board: str
    language: str
    framework: Optional[str] = None
    code: str = ""
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


# ---------- GENERATION / HISTORY ----------
class GenerateRequest(BaseModel):
    prompt: str
    board: str
    language: str
    framework: Optional[str] = None
    mode: str = "generate"  # generate | explain | review | fix | optimize | wiring | bom
    project_id: Optional[str] = None
    existing_code: Optional[str] = None
    provider: Optional[str] = "anthropic"
    model: Optional[str] = "claude-sonnet-4-6"


class GenerateResponse(BaseModel):
    id: str
    code: str
    explanation: str
    libraries: List[str] = []
    connections: List[Dict[str, Any]] = []
    optimization: str = ""
    raw: str
    created_at: str


class HistoryEntry(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    project_id: Optional[str] = None
    mode: str
    board: str
    language: str
    prompt: str
    code: str = ""
    explanation: str = ""
    libraries: List[str] = []
    connections: List[Dict[str, Any]] = []
    optimization: str = ""
    raw: str = ""
    created_at: str = Field(default_factory=_now)


# ---------- KNOWLEDGE BASE ----------
class Board(BaseModel):
    id: str = Field(default_factory=_uuid)
    slug: str
    name: str
    family: str  # arduino / esp / stm32 / rpi / atmel
    mcu: str
    clock: str
    flash: str
    ram: str
    gpio: int
    voltage: str
    interfaces: List[str] = []
    description: str = ""
    image: Optional[str] = None
    languages: List[str] = []


class Sensor(BaseModel):
    id: str = Field(default_factory=_uuid)
    slug: str
    name: str
    category: str
    protocol: str
    voltage: str
    description: str = ""
    typical_use: str = ""


class Template(BaseModel):
    id: str = Field(default_factory=_uuid)
    slug: str
    name: str
    board: str
    language: str
    difficulty: str = "beginner"
    tags: List[str] = []
    description: str = ""
    prompt: str = ""


class Module(BaseModel):
    id: str = Field(default_factory=_uuid)
    slug: str
    name: str
    category: str
    description: str = ""


class Protocol(BaseModel):
    id: str = Field(default_factory=_uuid)
    slug: str
    name: str
    description: str = ""
    typical_speed: Optional[str] = None
    pins: Optional[str] = None


# ---------- CHAT (Datasheet / Circuit Assistant) ----------
class ChatMessageIn(BaseModel):
    session_id: str
    message: str
    context: Optional[str] = "circuit"  # circuit | datasheet


class ChatMessage(BaseModel):
    id: str = Field(default_factory=_uuid)
    session_id: str
    user_id: str
    role: str  # user | assistant
    content: str
    context: str = "circuit"
    created_at: str = Field(default_factory=_now)


# ---------- SETTINGS ----------
class UserSettings(BaseModel):
    id: str = Field(default_factory=_uuid)
    user_id: str
    default_provider: str = "anthropic"
    default_model: str = "claude-sonnet-4-6"
    openrouter_key: Optional[str] = None
    groq_key: Optional[str] = None
    huggingface_key: Optional[str] = None
    gemini_key: Optional[str] = None
    theme: str = "dark"
    updated_at: str = Field(default_factory=_now)


class UserSettingsUpdate(BaseModel):
    default_provider: Optional[str] = None
    default_model: Optional[str] = None
    openrouter_key: Optional[str] = None
    groq_key: Optional[str] = None
    huggingface_key: Optional[str] = None
    gemini_key: Optional[str] = None
    theme: Optional[str] = None
