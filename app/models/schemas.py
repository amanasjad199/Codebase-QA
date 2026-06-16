from pydantic import BaseModel, Field


class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    status: str


class QueryRequest(BaseModel):
    question: str
    top_k: int = 5
    collection: str = "documents"


class SourceChunk(BaseModel):
    doc_id: str
    filename: str
    chunk_index: int
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    latency_ms: int


class DocumentMeta(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    chunk_count: int
    ingested_at: str
    status: str


class DocumentListResponse(BaseModel):
    total: int
    documents: list[DocumentMeta]


class DocumentDetailResponse(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    ingested_at: str
    status: str


class DeleteResponse(BaseModel):
    doc_id: str
    deleted_chunks: int
    status: str


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None


class HealthResponse(BaseModel):
    status: str
    vector_db: str
    llm: str
    embedding: str
