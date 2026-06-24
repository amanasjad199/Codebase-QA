import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Library, FileText, Trash2, FilePlus2 } from "lucide-react";
import { listDocuments, deleteDocument, qk, errorMessage } from "../api/client.js";
import { libraryStats, fileTypeLabel, formatDate } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

export function LibraryPanel() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const [pendingId, setPendingId] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: qk.documents,
    queryFn: () => listDocuments({ limit: 50 }),
    retry: false,
  });

  const del = useMutation({
    mutationFn: deleteDocument,
    onMutate: (id) => setPendingId(id),
    onSuccess: (res) => {
      notify(`Removed document · ${res.deleted_chunks} chunks cleared`);
      qc.invalidateQueries({ queryKey: qk.documents });
    },
    onError: (err) => notify(errorMessage(err), "error"),
    onSettled: () => setPendingId(null),
  });

  const docs = data?.documents || [];
  const stats = libraryStats(docs);

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <span className="head-icon">
            <Library size={16} />
          </span>
          <h3>Library</h3>
        </div>
        <div className="panel-body">
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-num">{stats.totalDocs}</div>
              <div className="stat-label">Documents</div>
            </div>
            <div className="stat">
              <div className="stat-num accent">{stats.totalChunks}</div>
              <div className="stat-label">Indexed chunks</div>
            </div>
          </div>
          {Object.keys(stats.byType).length > 0 && (
            <div className="type-bar">
              {Object.entries(stats.byType).map(([t, n]) => (
                <span key={t} className="type-chip">
                  {fileTypeLabel(t)} <b>{n}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="eyebrow">Sources</span>
          <span className="head-spacer" />
          <Link to="/upload" className="copy-btn" title="Add a document">
            <FilePlus2 size={12} /> Add
          </Link>
        </div>
        <div className="panel-body" style={{ paddingTop: 6, paddingBottom: 6 }}>
          {isLoading && (
            <div className="center-col" style={{ padding: 24 }}>
              <span className="spinner" />
            </div>
          )}
          {isError && <p className="muted" style={{ fontSize: 13, padding: 8 }}>Couldn't reach the backend.</p>}
          {!isLoading && !isError && docs.length === 0 && (
            <p className="muted" style={{ fontSize: 13, padding: "10px 8px" }}>
              No documents yet. <Link to="/upload" style={{ color: "var(--accent)" }}>Upload one</Link> to start asking
              questions.
            </p>
          )}
          <div className="doc-list">
            {docs.map((d) => (
              <div className="doc-row" key={d.doc_id}>
                <span className="doc-ico">
                  <FileText size={15} />
                </span>
                <span className="doc-meta">
                  <div className="doc-name" title={d.filename}>
                    {d.filename}
                  </div>
                  <div className="doc-sub">
                    {fileTypeLabel(d.file_type)} · {d.chunk_count} chunks · {formatDate(d.ingested_at)}
                  </div>
                </span>
                <button
                  className="doc-del"
                  aria-label={`Delete ${d.filename}`}
                  disabled={pendingId === d.doc_id}
                  onClick={() => {
                    if (window.confirm(`Delete "${d.filename}" and its embeddings?`)) del.mutate(d.doc_id);
                  }}
                >
                  {pendingId === d.doc_id ? <span className="spinner" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
