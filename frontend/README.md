# CodebaseQA — Frontend

React + Vite UI for the CodebaseQA RAG backend: upload a document, ask questions,
get grounded answers with cited sources and confidence scores.

## Stack
React Router · Axios · TanStack Query · React Markdown · Prism (react-syntax-highlighter) · Lucide icons.

## Quick start

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

In dev, requests to `/api` are proxied to the backend (default `http://127.0.0.1:8000`),
so there are no CORS issues. Start the backend separately:

```bash
# from the repo root
uvicorn app.main:app --reload --port 8000
```

## Configuration

Copy `.env.example` to `.env` and set values as needed.

| Variable | Dev | Production |
|----------|-----|------------|
| `VITE_API_URL` | leave empty (use proxy) | full backend origin, e.g. `https://codebaseqa-api.onrender.com` |
| `VITE_DEV_BACKEND` | `http://127.0.0.1:8000` | (unused) |

## Build

```bash
npm run build        # outputs to dist/
npm run preview      # serve the production build locally
```

## What maps to which endpoint
- Upload page → `POST /ingest`
- Ask page (question box) → `POST /query`
- Library panel (stats + list + delete) → `GET /documents`, `DELETE /documents/{id}`
- Header status dot → `GET /health`
