# TEST_PLAN.md – Testing Strategy

---

## 1. Testing Levels

| Level | Tool | Coverage Target |
|-------|------|----------------|
| Unit | `pytest` | Parsers, chunker, embedding service, hashing |
| Integration | `pytest` + `httpx.AsyncClient` | All API endpoints (with mocked LLM/embedding) |
| E2E | Manual / script | Full ingest → query pipeline |

---

## 2. Test File Layout

```
tests/
├── conftest.py              # Fixtures: app client, sample files, mock services
├── unit/
│   ├── test_pdf_parser.py
│   ├── test_text_parser.py
│   ├── test_chunker.py
│   ├── test_hashing.py
│   └── test_embedding.py
├── integration/
│   ├── test_ingest.py
│   ├── test_query.py
│   ├── test_documents.py
│   └── test_health.py
└── fixtures/
    ├── sample.pdf
    ├── sample.txt
    └── sample.md
```

---

## 3. Fixtures (`conftest.py`)

```python
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from app.main import app

@pytest.fixture
def sample_pdf():
    with open("tests/fixtures/sample.pdf", "rb") as f:
        return f.read()

@pytest.fixture
def sample_txt():
    return b"This is a test document. It has multiple sentences for chunking."

@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

@pytest.fixture
def mock_embedding():
    with patch("app.services.embedding.EmbeddingService.embed_texts") as m:
        m.return_value = [[0.1] * 1536]
        yield m

@pytest.fixture
def mock_llm():
    with patch("app.clients.llm.LLMClient.generate") as m:
        m.return_value = "This is a mocked answer."
        yield m
```

---

## 4. Unit Tests

### `test_pdf_parser.py`
```python
def test_pdf_parser_extracts_text(sample_pdf):
    from app.parsers.pdf_parser import parse_pdf
    text = parse_pdf(sample_pdf)
    assert isinstance(text, str)
    assert len(text) > 0

def test_pdf_parser_empty_raises():
    from app.parsers.pdf_parser import parse_pdf
    with pytest.raises(ValueError):
        parse_pdf(b"")
```

### `test_chunker.py`
```python
def test_chunker_returns_list():
    from app.utils.chunker import chunk_text
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=20)
    assert isinstance(chunks, list)
    assert len(chunks) > 1

def test_chunker_respects_size():
    from app.utils.chunker import chunk_text
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=0)
    for chunk in chunks:
        assert len(chunk["text"]) <= 120  # some tolerance

def test_chunk_index_sequential():
    from app.utils.chunker import chunk_text
    chunks = chunk_text("word " * 500, chunk_size=100, overlap=0)
    indices = [c["chunk_index"] for c in chunks]
    assert indices == list(range(len(chunks)))
```

### `test_hashing.py`
```python
def test_same_content_same_hash():
    from app.utils.hashing import content_hash
    assert content_hash(b"hello") == content_hash(b"hello")

def test_different_content_different_hash():
    from app.utils.hashing import content_hash
    assert content_hash(b"hello") != content_hash(b"world")
```

---

## 5. Integration Tests

### `test_ingest.py`
```python
async def test_ingest_txt_success(client, sample_txt, mock_embedding):
    response = await client.post(
        "/ingest",
        files={"file": ("test.txt", sample_txt, "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "doc_id" in data
    assert data["status"] == "done"
    assert data["chunk_count"] > 0

async def test_ingest_duplicate_returns_409(client, sample_txt, mock_embedding):
    await client.post("/ingest", files={"file": ("test.txt", sample_txt, "text/plain")})
    response = await client.post("/ingest", files={"file": ("test.txt", sample_txt, "text/plain")})
    assert response.status_code == 409

async def test_ingest_unsupported_type_returns_422(client):
    response = await client.post(
        "/ingest",
        files={"file": ("test.docx", b"fake", "application/octet-stream")}
    )
    assert response.status_code == 422
```

### `test_query.py`
```python
async def test_query_returns_answer(client, mock_embedding, mock_llm):
    response = await client.post("/query", json={"question": "What is this about?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["sources"], list)
    assert "latency_ms" in data

async def test_query_empty_question_returns_400(client):
    response = await client.post("/query", json={"question": ""})
    assert response.status_code == 400

async def test_query_missing_question_returns_422(client):
    response = await client.post("/query", json={})
    assert response.status_code == 422
```

### `test_documents.py`
```python
async def test_list_documents_empty(client):
    response = await client.get("/documents")
    assert response.status_code == 200
    assert response.json()["total"] >= 0

async def test_get_document_not_found(client):
    response = await client.get("/documents/nonexistent")
    assert response.status_code == 404

async def test_delete_document(client, sample_txt, mock_embedding):
    ingest = await client.post("/ingest", files={"file": ("del.txt", sample_txt, "text/plain")})
    doc_id = ingest.json()["doc_id"]
    response = await client.delete(f"/documents/{doc_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "deleted"
```

### `test_health.py`
```python
async def test_health_returns_ok(client):
    response = await client.get("/health")
    assert response.status_code in (200, 503)
    assert "status" in response.json()
```

---

## 6. Running Tests

```bash
# All tests
pytest tests/ -v

# Unit only
pytest tests/unit/ -v

# Integration only
pytest tests/integration/ -v

# With coverage
pytest tests/ --cov=app --cov-report=term-missing

# Run specific test
pytest tests/integration/test_query.py::test_query_returns_answer -v
```

---

## 7. E2E Smoke Test (Manual)

```bash
# 1. Start server
uvicorn app.main:app --reload

# 2. Ingest a file
curl -X POST http://localhost:8000/ingest \
  -F "file=@sample.pdf"

# 3. Query it
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'

# 4. List documents
curl http://localhost:8000/documents

# 5. Delete
curl -X DELETE http://localhost:8000/documents/{doc_id}
```

---

## 8. CI Integration (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v --cov=app
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```
