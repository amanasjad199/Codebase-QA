import logging
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RAG API"

    openai_api_key: str = ""
    embedding_model: str = "openai"
    local_embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimensions: int = 1536

    llm_provider: str = "openai"
    llm_model: str = "gpt-4o"
    ollama_base_url: str = "http://localhost:11434"

    vector_db_provider: str = "chroma"
    chroma_persist_dir: Path = Path("./data/chroma_db")
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "documents"

    chunk_size: int = 1000
    chunk_overlap: int = 200

    top_k: int = 5

    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
