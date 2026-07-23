import React, { useEffect, useState } from "react";
import { PageHeader, Card, Pill, Spinner, fmtDate } from "../components/ui.jsx";
import { api } from "../lib/api.js";

export default function Dashboard({ config, onNavigate }) {
  const [lastPost, setLastPost] = useState(null);
  const [next, setNext] = useState(null);
  const [buffer, setBuffer] = useState(null);
  const [wf, setWf] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    (async () => {
      const [lp, nx, ch, w, r] = await Promise.all([
        api.getLastPost(),
        api.getNextRun(),
        api.getChannels(),
        api.getWorkflowState(),
        api.getRuns(),
      ]);
      if (done) return;
      setLastPost(lp);
      setNext(nx);
      setBuffer(ch);
      setWf(w);
      setRuns(Array.isArray(r) ? r : []);
      setLoading(false);
    })();
    return () => { done = true; };
  }, []);

  const bufferOk = buffer && buffer.ok && buffer.channels && buffer.channels.length > 0;
  const autoOk = wf && wf.state === "active";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live view of the Westbury automation system."
      />

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <Card title="Automation">
          <div className="big">{loading ? <Spinner /> : autoOk ? "Active" : "Check"}</div>
          <div className="sub">
            {autoOk ? <Pill kind="ok">Workflow enabled</Pill> : <Pill kind="warn">Not confirmed</Pill>}
          </div>
        </Card>
        <Card title="Buffer">
          <div className="big">{loading ? <Spinner /> : bufferOk ? "Connected" : "—"}</div>
          <div className="sub">
            {bufferOk
              ? <Pill kind="ok">{buffer.channels.length} channel(s)</Pill>
              : <Pill kind="warn">Not connected</Pill>}
          </div>
        </Card>
        <Card title="Next post">
          <div className="big">{next ? next.label : "09:00 UK"}</div>
          <div className="sub">{next && next.isoDateOnly ? next.isoDateOnly : "Daily, automatic"}</div>
        </Card>
        <Card title="Repository">
          <div className="big" style={{ fontSize: 18 }}>{config?.github?.repo?.split("/")[1] || "—"}</div>
          <div className="sub">{config?.github?.workflowFile}</div>
        </Card>
      </div>

      <div className="grid cols-2">
        <Card title="Last generated post">
          {lastPost ? (
            <div className="post-preview" style={{ gridTemplateColumns: "160px 1fr" }}>
              {lastPost.image && <img src={lastPost.image} alt="last post" />}
              <div>
                <div className="caption" style={{ fontSize: 13, maxHeight: 150, overflow: "hidden" }}>
                  {lastPost.caption}
                </div>
                <div className="meta-line">{lastPost.category} · {lastPost.date}</div>
                <button className="btn small" style={{ marginTop: 10 }} onClick={() => onNavigate("posts")}>
                  View posts
                </button>
              </div>
            </div>
          ) : (
            <div className="empty">No generated post found yet. Use the Generator.</div>
          )}
        </Card>

        <Card title="Recent activity">
          {loading ? <Spinner /> : runs.length === 0 ? (
            <div className="empty">No workflow runs found (add a GitHub token in Settings).</div>
          ) : (
            <div className="list">
              {runs.slice(0, 6).map((r) => (
                <div className="list-item" key={r.id}>
                  <div>
                    <div className="title">Run #{r.runNumber} · {r.event}</div>
                    <div className="when">{fmtDate(r.createdAt)}</div>
                  </div>
                  <Pill kind={r.conclusion === "success" ? "ok" : r.conclusion ? "bad" : "warn"}>
                    {r.conclusion || r.status}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
