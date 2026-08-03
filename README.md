# HRL Forge AI

A production-ready AI engineering platform for embedded systems, robotics, IoT
and industrial automation. Not a ChatGPT wrapper — a professional workbench for
engineers.

## Stack

- **Frontend**: React 19 + Tailwind + shadcn/ui + Monaco editor
- **Backend**: FastAPI + Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: Vendor-independent provider layer — OpenRouter (default), Gemini,
  Groq, HuggingFace, Ollama. Direct HTTP calls via `httpx`; no proprietary SDKs.

## Local development

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # (or just edit .env)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (in another terminal)
cd frontend
yarn install
yarn start
```

Backend defaults to `http://localhost:8001`. Frontend expects
`REACT_APP_BACKEND_URL` in `frontend/.env`.

## Configuration — Backend `.env`

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=hrl_forge

# CORS
CORS_ORIGINS=*

# Auth (JWT)
JWT_SECRET=change-me-please
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# AI defaults
AI_DEFAULT_PROVIDER=openrouter
AI_DEFAULT_MODEL=anthropic/claude-sonnet-4.5
AI_HTTP_TIMEOUT=120

# Provider keys (set at least one)
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

# Public URL used by OpenRouter's HTTP-Referer header (optional)
APP_PUBLIC_URL=https://forge.myhrl.in
```

## Deploying to Railway

### Backend

1. Create a new Railway project → **Deploy from GitHub**.
2. Point at the `backend/` directory (Railway auto-detects the `Dockerfile`).
3. Add a **MongoDB** plugin (or bring your own Atlas cluster).
4. Under **Variables**, set the values from the `.env` block above. `PORT`
   is provided by Railway automatically — the Dockerfile already honors it.
5. Deploy.

### Frontend

1. In the same project, add a second service pointing at the `frontend/`
   directory (or deploy to Vercel/Netlify).
2. Set `REACT_APP_BACKEND_URL` to the Railway backend URL, e.g.
   `https://hrl-forge-api.up.railway.app`.
3. Build command: `yarn build` — output: `build/`.

## AI Provider setup

You need at least one API key. Recommended: **OpenRouter** — one key, access
to Claude / GPT / Gemini / Llama / everything.

| Provider     | Key variable            | Get a key                             |
|--------------|-------------------------|---------------------------------------|
| OpenRouter   | `OPENROUTER_API_KEY`    | https://openrouter.ai/keys            |
| Gemini       | `GEMINI_API_KEY`        | https://aistudio.google.com/apikey    |
| Groq         | `GROQ_API_KEY`          | https://console.groq.com/keys         |
| HuggingFace  | `HUGGINGFACE_API_KEY`   | https://huggingface.co/settings/tokens |
| Ollama       | `OLLAMA_BASE_URL`       | self-hosted, no key needed            |

Individual users can also plug their own keys via Settings → External Provider
Keys (stored per-user in Mongo).

## Health check

```
GET /api/health   → { "status": "healthy" }
```

## License

Proprietary — Hemalata Robotics Lab.
