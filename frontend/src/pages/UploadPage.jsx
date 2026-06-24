import { useNavigate } from "react-router-dom";
import { Info, ArrowRight } from "lucide-react";
import { UploadDropzone } from "../components/UploadDropzone.jsx";

export default function UploadPage() {
  const navigate = useNavigate();

  return (
    <div className="upload-wrap">
      <div className="page-head">
        <span className="eyebrow">Ingest</span>
        <h1>Add a document to the index</h1>
        <p>
          Drop a file and CodebaseQA chunks it, generates embeddings, and stores them in the vector
          store. Once indexed, ask questions about it on the Ask page.
        </p>
      </div>

      <UploadDropzone onDone={() => setTimeout(() => navigate("/"), 1100)} />

      <div className="callout info">
        <Info size={17} />
        <span>
          This build indexes <b>document files (PDF, TXT, Markdown)</b>. Direct GitHub-URL and code-ZIP
          ingestion aren't exposed by the current backend — to demo on a codebase, export it to a
          single <b>.md</b> or <b>.txt</b> bundle and upload that.
        </span>
      </div>

      <button className="btn btn-ghost" style={{ alignSelf: "center" }} onClick={() => navigate("/")}>
        Go to Ask <ArrowRight size={15} />
      </button>
    </div>
  );
}
