import { FileText } from "lucide-react";
import { ConfidenceMeter } from "./ConfidenceMeter.jsx";

export function SourceCard({ source, rank }) {
  return (
    <div className="source-card">
      <div className="source-top">
        <span className="rank">{rank}</span>
        <FileText size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
        <span className="source-file" title={source.filename}>
          {source.filename || "unknown"}
        </span>
        <span className="source-chunk">#{source.chunk_index}</span>
      </div>
      <div className="source-bottom">
        <ConfidenceMeter score={source.score} />
      </div>
    </div>
  );
}
