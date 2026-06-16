import logging
import time

from app.clients import llm as llm_client
from app.clients.vectordb import get_vector_db
from app.models.schemas import QueryResponse, SourceChunk
from app.services import embedding as embedding_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = "You are a helpful assistant. Answer the question based on the provided context. If the context does not contain enough information, say so."


async def answer_query(question: str, top_k: int = 5, collection: str = "documents") -> QueryResponse:
    start = time.monotonic()

    query_embeddings, _ = await embedding_service.embed_texts([question])
    if not query_embeddings:
        raise ValueError("Failed to embed query")

    query_vector = query_embeddings[0]
    results = await get_vector_db().search(query_vector, n_results=top_k, collection=collection)

    sources = []
    if results and results["ids"] and results["ids"][0]:
        for i, chunk_id in enumerate(results["ids"][0]):
            metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
            distance = results["distances"][0][i] if results.get("distances") else 0.0
            score = max(0.0, 1.0 - float(distance))
            sources.append(
                SourceChunk(
                    doc_id=metadata.get("doc_id", ""),
                    filename=metadata.get("source_file", ""),
                    chunk_index=metadata.get("chunk_index", 0),
                    score=round(score, 4),
                )
            )

    context_parts = []
    if results and results["documents"] and results["documents"][0]:
        for i, doc_text in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            source_ref = f"[{meta.get('source_file', 'unknown')}:{meta.get('chunk_index', 0)}]"
            context_parts.append(f"{source_ref}\n{doc_text}")

    context = "\n\n".join(context_parts) if context_parts else "No relevant documents found."
    prompt = f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    answer = await llm_client.generate(prompt)

    latency_ms = int((time.monotonic() - start) * 1000)
    return QueryResponse(answer=answer, sources=sources, latency_ms=latency_ms)
