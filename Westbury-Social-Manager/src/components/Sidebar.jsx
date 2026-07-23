import React from "react";
import logo from "../assets/logo.png";

export const PAGES = [
  { key: "dashboard", label: "Dashboard", ico: "◧" },
  { key: "posts", label: "Posts", ico: "▤" },
  { key: "generator", label: "Generator", ico: "✦" },
  { key: "approval", label: "Approval Queue", ico: "✓" },
  { key: "calendar", label: "Calendar", ico: "▦" },
  { key: "automation", label: "Automation", ico: "⚙" },
  { key: "analytics", label: "Analytics", ico: "▮" },
  { key: "settings", label: "Settings", ico: "⋯" },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logo} alt="Westbury Collections" />
        <div>
          <span>Westbury</span>
          <h1>Social Manager</h1>
        </div>
      </div>
      <nav className="nav">
        {PAGES.map((p) => (
          <button
            key={p.key}
            className={active === p.key ? "active" : ""}
            onClick={() => onNavigate(p.key)}
          >
            <span className="ico">{p.ico}</span>
            {p.label}
          </button>
        ))}
      </nav>
      <div className="foot">
        Controls the existing Westbury automation.<br />
        Nothing here replaces it.
      </div>
    </aside>
  );
}
