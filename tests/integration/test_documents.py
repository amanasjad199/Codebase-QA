import pytest


@pytest.mark.asyncio
async def test_list_documents_empty(client):
    response = await client.get("/documents")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_get_document_not_found(client):
    response = await client.get("/documents/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_document(client, mock_embedding):
    content = b"Content to test document deletion"
    ingest = await client.post("/ingest", files={"file": ("del.txt", content, "text/plain")})
    doc_id = ingest.json()["doc_id"]
    response = await client.delete(f"/documents/{doc_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
