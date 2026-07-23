// Reusable UI atoms shared across pages.
import React from "react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export function Pill({ kind = "info", children }) {
  return (
    <span className={`pill ${kind}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

export function Spinner() {
  return <span className="spinner" aria-label="loading" />;
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// Map a post status to a pill kind + label.
export function StatusPill({ status }) {
  const map = {
    draft: ["warn", "Draft"],
    "awaiting approval": ["warn", "Awaiting approval"],
    approved: ["ok", "Approved"],
    scheduled: ["info", "Scheduled"],
    published: ["ok", "Published"],
    rejected: ["bad", "Rejected"],
    generated: ["info", "Generated"],
    sent: ["ok", "Published"],
  };
  const [kind, label] = map[(status || "").toLowerCase()] || ["info", status || "—"];
  return <Pill kind={kind}>{label}</Pill>;
}

export function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
