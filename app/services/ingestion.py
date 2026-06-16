import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.clients.vectordb import get_vector_db
from app.config import settings
from app.models.schemas import DocumentMeta, IngestResponse
from app.parsers.pdf_parser import parse_pdf
from app.parsers.text_parser import parse_markdown, parse_text
from app.services import embedding as embedding_service
from app.utils.chunker import chunk_text
from app.utils.hashing import content_hash

logger = logging.getLogger(__name__)

def _metadata_db_path() -> Path:
    return Path(settings.chroma_persist_dir).parent / "metadata.db"


def _get_metadata_conn() -> sqlite3.Connection:
    db_path = _metadata_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            error_msg TEXT,
            ingested_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    return conn


def _detect_file_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in {".txt"}:
        return "txt"
    if ext in {".md", ".markdown"}:
        return "md"
    raise ValueError(f"Unsupported file type: {ext}")


def _parse_file(file_bytes: bytes, file_type: str) -> str:
    if file_type == "pdf":
        return parse_pdf(file_bytes)
    if file_type == "txt":
        return parse_text(file_bytes)
    if file_type == "md":
        return parse_markdown(file_bytes)
    raise ValueError(f"No parser for file type: {file_type}")


async def ingest_file(file_bytes: bytes, filename: str, collection: str = "documents") -> IngestResponse:
    file_hash = content_hash(file_bytes)
    file_type = _detect_file_type(filename)

    conn = _get_metadata_conn()
    cursor = conn.execute("SELECT id, status FROM documents WHERE id = ?", (file_hash,))
    existing = cursor.fetchone()
    if existing and existing[1] == "done":
        raise DuplicateDocumentError(file_hash)

    raw_text = _parse_file(file_bytes, file_type)
    chunks = chunk_text(raw_text, chunk_size=settings.chunk_size, overlap=settings.chunk_overlap)
    if not chunks:
        raise ValueError("No text could be extracted from the file")

    texts_to_embed = [c["text"] for c in chunks]
    embeddings, _ = await embedding_service.embed_texts(texts_to_embed)

    ids = [f"{file_hash}_chunk_{c['chunk_index']}" for c in chunks]
    metadatas = [
        {
            "doc_id": file_hash,
            "source_file": filename,
            "chunk_index": c["chunk_index"],
            "chunk_total": len(chunks),
            "file_type": file_type,
            "ingested_at": datetime.now(timezone.utc).isoformat(),
        }
        for c in chunks
    ]

    get_vector_db().upsert(ids=ids, embeddings=embeddings, documents=texts_to_embed, metadatas=metadatas, collection=collection)

    if existing:
        conn.execute(
            "UPDATE documents SET status = 'done', chunk_count = ?, updated_at = datetime('now') WHERE id = ?",
            (len(chunks), file_hash),
        )
    else:
        conn.execute(
            "INSERT INTO documents (id, filename, file_type, file_size, chunk_count, status) VALUES (?, ?, ?, ?, ?, 'done')",
            (file_hash, filename, file_type, len(file_bytes), len(chunks)),
        )
    conn.commit()
    conn.close()

    logger.info("Ingested %s: %s chunks", filename, len(chunks))
    return IngestResponse(doc_id=file_hash, filename=filename, chunk_count=len(chunks), status="done")


def list_documents(limit: int = 20, offset: int = 0) -> tuple[int, list[DocumentMeta]]:
    conn = _get_metadata_conn()
    total = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    rows = conn.execute(
        "SELECT id, filename, file_type, chunk_count, ingested_at, status FROM documents ORDER BY ingested_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    conn.close()
    docs = [
        DocumentMeta(doc_id=r[0], filename=r[1], file_type=r[2], chunk_count=r[3], ingested_at=r[4], status=r[5])
        for r in rows
    ]
    return total, docs


def get_document(doc_id: str) -> DocumentMeta | None:
    conn = _get_metadata_conn()
    row = conn.execute(
        "SELECT id, filename, file_type, chunk_count, ingested_at, status FROM documents WHERE id = ?",
        (doc_id,),
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return DocumentMeta(doc_id=row[0], filename=row[1], file_type=row[2], chunk_count=row[3], ingested_at=row[4], status=row[5])


def get_document_detail(doc_id: str) -> dict | None:
    conn = _get_metadata_conn()
    row = conn.execute(
        "SELECT id, filename, file_type, file_size, chunk_count, ingested_at, status FROM documents WHERE id = ?",
        (doc_id,),
    ).fetchone()
    conn.close()
    if row is None:
        return None
    return {
        "doc_id": row[0],
        "filename": row[1],
        "file_type": row[2],
        "file_size": row[3],
        "chunk_count": row[4],
        "ingested_at": row[5],
        "status": row[6],
    }


def delete_document(doc_id: str) -> int:
    conn = _get_metadata_conn()
    row = conn.execute("SELECT id FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if row is None:
        raise DocumentNotFoundError(doc_id)
    chunk_count = get_vector_db().count_chunks(doc_id)
    get_vector_db().delete(doc_id)
    conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    logger.info("Deleted document %s (%s chunks)", doc_id, chunk_count)
    return chunk_count


class DuplicateDocumentError(Exception):
    def __init__(self, doc_id: str) -> None:
        self.doc_id = doc_id
        super().__init__(f"Document already ingested: {doc_id}")


class DocumentNotFoundError(Exception):
    def __init__(self, doc_id: str) -> None:
        self.doc_id = doc_id
        super().__init__(f"Document not found: {doc_id}")
