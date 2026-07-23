import React, { useEffect, useState } from "react";
import { PageHeader, Card, StatusPill, Spinner } from "../components/ui.jsx";
import { api } from "../lib/api.js";

// Optional review layer. Drafts you generate can be approved (published now
// through the EXISTING publish path) or rejected. This never disables or
// bypasses the automatic 9am workflow — it is a manual, on-demand extra.
export default function Approval() {
  const [drafts, setDrafts] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const s = await api.getStore();
    setDrafts(s.drafts || []);
  }
  useEffect(() => { refresh(); }, []);

  async function approve(d) {
    setBusyId(d.id); setMsg("");
    // Publish through the existing automation (buffer.js via scheduler publish).
    const res = await api.publish({ mode: "shareNow" });
    setBusyId(null);
    if (res && res.ok) {
      await api.setDraftStatus(d.id, "published");
      setMsg("Approved and published through the existing Buffer workflow.");
    } else {
      setMsg((res && res.log) || "Publish failed. Check the Automation page logs.");
    }
    refresh();
  }

  async function reject(d) {
    await api.setDraftStatus(d.id, "rejected");
    refresh();
  }
  async function remove(d) {
    await api.removeDraft(d.id);
    refresh();
  }

  const pending = drafts.filter((d) => d.status === "awaiting approval");
  const done = drafts.filter((d) => d.status !== "awaiting approval");

  return (
    <>
      <PageHeader
        title="Approval Queue"
        subtitle="Review drafts before they post. The daily automatic post is unaffected."
      />

      {msg && <Card style={{ marginBottom: 16 }}><div className="sub">{msg}</div></Card>}

      <Card title={`Awaiting approval (${pending.length})`}>
        {pending.length === 0 ? (
          <div className="empty">Nothing waiting. Generate a post and send it here to review.</div>
        ) : (
          <div className="list">
            {pending.map((d) => (
              <div className="list-item" key={d.id} style={{ alignItems: "flex-start" }}>
                <div className="row" style={{ alignItems: "flex-start" }}>
                  {d.image && <img src={d.image} alt="" style={{ width: 84, borderRadius: 8 }} />}
                  <div style={{ maxWidth: 460 }}>
                    <div className="title">{d.category}</div>
                    <div className="when" style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                      {(d.caption || "").slice(0, 180)}…
                    </div>
                  </div>
                </div>
                <div className="row">
                  <button className="btn primary small" onClick={() => approve(d)} disabled={busyId === d.id}>
                    {busyId === d.id ? <Spinner /> : "Approve & publish"}
                  </button>
                  <button className="btn small" onClick={() => reject(d)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="History" style={{ marginTop: 16 }}>
        {done.length === 0 ? (
          <div className="empty">No reviewed drafts yet.</div>
        ) : (
          <div className="list">
            {done.map((d) => (
              <div className="list-item" key={d.id}>
                <div>
                  <div className="title">{d.category}</div>
                  <div className="when">{d.date}</div>
                </div>
                <div className="row">
                  <StatusPill status={d.status} />
                  <button className="btn small" onClick={() => remove(d)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
