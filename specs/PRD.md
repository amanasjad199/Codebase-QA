# PRD.md – Product Requirements Document

## Project: RAG System (Retrieval-Augmented Generation)

---

## 1. Overview

A local/cloud RAG pipeline that ingests documents, generates vector embeddings, stores them in a vector database, and answers user queries by retrieving relevant context and passing it to an LLM.

**Phases in scope:**
- Phase 1 – Setup (environment, dependencies, config)
- Phase 2 – Embeddings (document ingestion, chunking, embedding generation, vector storage)
- Phase 3 – RAG (query pipeline, context retrieval, LLM answer generation)

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Ingest documents (PDF, TXT, MD) and store embeddings persistently |
| G2 | Answer natural-language questions using retrieved document context |
| G3 | Keep latency under 3 seconds for query → answer roundtrip |
| G4 | Support swappable embedding models and LLM backends |
| G5 | Expose a clean REST API for integration with frontends or other services |

---

## 3. Non-Goals (v1)

- Multi-user auth / access control
- Real-time document streaming ingestion
- Fine-tuning the LLM
- UI/frontend (API only in v1)

---

## 4. Users & Use Cases

### Primary User: Developer / Researcher

| Use Case | Description |
|----------|-------------|
| UC-01 | Upload a document and have it chunked + embedded automatically |
| UC-02 | Ask a question and receive a grounded answer with source citations |
| UC-03 | List all ingested documents |
| UC-04 | Delete a document and its embeddings |
| UC-05 | Switch embedding model via config without changing code |

---

## 5. Functional Requirements

### Phase 1 – Setup
- FR-01: Project installs with a single `pip install -r requirements.txt`
- FR-02: `.env` file controls all secrets and model choices
- FR-03: Health-check endpoint confirms all services are reachable

### Phase 2 – Embeddings
- FR-04: Accept PDF, TXT, and MD file uploads
- FR-05: Chunk documents using configurable chunk size and overlap
- FR-06: Generate embeddings via OpenAI `text-embedding-ada-002` (or local model)
- FR-07: Store embeddings + metadata in a vector DB (ChromaDB or Qdrant)
- FR-08: Deduplicate documents by content hash

### Phase 3 – RAG
- FR-09: Accept a natural-language query via POST endpoint
- FR-10: Retrieve top-K most relevant chunks (default K=5)
- FR-11: Build a prompt with retrieved context + user query
- FR-12: Call LLM (OpenAI GPT-4o or local Ollama) and return answer
- FR-13: Return source document names and chunk indices alongside answer

---

## 6. Non-Functional Requirements

| NFR | Requirement |
|-----|-------------|
| NFR-01 | Query latency p95 < 3s (excluding cold start) |
| NFR-02 | Support documents up to 50 MB |
| NFR-03 | Embeddings stored persistently across restarts |
| NFR-04 | All config via environment variables — no hardcoded secrets |
| NFR-05 | Logging at INFO level by default, DEBUG via env flag |

---

## 7. Tech Stack

| Layer | Choice |
|-------|--------|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Embedding Model | OpenAI `text-embedding-ada-002` / `sentence-transformers` |
| LLM | OpenAI GPT-4o / Ollama (local) |
| Vector DB | ChromaDB (local) or Qdrant (Docker) |
| Document Parsing | PyMuPDF (PDF), built-in (TXT/MD) |
| Chunking | LangChain `RecursiveCharacterTextSplitter` |
| Config | `python-dotenv` |
| Testing | `pytest` + `httpx` |

---

## 8. Success Metrics

- Ingestion pipeline processes a 100-page PDF in < 30s
- Query returns correct grounded answer for 80%+ of test questions
- Zero hardcoded credentials in codebase
- All endpoints documented in OpenAPI spec
