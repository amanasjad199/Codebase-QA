# CodebaseQA backend — FastAPI + ChromaDB
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    CHROMA_PERSIST_DIR=/app/data/chroma_db

WORKDIR /app

# Install dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source only (frontend, tests, and data are excluded via .dockerignore).
COPY app ./app

# Persisted vector store / metadata live here (mount a volume in prod).
RUN mkdir -p /app/data

EXPOSE 8000

# Render/Railway inject $PORT; fall back to 8000 for local `docker run`.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
