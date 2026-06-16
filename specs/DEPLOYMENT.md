# DEPLOYMENT.md – Deployment Instructions

---

## 1. Local Development

### Prerequisites
- Python 3.11+
- pip
- (Optional) Docker & Docker Compose

### Steps

```bash
# 1. Clone repo and enter project
git clone <your-repo>
cd rag-project

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env and fill in your OPENAI_API_KEY and other values

# 5. Run the server
uvicorn app.main:app --reload --port 8000

# 6. Verify
curl http://localhost:8000/health
```

---

## 2. Environment Variables

Create a `.env` file (never commit this):

```env
# === Required ===
OPENAI_API_KEY=sk-...

# === Embedding ===
EMBEDDING_MODEL=openai           # openai | local
# If local:
# LOCAL_EMBEDDING_MODEL=all-MiniLM-L6-v2

# === LLM ===
LLM_PROVIDER=openai              # openai | ollama
LLM_MODEL=gpt-4o
# If ollama:
# OLLAMA_BASE_URL=http://localhost:11434

# === Vector DB ===
VECTOR_DB_PROVIDER=chroma        # chroma | qdrant
CHROMA_PERSIST_DIR=./data/chroma_db
# If qdrant:
# QDRANT_URL=http://localhost:6333
# QDRANT_COLLECTION=documents

# === Chunking ===
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# === RAG ===
TOP_K=5

# === App ===
LOG_LEVEL=INFO                   # DEBUG | INFO | WARNING | ERROR
```

---

## 3. Docker (Single Container)

### `Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run

```bash
docker build -t rag-app .

docker run -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  rag-app
```

The `-v $(pwd)/data:/app/data` mounts the ChromaDB directory so it persists across container restarts.

---

## 4. Docker Compose (App + Qdrant)

### `docker-compose.yml`

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      - VECTOR_DB_PROVIDER=qdrant
      - QDRANT_URL=http://qdrant:6333
    volumes:
      - ./data:/app/data
    depends_on:
      - qdrant

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  qdrant_data:
```

```bash
# Start everything
docker compose up --build

# Stop
docker compose down

# Stop and wipe volumes
docker compose down -v
```

---

## 5. Using Ollama (Local LLM)

```bash
# Install Ollama: https://ollama.ai
ollama pull llama3.2

# In .env:
# LLM_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434
# LLM_MODEL=llama3.2
```

When using Docker Compose with Ollama running on host:
```yaml
environment:
  - OLLAMA_BASE_URL=http://host.docker.internal:11434
```

---

## 6. Production Considerations

| Area | Recommendation |
|------|---------------|
| Secrets | Use environment injection (Railway, Render, AWS Secrets Manager) — never bake into image |
| Vector DB | Switch to Qdrant (Docker) or Pinecone for production scale |
| LLM | OpenAI GPT-4o for best quality; consider rate limits |
| Persistence | Mount a volume or use managed storage for ChromaDB/Qdrant data |
| Reverse proxy | Put Nginx or Caddy in front for SSL termination |
| Process manager | Use `gunicorn -k uvicorn.workers.UvicornWorker` for multi-worker production |

### Production start command
```bash
gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --workers 2 \
  --bind 0.0.0.0:8000
```

---

## 7. Quick Deployment Platforms

### Railway / Render
1. Push repo to GitHub
2. Connect repo in Railway/Render
3. Set env vars in dashboard
4. Deploy — done

### Fly.io
```bash
fly launch
fly secrets set OPENAI_API_KEY=sk-...
fly deploy
```
