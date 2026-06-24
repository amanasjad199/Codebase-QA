# CodebaseQA — Deployment Guide

End-to-end steps to get the **backend** (FastAPI + ChromaDB) and **frontend**
(React + Vite) live for the demo. Read the "Backend env gotchas" section before
you deploy — the defaults shipped in `.env.example` will fail on embeddings.

---

## 0. Architecture in one line

`Browser (Vercel)  →  FastAPI /ingest /query /documents /health (Render)  →  ChromaDB (local disk) + OpenAI`

---

## 1. Backend — Render (Docker)

Files added for you: `Dockerfile`, `.dockerignore`, `render.yaml`.

### Option A — Blueprint (recommended)
1. Push this repo to GitHub.
2. Render → **New → Blueprint** → pick the repo. It reads `render.yaml`.
3. When prompted, paste your **`OPENAI_API_KEY`** (marked secret).
4. Deploy. Health check is `GET /health`; wait for it to go green.

### Option B — Manual web service
1. Render → **New → Web Service** → connect repo → **Runtime: Docker**.
2. Add the env vars from the table below.
3. (Optional) Add a **Disk** mounted at `/app/data`, size 1 GB, so ingested
   documents survive restarts. The free tier has **no** persistent disk.

### Railway (alternative)
`New Project → Deploy from repo`. Railway auto-detects the `Dockerfile`. Add the
same env vars. `$PORT` is injected automatically (the Dockerfile already honors it).

### Local Docker
```bash
docker build -t codebaseqa-api .
docker run -p 8000:8000 --env-file .env -v "$(pwd)/data:/app/data" codebaseqa-api
curl http://localhost:8000/health
```

---

## 2. Backend env gotchas (IMPORTANT)

The committed `.env.example` points `OPENAI_BASE_URL` at **Groq** with
`EMBEDDING_MODEL=openai`. **Groq does not serve an embeddings endpoint**, so
ingestion/query will fail. Pick ONE of these working configurations:

### ✅ Recommended — real OpenAI for everything (zero code changes)
```env
OPENAI_API_KEY=sk-...                       # a real OpenAI key
OPENAI_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=openai                       # uses text-embedding-ada-002
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
VECTOR_DB_PROVIDER=chroma
CHROMA_PERSIST_DIR=/app/data/chroma_db
```

### ⚠️ Free embeddings (local) + Groq LLM — needs a dependency added
Uses `sentence-transformers` locally (no embedding API cost) and Groq only for
the chat model. This requires the backend owner to add `sentence-transformers`
(and `torch`) to `requirements.txt` — they are **not** currently listed, so this
path will `ImportError` until that change is made.
```env
EMBEDDING_MODEL=local
LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2
LLM_PROVIDER=openai
LLM_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=gsk_...                       # Groq key (LLM only)
OPENAI_BASE_URL=https://api.groq.com/openai/v1
```

### Full env reference
| Variable | Purpose | Suggested |
|----------|---------|-----------|
| `OPENAI_API_KEY` | embeddings + LLM auth | your key (secret) |
| `OPENAI_BASE_URL` | API origin | `https://api.openai.com/v1` |
| `EMBEDDING_MODEL` | `openai` or `local` | `openai` |
| `LLM_PROVIDER` | `openai` or `ollama` | `openai` |
| `LLM_MODEL` | chat model | `gpt-4o` |
| `VECTOR_DB_PROVIDER` | `chroma` | `chroma` |
| `CHROMA_PERSIST_DIR` | vector store path | `/app/data/chroma_db` |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | chunking | `1000` / `200` |
| `TOP_K` | retrieved chunks | `5` |
| `LOG_LEVEL` | logging | `INFO` |

> **Dimension note:** the repo ships a `data/chroma_db` that was built with one
> embedding model. If you switch models (e.g. local 384-dim ↔ ada 1536-dim), the
> backend detects the mismatch and recreates the collection — you must re-ingest.
> Cleanest is to delete `data/chroma_db` and start fresh with your chosen model.

---

## 3. Frontend — Vercel

Files added for you: `frontend/vercel.json`, `frontend/.env.example`.

1. Vercel → **Add New → Project** → import the repo.
2. Set **Root Directory = `frontend`** (important — the repo root is the API).
3. Framework preset auto-detects **Vite**. Build `npm run build`, output `dist`.
4. Add an env var **`VITE_API_URL`** = your backend origin
   (e.g. `https://codebaseqa-api.onrender.com`). No trailing slash.
5. Deploy. SPA routing is handled by `vercel.json` rewrites.

The backend already sends `Access-Control-Allow-Origin: *`, so the cross-origin
call from Vercel → Render works without extra config.

---

## 4. Pre-demo checklist
- [ ] Backend `/health` returns `{"status":"ok"}`.
- [ ] One document pre-ingested (so judges see instant results). Keep the API on a
      paid/always-on plan or a persistent disk so it isn't wiped by a cold start.
- [ ] `VITE_API_URL` points at the live backend; reload the Vercel URL.
- [ ] Ask 3–5 rehearsed questions; confirm answers cite sources with confidence badges.
- [ ] Test once on a phone (the UI collapses to a single column under ~760px).

---

## 5. Known scope gaps (carry into the demo narrative)
1. **It's document Q&A, not code search.** Backend ingests PDF/TXT/MD, chunks by
   characters, stores in ChromaDB. The roadmap's GitHub ingestion, AST chunking,
   and Aurora/pgvector are not implemented.
2. **`/query` returns source references, not chunk text** — so there's no in-app
   code/snippet viewer. Adding the chunk `text` to each `SourceChunk` in the
   backend would let the frontend show full passages immediately.
3. **No auth.** Fine for a demo; do not expose a real key on a public instance
   without a usage cap.
