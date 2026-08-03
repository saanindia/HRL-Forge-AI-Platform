# HRL Forge AI — Product Requirement Doc

## Original Problem Statement
Build a production-ready AI SaaS platform "HRL Forge AI" for Hemalata Robotics Lab —
an AI engineering platform for embedded systems, robotics, IoT, electronics,
industrial automation. Not a ChatGPT wrapper — a professional engineering workbench.

## Stack
- Frontend: React 19 + Tailwind + shadcn/ui + Monaco editor + react-router-dom 7
- Backend: FastAPI + Motor (MongoDB) + httpx
- AI: OpenRouter (default, Claude Sonnet 4.5) with abstraction for Gemini, Groq, HuggingFace, Ollama
- Auth: JWT (email + password, bcrypt)

## User Personas
- **Guest** — browses landing, signs up.
- **User** — authenticated engineer, uses workspace, projects, templates, chat.
- **Admin** — extra dashboard with users list and platform stats.

## Core Requirements Implemented (v1)
- JWT auth (register / login / me) at `/api/v1/auth`
- Dashboard with stats + recent projects + featured templates
- VS Code style AI Workspace with Monaco editor, board/language/framework pickers,
  7 modes (generate/fix/optimize/review/explain/wiring/BOM), 6 output tabs
  (code/explanation/libraries/connections/optimization/download)
- Projects CRUD + clone
- Templates library (8 seeded) with search
- Boards catalog (8 seeded) with full MCU specs
- Knowledge base seeded: boards, sensors, modules, protocols, templates
- History with detail view + delete
- Settings (provider selection, external keys)
- Circuit + Datasheet Chat assistant
- Documentation page
- Admin dashboard (stats + users list)
- Landing page with hero, features, boards showcase, workspace preview, footer
- Provider abstraction (anthropic/openai/gemini active; openrouter/groq/huggingface/ollama slots)
- Structured JSON response formatter for engineering output
- Request-ID middleware, structured logging

## REST API (all under /api/v1)
- /auth (register, login, me)
- /projects (list, create, get, update, delete, clone)
- /generate (POST + /providers GET)
- /history (list, get, delete)
- /boards, /sensors, /modules, /protocols, /templates
- /chat (message, session, sessions)
- /settings (get, update)
- /admin (users, stats)

## Backlog / P1
- Real-time streaming responses via SSE for /generate
- Google + GitHub OAuth login
- PCB / ROS / PLC assistants
- Docker + docker-compose files
- GitHub Actions CI
- File uploads for datasheet PDFs
- Semantic search in history
- Rate limiting middleware
- Alembic-style migrations (not applicable for Mongo but versioning schema)

## What's Done (2026-02)
- Complete UI + backend + AI integration
- Knowledge base seeded on startup
- Deployment-ready (single supervisor stack)
- Iter 2: Wiring Generator page with visual pin-map + Simulate tab (Wokwi + Serial preview)
- Iter 3: Component Library picker on Wiring page; Shareable Wiring (public /share/wiring/:token);
  Google Auth removed (was vendor-managed) — email/password JWT remains the only auth path
- Iter 4: Global Search palette (Cmd+K, /api/v1/search); Fork a Share flow (/app/wiring?fork=<token>);
  Wokwi launcher always-clickable with dynamic label (empty playground vs. with-code)
