import shutil
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

import app.clients.vectordb as vectordb_module
from app.config import settings
from app.main import app


@pytest.fixture(autouse=True)
def clean_data_dir():
    tmp = Path(tempfile.mkdtemp())
    original = settings.chroma_persist_dir
    settings.chroma_persist_dir = tmp
    vectordb_module._vector_db = None
    yield
    settings.chroma_persist_dir = original
    vectordb_module._vector_db = None
    shutil.rmtree(tmp, ignore_errors=True)


@pytest.fixture
def sample_txt():
    return b"This is a test document. It has multiple sentences for chunking."


@pytest.fixture
def sample_md():
    return b"# Test\n\nThis is a markdown document with *formatting*."


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
def mock_embedding():
    with patch("app.services.embedding.embed_texts", new_callable=AsyncMock) as m:
        m.return_value = ([[0.1] * 1536], 10)
        yield m


@pytest.fixture
def mock_llm():
    with patch("app.clients.llm.generate", new_callable=AsyncMock) as m:
        m.return_value = "This is a mocked answer."
        yield m


@pytest.fixture
def mock_vector_search():
    with patch("app.clients.vectordb.VectorDBClient.search", new_callable=AsyncMock) as m:
        m.return_value = {
            "ids": [["hash1_chunk_0"]],
            "documents": [["Some relevant context text."]],
            "metadatas": [[{"doc_id": "hash1", "source_file": "test.txt", "chunk_index": 0}]],
            "distances": [[0.15]],
        }
        yield m
