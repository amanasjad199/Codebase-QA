import pytest


@pytest.mark.asyncio
async def test_query_returns_answer(client, mock_embedding, mock_llm, mock_vector_search):
    response = await client.post("/query", json={"question": "What is this about?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["sources"], list)
    assert "latency_ms" in data


@pytest.mark.asyncio
async def test_query_empty_question_returns_400(client):
    response = await client.post("/query", json={"question": ""})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_query_missing_question_returns_422(client):
    response = await client.post("/query", json={})
    assert response.status_code == 422
