import axios from "axios";

/**
 * API base URL resolution:
 *  - Production / preview: set VITE_API_URL to your deployed FastAPI origin
 *    (e.g. https://codebaseqa-api.onrender.com).
 *  - Local dev: leave VITE_API_URL empty and we use "/api", which Vite proxies
 *    to the backend (see vite.config.js) so there is zero CORS friction.
 *
 * The backend already sends permissive CORS headers (allow_origins=["*"]),
 * so a direct cross-origin VITE_API_URL also works in production.
 */
const BASE = import.meta.env.VITE_API_URL?.trim() || "/api";

export const api = axios.create({
  baseURL: BASE,
  headers: { Accept: "application/json" },
  timeout: 120000,
});

/** Pull a human-readable message out of FastAPI's error shapes. */
export function errorMessage(err) {
  const d = err?.response?.data;
  if (!d) return err?.message || "Network error — is the backend running?";
  if (typeof d.detail === "string") return d.detail;
  if (d.detail && typeof d.detail === "object") {
    return d.detail.error || JSON.stringify(d.detail);
  }
  if (typeof d.error === "string") {
    return d.detail ? `${d.error}: ${d.detail}` : d.error;
  }
  return err.message || "Request failed";
}

/* ----------------------- endpoints (match backend exactly) ----------------------- */

// GET /health -> { status, vector_db, llm, embedding }
export async function getHealth() {
  const { data } = await api.get("/health");
  return data;
}

// POST /ingest  (multipart: field `file`, query `collection`) -> IngestResponse
// Accepts pdf | txt | md | markdown. onProgress receives 0..100 (upload bytes).
export async function ingestDocument({ file, collection = "documents", onProgress }) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/ingest", form, {
    params: { collection },
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data; // { doc_id, filename, chunk_count, status }
}

// POST /query  (json) -> { answer, sources:[{doc_id,filename,chunk_index,score}], latency_ms }
export async function queryDocuments({ question, top_k = 5, collection = "documents" }) {
  const { data } = await api.post("/query", { question, top_k, collection });
  return data;
}

// GET /documents?limit&offset -> { total, documents:[DocumentMeta] }
export async function listDocuments({ limit = 50, offset = 0 } = {}) {
  const { data } = await api.get("/documents", { params: { limit, offset } });
  return data;
}

// DELETE /documents/{doc_id} -> { doc_id, deleted_chunks, status }
export async function deleteDocument(docId) {
  const { data } = await api.delete(`/documents/${docId}`);
  return data;
}

/* query keys for TanStack Query */
export const qk = {
  health: ["health"],
  documents: ["documents"],
};
