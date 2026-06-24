import { NavLink } from "react-router-dom";
import { MessagesSquare, UploadCloud } from "lucide-react";
import { HealthBadge } from "./HealthBadge.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";

function Logo() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="14" cy="14" r="7.5" fill="none" stroke="var(--accent)" strokeWidth="2.4" />
      <line x1="19.4" y1="19.4" x2="25" y2="25" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="10" y="13.2" width="2.2" height="3.6" rx="1" fill="var(--amber)" />
      <rect x="13.2" y="10.6" width="2.2" height="6.2" rx="1" fill="var(--accent)" />
      <rect x="16.4" y="12" width="2.2" height="4.8" rx="1" fill="var(--amber)" />
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-glyph">
            <Logo />
          </span>
          <span>
            <span className="brand-name">
              Codebase<b>QA</b>
            </span>
            <span className="brand-tag">semantic retrieval</span>
          </span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
            <MessagesSquare size={16} />
            <span>Ask</span>
          </NavLink>
          <NavLink to="/upload" className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
            <UploadCloud size={16} />
            <span>Upload</span>
          </NavLink>
        </nav>

        <span className="topbar-spacer" />
        <div className="topbar-tools">
          <HealthBadge />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
