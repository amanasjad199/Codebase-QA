# API_SPEC.md – API Contracts

Base URL: `http://localhost:8000`
All responses are JSON. All errors follow the standard error envelope.

---

## Error Envelope

```json
{
  "error": "string describing the error",
  "detail": "optional additional context"
}
```

---

## 1. Health

### `GET /health`

Check that the API and all dependencies are reachable.

**Response 200**
```json
{
  "status": "ok",
  "vector_db": "ok",
  "llm": "ok",
  "embedding": "ok"
}
```

**Response 503** — one or more services unreachable
```json
{
  "status": "degraded",
  "vector_db": "error: connection refused",
  "llm": "ok",
  "embedding": "ok"
}
```

---

## 2. Ingestion

### `POST /ingest`

Upload a document for chunking, embedding, and storage.

**Request** — `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | ✅ | PDF, TXT, or MD file |
| `collection` | string | ❌ | Vector DB collection name (default: `documents`) |

**Response 200**
```json
{
  "doc_id": "abc123def456",
  "filename": "report.pdf",
  "chunk_count": 42,
  "status": "done"
}
```

**Response 409** — duplicate document
```json
{
  "error": "Document already ingested",
  "doc_id": "abc123def456"
}
```

**Response 422** — unsupported file type
```json
{
  "error": "Unsupported file type: .docx"
}
```

---

## 3. Query

### `POST /query`

Ask a question; returns a grounded answer with sources.

**Request Body** — `application/json`
```json
{
  "question": "What are the main findings of the report?",
  "top_k": 5,
  "collection": "documents"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `question` | string | ✅ | — | Natural-language question |
| `top_k` | int | ❌ | 5 | Number of chunks to retrieve |
| `collection` | string | ❌ | `"documents"` | Vector DB collection to search |

**Response 200**
```json
{
  "answer": "The main findings indicate that...",
  "sources": [
    {
      "doc_id": "abc123def456",
      "filename": "report.pdf",
      "chunk_index": 7,
      "score": 0.91
    },
    {
      "doc_id": "abc123def456",
      "filename": "report.pdf",
      "chunk_index": 12,
      "score": 0.87
    }
  ],
  "latency_ms": 1240
}
```

**Response 400** — empty question
```json
{
  "error": "Question must not be empty"
}
```

---

## 4. Documents

### `GET /documents`

List all ingested documents.

**Query Params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | 20 | Max results |
| `offset` | int | 0 | Pagination offset |

**Response 200**
```json
{
  "total": 5,
  "documents": [
    {
      "doc_id": "abc123def456",
      "filename": "report.pdf",
      "file_type": "pdf",
      "chunk_count": 42,
      "ingested_at": "2026-06-16T10:00:00Z",
      "status": "done"
    }
  ]
}
```

---

### `GET /documents/{doc_id}`

Get details for a specific document.

**Response 200**
```json
{
  "doc_id": "abc123def456",
  "filename": "report.pdf",
  "file_type": "pdf",
  "file_size": 204800,
  "chunk_count": 42,
  "ingested_at": "2026-06-16T10:00:00Z",
  "status": "done"
}
```

**Response 404**
```json
{
  "error": "Document not found"
}
```

---

### `DELETE /documents/{doc_id}`

Delete a document and all its embeddings.

**Response 200**
```json
{
  "doc_id": "abc123def456",
  "deleted_chunks": 42,
  "status": "deleted"
}
```

**Response 404**
```json
{
  "error": "Document not found"
}
```

---

## 5. Pydantic Schemas (Reference)

```python
# app/models/schemas.py

class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    status: str

class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    collection: str = "documents"

class SourceChunk(BaseModel):
    doc_id: str
    filename: str
    chunk_index: int
    score: float

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    latency_ms: int

class DocumentMeta(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    ingested_at: str
    status: str
```

---

## 6. OpenAPI Docs

FastAPI auto-generates docs at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
