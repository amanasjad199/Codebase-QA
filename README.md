# CodebaseQA Backend

CodebaseQA is a FastAPI backend for indexing source repositories and answering code questions with retrieval augmented generation.

This repository currently implements only:

- Phase 1: setup, repository ingestion, and code chunking
- Phase 2: embeddings pipeline and PostgreSQL + pgvector integration
- Phase 3: semantic search and RAG answer generation

It intentionally does not include a frontend or deployment setup.

## Features

- Upload a local repository ZIP or link a GitHub repository.
- Safely extract or clone repositories into a local working directory.
- Ignore common generated or dependency folders such as `.git`, `node_modules`, `venv`, `__pycache__`, `dist`, and `build`.
- Detect `.py`, `.js`, `.jsx`, `.ts`, and `.tsx` source files.
- Chunk Python with `ast` for functions and classes.
- Chunk JavaScript and TypeScript with a safe structural fallback.
- Fall back to line-based chunking when parsing fails.
- Generate local `sentence-transformers/all-MiniLM-L6-v2` embeddings in batches.
- Store 384-dimensional vectors in Aurora PostgreSQL or PostgreSQL using pgvector.
- Search code semantically with `/search`.
- Answer questions with cited snippets using Groq chat models through `/qa`.

## Requirements

- Python 3.11+
- Amazon Aurora PostgreSQL or PostgreSQL 15+
- pgvector extension installed in PostgreSQL
- Groq API key for RAG answer generation
- Git CLI for GitHub repository ingestion

For Aurora PostgreSQL, enable pgvector in your database before running migrations:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Local Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -e ".[dev]"
```

Create your environment file:

```bash
cp .env.example .env
```

Set `DATABASE_URL` and `GROQ_API_KEY` in `.env`.

Run migrations:

```bash
alembic upgrade head
```

Start the backend:

```bash
uvicorn app.main:app --reload
```

API docs are available at:

```text
http://127.0.0.1:8000/docs
```

## API

### Upload ZIP

```bash
curl -X POST "http://127.0.0.1:8000/repos/upload" \
  -F "file=@repo.zip"
```

### Ingest GitHub Repository

```bash
curl -X POST "http://127.0.0.1:8000/repos/from-github" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/owner/repo"}'
```

### Repository Stats

```bash
curl "http://127.0.0.1:8000/repos/1/stats"
```

### Generate Embeddings

Run this after a repository is uploaded or cloned. It embeds any chunks that do not already have vectors and reuses cached vectors for duplicate chunk content.

```bash
curl -X POST "http://127.0.0.1:8000/repos/1/embeddings"
```

### Semantic Search

```bash
curl -X POST "http://127.0.0.1:8000/search" \
  -H "Content-Type: application/json" \
  -d '{"repo_id":1,"query":"Where is authentication handled?","top_k":5}'
```

### RAG Q&A

```bash
curl -X POST "http://127.0.0.1:8000/qa" \
  -H "Content-Type: application/json" \
  -d '{"repo_id":1,"question":"How does login validation work?"}'
```

## Testing

Run smoke tests:

```bash
pytest
```

The smoke tests mock local embedding and Groq calls where needed, so a live PostgreSQL database is not required for the test suite.
