import { useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { ingestDocument, qk, errorMessage } from "../api/client.js";
import { formatBytes } from "../lib/format.js";
import { useToast } from "../context/ToastContext.jsx";

const ACCEPT = [".pdf", ".txt", ".md", ".markdown"];

export function UploadDropzone({ onDone }) {
  const qc = useQueryClient();
  const { notify } = useToast();
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState("idle"); // idle | uploading | processing | done
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: (f) =>
      ingestDocument({
        file: f,
        onProgress: (p) => {
          setPct(p);
          if (p >= 100) setStage("processing");
        },
      }),
    onSuccess: (res) => {
      setResult(res);
      setStage("done");
      notify(`Indexed "${res.filename}" · ${res.chunk_count} chunks`);
      qc.invalidateQueries({ queryKey: qk.documents });
      onDone?.(res);
    },
    onError: (err) => {
      setError(errorMessage(err));
      setStage("idle");
      notify(errorMessage(err), "error");
    },
  });

  const start = useCallback(
    (f) => {
      if (!f) return;
      const ext = "." + f.name.split(".").pop().toLowerCase();
      if (!ACCEPT.includes(ext)) {
        setError(`Unsupported file type: ${ext}. Accepted: ${ACCEPT.join(", ")}`);
        notify(`Unsupported file type: ${ext}`, "error");
        return;
      }
      setError(null);
      setResult(null);
      setFile(f);
      setPct(0);
      setStage("uploading");
      mutation.mutate(f);
    },
    [mutation, notify]
  );

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setPct(0);
    setStage("idle");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files?.[0]) start(e.dataTransfer.files[0]);
  };

  // active upload / result view
  if (stage !== "idle") {
    return (
      <section className="panel">
        <div className="upload-file">
          <span className="doc-ico">
            {stage === "done" ? <CheckCircle2 size={20} /> : <FileText size={20} />}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="doc-name">{file?.name}</div>
            <div className="doc-sub">{formatBytes(file?.size)}</div>
            {stage !== "done" && (
              <>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${stage === "processing" ? "indeterminate" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="upload-stage">
                  {stage === "uploading" ? (
                    <>Uploading · {pct}%</>
                  ) : (
                    <>
                      <span className="spinner" /> Chunking &amp; embedding…
                    </>
                  )}
                </div>
              </>
            )}
            {stage === "done" && result && (
              <div className="upload-stage" style={{ color: "var(--accent)" }}>
                <CheckCircle2 size={13} /> Indexed {result.chunk_count} chunks · ready to query
              </div>
            )}
          </div>
          {stage === "done" && (
            <button className="btn btn-ghost" onClick={reset}>
              <RotateCcw size={15} /> Upload another
            </button>
          )}
        </div>
      </section>
    );
  }

  // idle dropzone
  return (
    <>
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        <span className="dropzone-ico">
          <UploadCloud size={26} />
        </span>
        <h3>Drop a document, or click to browse</h3>
        <p>It will be chunked, embedded, and indexed for semantic search.</p>
        <div className="accept">Accepted: PDF · TXT · MD · MARKDOWN</div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          hidden
          onChange={(e) => start(e.target.files?.[0])}
        />
      </div>
      {error && (
        <div className="callout error" style={{ marginTop: 14 }}>
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
