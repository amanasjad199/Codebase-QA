# DATABASE.md – Database Schema

---

## 1. Overview

This project uses **two storage layers**:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Vector Store | ChromaDB (local) / Qdrant (Docker) | Store and search embeddings |
| Metadata Store | SQLite (local) / PostgreSQL (prod) | Track documents, ingestion status |

---

## 2. Vector Store Schema

### ChromaDB Collection: `documents`

ChromaDB stores three things per entry: `id`, `embedding`, `metadata`, and `document` (the chunk text).

#### Entry Structure

```python
{
    "id": "doc_abc123_chunk_0",          # Unique chunk ID
    "embedding": [0.012, -0.034, ...],   # float[] — 1536 dims (OpenAI) or 384 (local)
    "document": "chunk text goes here",  # Raw text of the chunk
    "metadata": {
        "doc_id": "abc123",              # Parent document ID (SHA256 prefix)
        "source_file": "report.pdf",     # Original filename
        "chunk_index": 0,                # Chunk position in document
        "chunk_total": 42,               # Total chunks in document
        "file_type": "pdf",              # pdf | txt | md
        "ingested_at": "2026-06-16T10:00:00Z"
    }
}
```

#### Index / Search
- Similarity metric: **Cosine** (default in ChromaDB)
- Search returns: `ids`, `documents`, `metadatas`, `distances`
- Query: `collection.query(query_embeddings=[...], n_results=5)`

---

### Qdrant Collection: `documents` (alternative)

```json
{
  "id": "uuid-v4",
  "vector": [0.012, -0.034, "..."],
  "payload": {
    "doc_id": "abc123",
    "source_file": "report.pdf",
    "chunk_index": 0,
    "chunk_total": 42,
    "text": "chunk text goes here",
    "file_type": "pdf",
    "ingested_at": "2026-06-16T10:00:00Z"
  }
}
```

---

## 3. Metadata Store Schema (SQLite / PostgreSQL)

Used to track document-level state separate from vector entries.

### Table: `documents`

```sql
CREATE TABLE documents (
    id          TEXT PRIMARY KEY,          -- SHA256 hash of file content (first 16 chars)
    filename    TEXT NOT NULL,             -- Original file name
    file_type   TEXT NOT NULL,             -- 'pdf' | 'txt' | 'md'
    file_size   INTEGER NOT NULL,          -- Bytes
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'pending',  -- pending | processing | done | error
    error_msg   TEXT,                      -- Populated if status = 'error'
    ingested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `query_log` (optional, for analytics)

```sql
CREATE TABLE query_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    query_text  TEXT NOT NULL,
    answer_text TEXT,
    sources     TEXT,                      -- JSON array of doc_ids
    latency_ms  INTEGER,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Metadata Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `doc_id` | string | SHA256 of file content, first 16 hex chars |
| `source_file` | string | Original uploaded filename |
| `chunk_index` | int | 0-based position of chunk within document |
| `chunk_total` | int | Total number of chunks for the document |
| `file_type` | string | `pdf`, `txt`, or `md` |
| `ingested_at` | ISO8601 | Timestamp of ingestion |

---

## 5. Chunking Parameters (affects storage)

| Parameter | Default | Env Var |
|-----------|---------|---------|
| Chunk size | 1000 chars | `CHUNK_SIZE` |
| Chunk overlap | 200 chars | `CHUNK_OVERLAP` |
| Embedding dimensions | 1536 (OpenAI) / 384 (local) | derived from model |

---

## 6. Storage Paths

```
data/
├── chroma_db/          # ChromaDB persistent storage (auto-created)
│   └── documents/
└── metadata.db         # SQLite metadata store (auto-created)
```

Set `CHROMA_PERSIST_DIR=./data/chroma_db` in `.env`.
