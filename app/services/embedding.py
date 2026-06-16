import logging
from functools import lru_cache

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_local_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.local_embedding_model)


async def embed_texts(texts: list[str]) -> tuple[list[list[float]], int]:
    if not texts:
        return [], 0
    if settings.embedding_model == "local":
        return _embed_local(texts)
    return await _embed_openai(texts)


async def _embed_openai(texts: list[str]) -> tuple[list[list[float]], int]:
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required for OpenAI embeddings")
    client = OpenAI(api_key=settings.openai_api_key)
    batch_size = 100
    all_embeddings = []
    total_tokens = 0
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(model="text-embedding-ada-002", input=batch)
        all_embeddings.extend([item.embedding for item in response.data])
        total_tokens += response.usage.total_tokens
    return all_embeddings, total_tokens


def _embed_local(texts: list[str]) -> tuple[list[list[float]], int]:
    model = _get_local_model()
    vectors = model.encode(texts, normalize_embeddings=True)
    embeddings = [list(map(float, v)) for v in vectors]
    estimated_tokens = sum(max(1, len(t.split())) for t in texts)
    return embeddings, estimated_tokens
