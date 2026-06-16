import logging
from pathlib import Path
from typing import Any

import chromadb

from app.config import settings

logger = logging.getLogger(__name__)


class VectorDBClient:
    def __init__(self) -> None:
        persist_dir = Path(settings.chroma_persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(persist_dir))

    def _get_or_create_collection(self, collection: str = "documents"):
        return self._client.get_or_create_collection(name=collection)

    def upsert(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict[str, Any]], collection: str = "documents") -> None:
        col = self._get_or_create_collection(collection)
        col.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    async def search(self, query_vector: list[float], n_results: int = 5, collection: str = "documents") -> dict:
        col = self._get_or_create_collection(collection)
        results = col.query(query_embeddings=[query_vector], n_results=n_results, include=["documents", "metadatas", "distances"])
        return results

    def delete(self, doc_id: str, collection: str = "documents") -> None:
        col = self._get_or_create_collection(collection)
        col.delete(where={"doc_id": doc_id})

    def list_all(self, collection: str = "documents") -> dict:
        col = self._get_or_create_collection(collection)
        return col.get(include=["metadatas"])

    def get_by_doc_id(self, doc_id: str, collection: str = "documents") -> dict:
        col = self._get_or_create_collection(collection)
        return col.get(where={"doc_id": doc_id})

    def count_chunks(self, doc_id: str, collection: str = "documents") -> int:
        col = self._get_or_create_collection(collection)
        result = col.get(where={"doc_id": doc_id})
        return len(result["ids"]) if result and result["ids"] else 0

    def health(self) -> str:
        try:
            self._client.heartbeat()
            return "ok"
        except Exception as exc:
            return f"error: {exc}"


_vector_db: VectorDBClient | None = None


def get_vector_db() -> VectorDBClient:
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDBClient()
    return _vector_db

