import React, { useState } from "react";
import { PageHeader, Card, Spinner } from "../components/ui.jsx";
import PostPreview from "../components/PostPreview.jsx";
import { api } from "../lib/api.js";

// Calls the EXISTING generator (scheduler.js generate) — it does not create a
// new generation system. The result can be saved to the Approval Queue.
export default function Generator() {
  const [busy, setBusy] = useState(false);
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState("");
  const [saved, setSaved] = useState(false);

  async function generate() {
    setBusy(true); setError(""); setPost(null); setSaved(false); setLog("");
    const res = await api.generate();
    setBusy(false);
    if (!res || res.ok === false) {
      setError((res && res.error) || "Generation failed.");
      if (res && res.log) setLog(res.log);
      return;
    }
    setPost(res.post);
    setLog(res.log || "");
  }

  async function sendToApproval() {
    if (!post) return;
    await api.saveDraft({
      date: post.date, category: post.category, caption: post.caption,
      altText: post.altText, image: post.image, id: `${post.date}-${post.id}`,
      status: "awaiting approval",
    });
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        title="Generator"
        subtitle="Runs the existing Westbury post generator. Nothing is posted here."
        actions={
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? <><Spinner /> &nbsp;Generating…</> : "Generate Post"}
          </button>
        }
      />

      {error && (
        <Card style={{ borderColor: "rgba(255,139,160,0.4)", marginBottom: 16 }}>
          <div style={{ color: "#ff8ba0", fontWeight: 600 }}>Could not generate</div>
          <div className="sub">{error}</div>
        </Card>
      )}

      <Card>
        {busy ? (
          <div className="empty"><Spinner /> &nbsp; Running the existing generator…</div>
        ) : (
          <PostPreview
            post={post}
            footer={
              post && (
                <div className="row" style={{ marginTop: 16 }}>
                  <button className="btn gold" onClick={sendToApproval} disabled={saved}>
                    {saved ? "Saved to Approval Queue ✓" : "Send to Approval Queue"}
                  </button>
                </div>
              )
            }
          />
        )}
      </Card>

      {log && (
        <Card title="Generator log" style={{ marginTop: 16 }}>
          <div className="log">{log}</div>
        </Card>
      )}
    </>
  );
}
