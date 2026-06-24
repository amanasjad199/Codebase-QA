import { confidence } from "../lib/format.js";

/**
 * The signal meter is the product's signature element: it turns the real
 * retrieval score into a 5-bar "signal strength" read, the way an instrument
 * would. High confidence lights up in brand jade on purpose.
 */
export function ConfidenceMeter({ score }) {
  const { level, pct } = confidence(score);
  const lit = Math.max(1, Math.round((pct / 100) * 5));
  const color =
    level === "high" ? "var(--c-high)" : level === "mid" ? "var(--c-mid)" : "var(--c-low)";

  return (
    <div className="meter" title={`Similarity score: ${pct}%`}>
      <div className="meter-bars" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="meter-bar"
            style={{
              height: `${6 + i * 3}px`,
              background: i < lit ? color : undefined,
            }}
          />
        ))}
      </div>
      <span className="meter-pct" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

export function ConfidenceBadge({ score, label }) {
  const c = confidence(score);
  return (
    <span className={`badge ${c.level}`}>
      <span className="dot" />
      {label || `${c.label} confidence`}
    </span>
  );
}
