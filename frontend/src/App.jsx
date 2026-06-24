import { Routes, Route, Navigate } from "react-router-dom";
import { TopBar } from "./components/TopBar.jsx";
import AskPage from "./pages/AskPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import "./App.css";

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <main className="shell">
        <Routes>
          <Route path="/" element={<AskPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <div className="foot-note">CodebaseQA · semantic retrieval over your documents</div>
      </main>
    </div>
  );
}
