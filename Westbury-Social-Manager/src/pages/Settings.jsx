import React, { useEffect, useState } from "react";
import { PageHeader, Card, Pill } from "../components/ui.jsx";
import { api } from "../lib/api.js";

export default function Settings({ config }) {
  const [channels, setChannels] = useState(null);
  const [settings, setSettings] = useState({ defaultPostMode: "shareNow" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getChannels().then(setChannels);
    api.getStore().then((s) => setSettings(s.settings || { defaultPostMode: "shareNow" }));
  }, []);

  async function save(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await api.saveSettings(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="View configuration. Secrets stay in your local .env." />

      <div className="grid cols-2">
        <Card title="Posting schedule">
          <div className="big" style={{ fontSize: 20 }}>Daily · 09:00 UK</div>
          <div className="sub">
            Set by the GitHub Actions workflow (cron). To change the time, edit the schedule in
            <code> .github/workflows/westbury-daily-post.yml</code> — this app never edits your
            automation files.
          </div>
        </Card>

        <Card title="Posting mode (manual publish)">
          <label className="field">
            <span>Used when you Approve &amp; publish from the app</span>
            <select
              value={settings.defaultPostMode}
              onChange={(e) => save({ defaultPostMode: e.target.value })}
            >
              <option value="shareNow">Post immediately (shareNow)</option>
              <option value="addToQueue">Add to Buffer queue</option>
            </select>
          </label>
          {saved && <Pill kind="ok">Saved</Pill>}
        </Card>

        <Card title="Connected platforms">
          {!channels ? (
            <div className="sub">Checking…</div>
          ) : channels.ok && channels.channels && channels.channels.length ? (
            <div className="list">
              {channels.channels.map((c) => (
                <div className="list-item" key={c.id}>
                  <div className="title">{c.service} · {c.name}</div>
                  <Pill kind="ok">Connected</Pill>
                </div>
              ))}
            </div>
          ) : (
            <div className="sub">
              No Buffer channels found. Add <code>BUFFER_API_KEY</code> to your <code>.env</code> and
              connect a channel in Buffer.
            </div>
          )}
        </Card>

        <Card title="Configuration">
          <div className="list">
            <div className="list-item"><div className="title">Repository</div><span className="when">{config?.github?.repo}</span></div>
            <div className="list-item"><div className="title">Workflow</div><span className="when">{config?.github?.workflowFile}</span></div>
            <div className="list-item"><div className="title">GitHub token</div>{config?.hasGithubToken ? <Pill kind="ok">Set</Pill> : <Pill kind="bad">Missing</Pill>}</div>
            <div className="list-item"><div className="title">Buffer key</div>{config?.hasBufferKey ? <Pill kind="ok">Set</Pill> : <Pill kind="bad">Missing</Pill>}</div>
            <div className="list-item"><div className="title">Automation folder</div>{config?.automationFound ? <Pill kind="ok">Found</Pill> : <Pill kind="warn">Not found</Pill>}</div>
          </div>
        </Card>

        <Card title="Brand files">
          <div className="sub">Location the app reads brand rules from:</div>
          <div className="log" style={{ marginTop: 8 }}>{config?.brandDir || "—"}</div>
          <div className="sub" style={{ marginTop: 8 }}>
            Brand_Info · Post_Rules · Writing_Style · Design_Rules · Image_Rules · CTA_Rules · Logo.png
          </div>
        </Card>
      </div>
    </>
  );
}
