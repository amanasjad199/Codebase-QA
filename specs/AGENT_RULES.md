# AGENT_RULES.md – Instructions for Claude Code / Codex

> This file tells AI coding agents how to work on this RAG project.
> Read this before touching any code.

---

## 1. Project Identity

This is a **Python FastAPI RAG (Retrieval-Augmented Generation) pipeline**.

Core phases:
- **Phase 1**: Setup — FastAPI app, config, health check
- **Phase 2**: Embeddings — file ingestion, chunking, vector storage
- **Phase 3**: RAG — query pipeline, LLM answer generation

Spec documents live in `docs/`. **Always consult them before implementing.**

| Doc | Purpose |
|-----|---------|
| `PRD.md` | What we're building and why |
| `ARCHITECTURE.md` | Folder layout, components, data flow |
| `DATABASE.md` | Vector DB schema and metadata schema |
| `API_SPEC.md` | Exact request/response contracts |
| `TASKS.md` | Work breakdown — check off tasks as you complete them |
| `TEST_PLAN.md` | How to test everything |
| `DEPLOYMENT.md` | How to run locally and in Docker |

---

## 2. Before Writing Any Code

1. Read the relevant section of `ARCHITECTURE.md`
2. Read the matching task in `TASKS.md`
3. Check if a test already exists in `TEST_PLAN.md` — implement it alongside the code
4. Never create files outside the structure defined in `ARCHITECTURE.md`

---

## 3. Code Style Rules

- **Python 3.11+** — use modern type hints (`list[str]`, `dict[str, int]`, `X | None`)
- **Pydantic v2** for all schemas
- **Async everywhere** — all services and route handlers must be `async def`
- **No hardcoded values** — all config via `from app.config import settings`
- **Docstrings** on every public function: one-liner is fine
- **Logging** via `import logging; logger = logging.getLogger(__name__)` — no `print()` statements in production code
- **Raise, don't return errors** — raise `HTTPException` in routers; raise domain-specific exceptions in services

---

## 4. Module Responsibilities — Do Not Cross These Boundaries

| Module | Allowed to | NOT allowed to |
|--------|-----------|----------------|
| `routers/` | Parse HTTP input, call services, return HTTP response | Talk to DB or LLM directly |
| `services/` | Orchestrate business logic, call clients | Handle HTTP or know about FastAPI |
| `clients/` | Talk to external APIs (OpenAI, ChromaDB) | Contain business logic |
| `parsers/` | Convert file bytes → string | Know about chunking or embeddings |
| `utils/` | Pure helper functions | Import from services or clients |

---

## 5. Adding New Features

Workflow:
1. Update `PRD.md` with the new requirement
2. Update `ARCHITECTURE.md` if new files/components are needed
3. Update `API_SPEC.md` if a new endpoint is involved
4. Add tasks to `TASKS.md`
5. Write the test in `TEST_PLAN.md` first (TDD)
6. Implement the code
7. Mark task `[x]` in `TASKS.md`

---

## 6. Environment Variables

All config lives in `.env`. Access via `settings`:

```python
from app.config import settings

settings.openai_api_key
settings.embedding_model
settings.chunk_size
```

**Never** read `os.environ` directly in services or clients.

---

## 7. Error Handling

Routers raise `HTTPException`:
```python
from fastapi import HTTPException

raise HTTPException(status_code=404, detail="Document not found")
```

Services raise plain Python exceptions:
```python
class DocumentNotFoundError(Exception): pass
class DuplicateDocumentError(Exception): pass
```

The global exception handler in `main.py` maps service exceptions → HTTP errors.

---

## 8. Testing Rules

- Every new function gets at least one unit test
- Every new endpoint gets at least one integration test
- Mock external calls (OpenAI, ChromaDB) in tests — never hit live APIs in CI
- Use fixtures from `tests/conftest.py`
- Run `pytest tests/ -v` before considering a task done

---

## 9. What NOT to Do

- ❌ Don't add new dependencies without updating `requirements.txt` and noting it in the relevant task
- ❌ Don't store secrets in code, comments, or test files
- ❌ Don't call OpenAI or any external API in unit tests
- ❌ Don't use `print()` — use `logger.info()` / `logger.debug()`
- ❌ Don't create files outside the structure in `ARCHITECTURE.md` without updating that doc
- ❌ Don't skip updating `TASKS.md` — mark tasks `[x]` when complete

---

## 10. Commit Message Format

```
feat(ingest): add duplicate detection via content hash
fix(query): handle empty results from vector DB gracefully
test(embedding): add unit tests for batch embedding
docs(api): update API_SPEC with DELETE /documents response
```

Format: `type(scope): short description`
Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`
