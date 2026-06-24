import { useRef, useState } from "react";
import { Search, CornerDownLeft, Wand2 } from "lucide-react";

const EXAMPLES = [
  "Summarize the key points of this document",
  "What are the main requirements described here?",
  "How is authentication handled?",
  "What configuration or environment variables are needed?",
  "List any limitations or known issues",
];

export function QueryConsole({ onAsk, isPending, hasDocs }) {
  const [q, setQ] = useState("");
  const [topK, setTopK] = useState(5);
  const taRef = useRef(null);

  const submit = (text) => {
    const value = (text ?? q).trim();
    if (!value || isPending) return;
    if (text) setQ(text);
    onAsk(value, topK);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const grow = (e) => {
    setQ(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <section className="panel console">
      {isPending && <div className="scan" />}
      <div className="console-head">
        <span className="console-kicker">Ask your corpus</span>
        <h2 className="console-title">
          Ask a question, <span className="muted">get a grounded answer.</span>
        </h2>
      </div>

      <div className="ask-form">
        <div className="ask-box">
          <textarea
            ref={taRef}
            className="ask-input"
            rows={1}
            placeholder={
              hasDocs
                ? "e.g. Where is user input validated, and how?"
                : "Ask anything — tip: upload a document first for grounded answers"
            }
            value={q}
            onChange={grow}
            onKeyDown={onKey}
          />
          <button className="btn btn-primary btn-send" onClick={() => submit()} disabled={isPending || !q.trim()}>
            {isPending ? <span className="spinner" /> : <Search size={16} />}
            {isPending ? "Searching" : "Ask"}
          </button>
        </div>

        <div className="ask-tools">
          <label className="topk">
            <span>top_k</span>
            <input type="range" min={1} max={10} value={topK} onChange={(e) => setTopK(Number(e.target.value))} />
            <b>{topK}</b>
          </label>
          <span className="topk" style={{ gap: 6 }}>
            <CornerDownLeft size={12} /> Enter to ask · Shift+Enter for newline
          </span>
        </div>

        <div className="examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="example-chip" onClick={() => submit(ex)} disabled={isPending}>
              <Wand2 size={13} />
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
