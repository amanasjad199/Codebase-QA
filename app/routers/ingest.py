import logging

from fastapi import APIRouter, HTTPException, UploadFile, status

from app.models.schemas import IngestResponse
from app.services.ingestion import DuplicateDocumentError, ingest_file

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ingestion"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(file: UploadFile, collection: str = "documents"):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in {"pdf", "txt", "md", "markdown"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type: .{ext}",
        )
    try:
        file_bytes = await file.read()
        result = await ingest_file(file_bytes, file.filename, collection)
        return result
    except DuplicateDocumentError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "Document already ingested", "doc_id": exc.doc_id},
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
