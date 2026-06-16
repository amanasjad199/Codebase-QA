# TASKS.md – Development Tasks

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Phase 1 – Setup

### TASK-01: Project scaffolding
- [x] Create folder structure as per ARCHITECTURE.md
- [x] Create `requirements.txt` with all dependencies
- [x] Create `.env.example` with all required variables
- [x] Create `app/config.py` using `pydantic-settings` or `python-dotenv`
- [x] Create `app/main.py` with FastAPI app instance and router mounts
- [ ] Verify `uvicorn app.main:app --reload` starts without errors

**Acceptance:** `GET /health` returns 200

---

### TASK-02: Dependency installation
```
fastapi
uvicorn[standard]
python-dotenv
pydantic
pymupdf          # PDF parsing
langchain        # Chunking
openai           # Embeddings + LLM
chromadb         # Vector DB (local)
httpx            # Async HTTP for testing
pytest
pytest-asyncio
```

**Acceptance:** `pip install -r requirements.txt` succeeds cleanly

---

### TASK-03: Config module
- [x] Load from `.env`: `OPENAI_API_KEY`, `EMBEDDING_MODEL`, `LLM_PROVIDER`, `LLM_MODEL`, `VECTOR_DB_PROVIDER`, `CHROMA_PERSIST_DIR`, `CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K`
- [x] Expose as a `Settings` singleton importable via `from app.config import settings`

---

## Phase 2 – Embeddings

### TASK-04: File parsers
- [x] `app/parsers/pdf_parser.py` — extract text from PDF using PyMuPDF
- [x] `app/parsers/text_parser.py` — read TXT and MD files
- [x] Unit test each parser with a sample file

---

### TASK-05: Chunker utility
- [x] `app/utils/chunker.py` — wrap `RecursiveCharacterTextSplitter`
- [x] Configurable `chunk_size` and `chunk_overlap` from settings
- [x] Return list of `{text, chunk_index}` dicts

---

### TASK-06: Embedding service
- [x] `app/services/embedding.py`
- [x] `embed_texts(texts: list[str]) -> list[list[float]]`
- [x] Support `EMBEDDING_MODEL=openai` (calls OpenAI API)
- [x] Support `EMBEDDING_MODEL=local` (uses `sentence-transformers`)
- [x] Batch calls in groups of 100

---

### TASK-07: Vector DB client
- [x] `app/clients/vectordb.py`
- [x] Interface: `upsert(ids, embeddings, documents, metadatas)`, `search(query_vector, n_results)`, `delete(doc_id)`, `list_all()`
- [x] Implement ChromaDB backend
- [ ] (Optional) Implement Qdrant backend

---

### TASK-08: Ingestion service
- [x] `app/services/ingestion.py`
- [x] `ingest_file(file_bytes, filename) -> IngestResponse`
- [x] Compute content hash; skip if already stored
- [x] Parse → chunk → embed → upsert
- [x] Write metadata to SQLite `documents` table

---

### TASK-09: Ingest router
- [x] `app/routers/ingest.py`
- [x] `POST /ingest` endpoint
- [x] Validate file type (pdf / txt / md only)
- [x] Call ingestion service
- [x] Return `IngestResponse`

---

## Phase 3 – RAG

### TASK-10: LLM client
- [x] `app/clients/llm.py`
- [x] `generate(prompt: str) -> str`
- [x] Support `LLM_PROVIDER=openai` (Chat completions)
- [x] Support `LLM_PROVIDER=ollama` (local REST)

---

### TASK-11: RAG service
- [x] `app/services/rag.py`
- [x] `answer_query(question, top_k, collection) -> QueryResponse`
- [x] Embed query
- [x] Search vector DB for top-K chunks
- [x] Build prompt template (system + context + question)
- [x] Call LLM
- [x] Return answer + sources + latency

---

### TASK-12: Query router
- [x] `app/routers/query.py`
- [x] `POST /query` endpoint
- [x] Validate non-empty question
- [x] Call RAG service
- [x] Return `QueryResponse`

---

### TASK-13: Documents router
- [x] `app/routers/documents.py`
- [x] `GET /documents` — list with pagination
- [x] `GET /documents/{doc_id}` — detail
- [x] `DELETE /documents/{doc_id}` — remove from vector DB + metadata store

---

### TASK-14: Health router
- [x] `app/routers/health.py`
- [x] Ping vector DB, embedding service, LLM client
- [x] Return aggregate status

---

## Phase 4 – Polish

### TASK-15: Logging
- [ ] Add structured logging via Python `logging` module
- [ ] Log level controlled by `LOG_LEVEL` env var
- [ ] Log each ingest and query with latency

### TASK-16: Error handling
- [ ] Global exception handler in `main.py`
- [ ] Proper HTTP status codes for all error cases

### TASK-17: Tests
- [ ] See `TEST_PLAN.md`

### TASK-18: Docker
- [ ] `Dockerfile` for the FastAPI app
- [ ] `docker-compose.yml` with app + optional Qdrant
- [ ] See `DEPLOYMENT.md`
