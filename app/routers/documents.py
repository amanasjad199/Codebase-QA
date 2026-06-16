import logging

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import DeleteResponse, DocumentDetailResponse, DocumentListResponse
from app.services.ingestion import DocumentNotFoundError, delete_document, get_document, get_document_detail, list_documents

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
async def list_all_documents(limit: int = 20, offset: int = 0):
    total, docs = list_documents(limit=limit, offset=offset)
    return DocumentListResponse(total=total, documents=docs)


@router.get("/{doc_id}", response_model=DocumentDetailResponse)
async def get_document_by_id(doc_id: str):
    detail = get_document_detail(doc_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentDetailResponse(**detail)


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_document_by_id(doc_id: str):
    try:
        deleted_chunks = delete_document(doc_id)
        return DeleteResponse(doc_id=doc_id, deleted_chunks=deleted_chunks, status="deleted")
    except DocumentNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
