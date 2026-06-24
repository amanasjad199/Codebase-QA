import { Sparkles, Timer, AlertTriangle } from "lucide-react";
import { Markdown } from "./Markdown.jsx";
import { ConfidenceBadge } from "./ConfidenceMeter.jsx";
import { overallConfidence } from "../lib/format.js";

export function AnswerPanel({ result }) {
  const conf = overallConfidence(result.sources);
  const noSources = !result.sources || result.sources.length === 0;
  const lowConf = conf && conf.level === "low";

  return (
    <section className="panel answer">
      <div className="answer-head">
        <span className="head-icon" style={{ color: "var(--accent)" }}>
          <Sparkles size={16} />
        </span>
        <span className="eyebrow">Answer</span>
        <span className="spacer" />
        {conf && <ConfidenceBadge score={Math.max(...result.sources.map((s) => s.score))} />}
        <span className="meta-pill">
          <Timer size={12} />
          {result.latency_ms} ms
        </span>
      </div>

      <div className="answer-body">
        {(noSources || lowConf) && (
          <div className="callout warn" style={{ marginBottom: 16 }}>
            <AlertTriangle size={17} />
            <span>
              {noSources ? (
                <>
                  <b>No strongly matching passages were retrieved.</b> This answer may rely on the
                  model's general knowledge rather than your documents — treat it with caution.
                </>
              ) : (
                <>
                  <b>Low retrieval confidence.</b> The best matching passage scored under 50%. Verify
                  this answer against the cited sources.
                </>
              )}
            </span>
          </div>
        )}

        <Markdown>{result.answer || "_No answer was returned._"}</Markdown>
      </div>
    </section>
  );
}
