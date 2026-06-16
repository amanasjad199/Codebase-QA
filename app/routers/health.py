import logging

from fastapi import APIRouter

from app.clients.vectordb import get_vector_db
from app.config import settings
from app.models.schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    vdb_status = get_vector_db().health()
    llm_status = "ok" if settings.openai_api_key or settings.llm_provider == "ollama" else "unconfigured"
    emb_status = "ok" if settings.openai_api_key or settings.embedding_model == "local" else "unconfigured"
    overall = "ok" if vdb_status == "ok" else "degraded"
    return HealthResponse(status=overall, vector_db=vdb_status, llm=llm_status, embedding=emb_status)
