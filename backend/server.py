"""HRL Forge AI - FastAPI backend entrypoint."""
import os
import logging
import uuid
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import get_db, close_db  # noqa: E402
from seed_data import seed_all  # noqa: E402
from routers.auth_router import router as auth_router  # noqa: E402
from routers.projects_router import router as projects_router  # noqa: E402
from routers.generate_router import router as generate_router  # noqa: E402
from routers.history_router import router as history_router  # noqa: E402
from routers.knowledge_router import router as knowledge_router  # noqa: E402
from routers.chat_router import router as chat_router  # noqa: E402
from routers.settings_router import router as settings_router  # noqa: E402
from routers.admin_router import router as admin_router  # noqa: E402


# ---------- Logging ----------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("hrl-forge")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("HRL Forge AI backend starting up...")
    try:
        await seed_all()
        logger.info("Knowledge base seeded.")
    except Exception as e:
        logger.exception("Seed failed: %s", e)
    yield
    await close_db()


app = FastAPI(
    title="HRL Forge AI",
    description="AI Engineering Platform for Embedded Systems, Robotics, IoT, Electronics.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------- Middleware ----------
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ---------- API v1 router ----------
api_router = APIRouter(prefix="/api")
v1 = APIRouter(prefix="/v1")


@api_router.get("/")
async def root():
    return {"name": "HRL Forge AI", "version": "1.0.0", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy"}


v1.include_router(auth_router)
v1.include_router(projects_router)
v1.include_router(generate_router)
v1.include_router(history_router)
v1.include_router(knowledge_router)
v1.include_router(chat_router)
v1.include_router(settings_router)
v1.include_router(admin_router)

api_router.include_router(v1)
app.include_router(api_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
