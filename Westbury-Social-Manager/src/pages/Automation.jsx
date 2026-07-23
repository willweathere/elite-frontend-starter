import React, { useEffect, useState } from "react";
import { PageHeader, Card, Pill, Spinner, fmtDate } from "../components/ui.jsx";
import { api } from "../lib/api.js";

// Monitors and controls the EXISTING GitHub Actions workflow. Buttons here call
// the same dispatch the "Run workflow" button uses — they do not modify the
// workflow files.
export default function Automation({ config }) {
  const [wf, setWf] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [jobs, setJobs] = useState(null);
  const noToken = config && !config.hasGithubToken;

  async function refresh() {
    setLoading(true);
    const [w, r] = await Promise.all([api.getWorkflowState(), api.getRuns()]);
    setWf(w); setRuns(Array.isArray(r) ? r : []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function trigger(inputs, label) {
    setMsg(`Triggering ${label}…`);
    const res = await api.triggerWorkflow(inputs);
    if (res && res.ok) {
      setMsg(`${label} triggered. It will appear in the runs list shortly.`);
      setTimeout(refresh, 4000);
    } else {
      setMsg((res && res.error) || "Trigger failed.");
    }
  }

  async function viewJobs(run) {
    setJobs({ runId: run.id, loading: true, items: [] });
    const items = await api.getRunJobs(run.id);
    setJobs({ runId: run.id, loading: false, items: Array.isArray(items) ? items : [] });
  }

  return (
    <>
      <PageHeader
        title="Automation"
        subtitle="GitHub Actions — status, runs, and manual triggers."
        actions={
          <>
            <button className="btn" onClick={() => trigger({ dry_run: true, mode: "shareNow" }, "Test run")}>
              Run Test
            </button>
            <button className="btn primary" onClick={() => trigger({ mode: "shareNow", dry_run: false }, "Workflow")}>
              Trigger Workflow
            </button>
          </>
        }
      />

      {noToken && (
        <Card style={{ marginBottom: 16, borderColor: "rgba(222,178,110,0.4)" }}>
          <div className="sub">
            Add a GitHub token in <b>Settings</b> (and your <code>.env</code>) to enable status and triggers.
          </div>
        </Card>
      )}
      {msg && <Card style={{ marginBottom: 16 }}><div className="sub">{msg}</div></Card>}

      <div className="grid cols-3" style={{ marginBottom: 18 }}>
        <Card title="Workflow">
          <div className="big" style={{ fontSize: 20 }}>{wf ? (wf.state || "—") : <Spinner />}</div>
          <div className="sub">{config?.github?.workflowFile}</div>
        </Card>
        <Card title="Last run">
          <div className="big" style={{ fontSize: 18 }}>
            {runs[0] ? (runs[0].conclusion || runs[0].status) : "—"}
          </div>
          <div className="sub">{runs[0] ? fmtDate(runs[0].createdAt) : "No runs"}</div>
        </Card>
        <Card title="Next run">
          <div className="big" style={{ fontSize: 20 }}>09:00 UK</div>
          <div className="sub">Daily, automatic</div>
        </Card>
      </div>

      <Card title="Recent runs">
        {loading ? <Spinner /> : runs.length === 0 ? (
          <div className="empty">No runs found.</div>
        ) : (
          <div className="list">
            {runs.map((r) => (
              <div key={r.id}>
                <div className="list-item">
                  <div>
                    <div className="title">Run #{r.runNumber} · {r.event}</div>
                    <div className="when">{fmtDate(r.createdAt)}</div>
                  </div>
                  <div className="row">
                    <Pill kind={r.conclusion === "success" ? "ok" : r.conclusion ? "bad" : "warn"}>
                      {r.conclusion || r.status}
                    </Pill>
                    <button className="btn small" onClick={() => viewJobs(r)}>Logs</button>
                    <button className="btn small" onClick={() => api.openExternal(r.url)}>Open ↗</button>
                  </div>
                </div>
                {jobs && jobs.runId === r.id && (
                  <div className="log" style={{ marginTop: 6 }}>
                    {jobs.loading ? "Loading jobs…" :
                      jobs.items.map((j) => (
                        `${j.conclusion === "success" ? "✓" : j.conclusion || j.status} ${j.name}\n` +
                        j.steps.map((s) => `    ${s.conclusion === "success" ? "·" : "×"} ${s.name}`).join("\n")
                      )).join("\n\n") || "No job details."}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
