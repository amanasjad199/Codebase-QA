import pytest


@pytest.mark.asyncio
async def test_ingest_txt_success(client, mock_embedding):
    content = b"Unique content for test_ingest_txt_success"
    response = await client.post("/ingest", files={"file": ("test.txt", content, "text/plain")})
    assert response.status_code == 200
    data = response.json()
    assert "doc_id" in data
    assert data["status"] == "done"
    assert data["chunk_count"] > 0


@pytest.mark.asyncio
async def test_ingest_duplicate_returns_409(client, mock_embedding):
    content = b"Content to test duplicate detection"
    await client.post("/ingest", files={"file": ("dup.txt", content, "text/plain")})
    response = await client.post("/ingest", files={"file": ("dup.txt", content, "text/plain")})
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_ingest_unsupported_type_returns_422(client):
    response = await client.post("/ingest", files={"file": ("test.docx", b"fake", "application/octet-stream")})
    assert response.status_code == 422
