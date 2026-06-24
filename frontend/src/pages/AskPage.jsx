import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Layers, Compass, AlertCircle, FileSearch } from "lucide-react";
import { queryDocuments, listDocuments, qk, errorMessage } from "../api/client.js";
import { LibraryPanel } from "../components/LibraryPanel.jsx";
import { QueryConsole } from "../components/QueryConsole.jsx";
import { AnswerPanel } from "../components/AnswerPanel.jsx";
import { SourceCard } from "../components/SourceCard.jsx";

export default function AskPage() {
  const [result, setResult] = useState(null);
  const [asked, setAsked] = useState("");

  const { data: docData } = useQuery({
    queryKey: qk.documents,
    queryFn: () => listDocuments({ limit: 50 }),
    retry: false,
  });
  const hasDocs = (docData?.documents?.length || 0) > 0;

  const ask = useMutation({
    mutationFn: ({ question, topK }) => queryDocuments({ question, top_k: topK }),
    onSuccess: (data) => setResult(data),
  });

  const onAsk = (question, topK) => {
    setAsked(question);
    ask.mutate({ question, topK });
  };

  return (
    <div className="dash">
      {/* LEFT — library / stats */}
      <aside className="rail left">
        <LibraryPanel />
      </aside>

      {/* CENTER — console + answer */}
      <div className="col-center">
        <QueryConsole onAsk={onAsk} isPending={ask.isPending} hasDocs={hasDocs} />

        {ask.isError && (
          <div className="callout error">
            <AlertCircle size={17} />
            <span>{errorMessage(ask.error)}</span>
          </div>
        )}

        {ask.isPending && !result && (
          <section className="panel">
            <div className="empty">
              <span className="spinner lg" style={{ marginBottom: 14 }} />
              <h4>Searching your corpus…</h4>
              <p>Embedding the question and retrieving the most relevant passages.</p>
            </div>
          </section>
        )}

        {result && !ask.isPending && <AnswerPanel result={result} />}

        {!result && !ask.isPending && !ask.isError && (
          <section className="panel">
            <div className="empty">
              <span className="empty-ico">
                <FileSearch size={24} />
              </span>
              <h4>Ask a question to begin</h4>
              <p>
                {hasDocs
                  ? "Type a question above or pick an example. Answers cite the source passages they came from."
                  : "Upload a PDF, TXT, or Markdown document, then ask questions about it in plain English."}
              </p>
            </div>
          </section>
        )}
      </div>

      {/* RIGHT — retrieved sources */}
      <aside className="rail right">
        <section className="panel">
          <div className="panel-head">
            <span className="head-icon">
              <Layers size={16} />
            </span>
            <h3>Retrieved sources</h3>
            <span className="head-spacer" />
            {result?.sources?.length > 0 && (
              <span className="source-chunk">{result.sources.length}</span>
            )}
          </div>
          <div className="panel-body">
            {result?.sources?.length > 0 ? (
              result.sources.map((s, i) => <SourceCard key={`${s.doc_id}-${s.chunk_index}-${i}`} source={s} rank={i + 1} />)
            ) : (
              <div className="empty" style={{ padding: "26px 14px" }}>
                <span className="empty-ico">
                  <Compass size={22} />
                </span>
                <h4>No sources yet</h4>
                <p>Passages used to ground the answer appear here, ranked by similarity.</p>
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
