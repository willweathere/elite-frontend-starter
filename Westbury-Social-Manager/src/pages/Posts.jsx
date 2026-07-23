import React, { useEffect, useState } from "react";
import { PageHeader, Card, StatusPill } from "../components/ui.jsx";
import PostPreview from "../components/PostPreview.jsx";
import { api } from "../lib/api.js";

// Shows the most recent generated post plus any drafts the app is tracking.
export default function Posts() {
  const [last, setLast] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.getLastPost().then(setLast);
    api.getStore().then((s) => setDrafts(s.drafts || []));
  }, []);

  const all = [
    ...(last ? [{ ...last, status: last.status || "generated", _source: "latest" }] : []),
    ...drafts,
  ];
  const shown = filter === "all" ? all : all.filter((p) => (p.status || "").toLowerCase() === filter);
  const view = selected || shown[0];

  const filters = ["all", "draft", "awaiting approval", "scheduled", "published"];

  return (
    <>
      <PageHeader title="Posts" subtitle="Generated posts, captions, images and status." />

      <div className="row" style={{ marginBottom: 16 }}>
        {filters.map((f) => (
          <button
            key={f}
            className={`btn small ${filter === f ? "gold" : ""}`}
            onClick={() => { setFilter(f); setSelected(null); }}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid cols-2">
        <Card title={`Posts (${shown.length})`}>
          {shown.length === 0 ? (
            <div className="empty">No posts in this view.</div>
          ) : (
            <div className="list">
              {shown.map((p, i) => (
                <div
                  className="list-item"
                  key={p.id || i}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(p)}
                >
                  <div className="row">
                    {p.image && <img src={p.image} alt="" style={{ width: 48, borderRadius: 6 }} />}
                    <div>
                      <div className="title">{p.category || "Post"}</div>
                      <div className="when">{p.date || ""}</div>
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Preview">
          <PostPreview post={view} />
        </Card>
      </div>
    </>
  );
}
