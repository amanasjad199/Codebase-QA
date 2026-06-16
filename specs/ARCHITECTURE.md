# ARCHITECTURE.md – System Design

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│              (curl / frontend / Postman)                │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST
┌───────────────────────▼─────────────────────────────────┐
│                   FastAPI App                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  /ingest    │  │  /query      │  │  /documents   │  │
│  │  router     │  │  router      │  │  router       │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                │                   │          │
│  ┌──────▼──────┐  ┌──────▼───────┐           │          │
│  │  Ingestion  │  │  RAG         │           │          │
│  │  Service    │  │  Service     │           │          │
│  └──────┬──────┘  └──┬──────┬───┘           │          │
└─────────┼────────────┼──────┼───────────────┼──────────┘
          │            │      │               │
   ┌──────▼──────┐     │  ┌───▼────┐   ┌──────▼──────┐
   │  Embedding  │     │  │  LLM   │   │  Vector DB  │
   │  Service    │     │  │  Client│   │  (Chroma /  │
   │  (OpenAI /  │     │  │(OpenAI/│   │   Qdrant)   │
   │  local)     │     │  │Ollama) │   └─────────────┘
   └──────┬──────┘     │  └────────┘
          │            │
   ┌──────▼────────────▼──┐
   │     Vector DB        │
   │  (ChromaDB / Qdrant) │
   └──────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 FastAPI App (`app/main.py`)
- Entry point
- Mounts routers: `/ingest`, `/query`, `/documents`, `/health`
- Handles CORS, logging middleware, error handlers

### 2.2 Ingestion Service (`app/services/ingestion.py`)
Responsibilities:
1. Accept uploaded file
2. Parse file → raw text (via `parsers/`)
3. Chunk text via `RecursiveCharacterTextSplitter`
4. Generate embeddings via `EmbeddingService`
5. Store vectors + metadata in Vector DB
6. Return document ID + chunk count

### 2.3 Embedding Service (`app/services/embedding.py`)
- Wraps OpenAI embeddings API or `sentence-transformers`
- Configurable via `EMBEDDING_MODEL` env var
- Batched embedding calls for efficiency

### 2.4 RAG Service (`app/services/rag.py`)
Responsibilities:
1. Embed the user query
2. Search vector DB for top-K chunks
3. Build prompt: `[system] + [context chunks] + [user query]`
4. Call LLM client
5. Return answer + sources

### 2.5 LLM Client (`app/clients/llm.py`)
- Abstraction over OpenAI Chat API and Ollama REST API
- Configurable via `LLM_PROVIDER` env var

### 2.6 Vector DB Client (`app/clients/vectordb.py`)
- Abstraction over ChromaDB (local) and Qdrant (Docker)
- Configurable via `VECTOR_DB_PROVIDER` env var
- Operations: `upsert`, `search`, `delete`, `list`

### 2.7 Parsers (`app/parsers/`)
- `pdf_parser.py` – PyMuPDF
- `text_parser.py` – plain text / markdown

---

## 3. Folder Structure

```
rag-project/
├── app/
│   ├── main.py
│   ├── config.py                # Settings from .env
│   ├── routers/
│   │   ├── ingest.py
│   │   ├── query.py
│   │   ├── documents.py
│   │   └── health.py
│   ├── services/
│   │   ├── ingestion.py
│   │   ├── embedding.py
│   │   └── rag.py
│   ├── clients/
│   │   ├── llm.py
│   │   └── vectordb.py
│   ├── parsers/
│   │   ├── pdf_parser.py
│   │   └── text_parser.py
│   ├── models/
│   │   └── schemas.py           # Pydantic models
│   └── utils/
│       ├── chunker.py
│       └── hashing.py
├── tests/
│   ├── test_ingest.py
│   ├── test_query.py
│   └── test_embedding.py
├── data/
│   └── chroma_db/               # Persistent ChromaDB storage
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API_SPEC.md
│   ├── TASKS.md
│   ├── TEST_PLAN.md
│   ├── DEPLOYMENT.md
│   └── AGENT_RULES.md
├── .env.example
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 4. Data Flow

### Ingestion Flow
```
Upload File
    → Parse to text
    → Split into chunks (size=1000, overlap=200)
    → Embed each chunk  [batch size=100]
    → Store in VectorDB with metadata:
        { doc_id, chunk_index, source_file, text }
    → Return { doc_id, chunk_count }
```

### Query Flow
```
User Query
    → Embed query vector
    → VectorDB similarity search (top K=5)
    → Build prompt with retrieved chunks
    → LLM generates answer
    → Return { answer, sources[] }
```

---

## 5. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| FastAPI over Flask | Async support, auto OpenAPI docs, type safety via Pydantic |
| ChromaDB default | Zero-config local persistence; swap to Qdrant for production |
| Provider abstraction | Swap LLM/embedding/DB without touching business logic |
| Content hashing | Prevent duplicate embeddings for re-uploaded files |
| Chunking with overlap | Preserve context across chunk boundaries |
