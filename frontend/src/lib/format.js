/** Map a 0..1 retrieval score to a confidence bucket. */
export function confidence(score) {
  const pct = Math.round((Number(score) || 0) * 100);
  if (score >= 0.75) return { level: "high", label: "High", pct };
  if (score >= 0.5) return { level: "mid", label: "Medium", pct };
  return { level: "low", label: "Low", pct };
}

/** Overall answer confidence = best source score (what the user trusts most). */
export function overallConfidence(sources = []) {
  if (!sources.length) return null;
  const best = Math.max(...sources.map((s) => Number(s.score) || 0));
  return confidence(best);
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso.includes("Z") || iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fileTypeLabel(t) {
  return (t || "doc").toUpperCase();
}

/** Aggregate document list into headline stats for the library panel. */
export function libraryStats(documents = []) {
  const totalChunks = documents.reduce((n, d) => n + (d.chunk_count || 0), 0);
  const byType = {};
  for (const d of documents) {
    const t = (d.file_type || "doc").toLowerCase();
    byType[t] = (byType[t] || 0) + 1;
  }
  return { totalDocs: documents.length, totalChunks, byType };
}
