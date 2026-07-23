import React, { useEffect, useState } from "react";
import { PageHeader, Card } from "../components/ui.jsx";
import { api } from "../lib/api.js";

// Analytics derived from what we can see locally: workflow run history and the
// app's own draft/post records. (Buffer's engagement analytics can be wired in
// later via its API — noted honestly rather than faked.)
export default function Analytics() {
  const [runs, setRuns] = useState([]);
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    api.getRuns().then((r) => setRuns(Array.isArray(r) ? r : []));
    api.getStore().then((s) => setDrafts(s.drafts || []));
  }, []);

  const success = runs.filter((r) => r.conclusion === "success").length;
  const failed = runs.filter((r) => r.conclusion && r.conclusion !== "success").length;
  const published = drafts.filter((d) => d.status === "published").length;
  const rate = runs.length ? Math.round((success / runs.length) * 100) : 0;

  const stats = [
    { label: "Workflow runs (recent)", value: runs.length },
    { label: "Successful runs", value: success },
    { label: "Failed runs", value: failed },
    { label: "Run success rate", value: `${rate}%` },
    { label: "Approved & published (app)", value: published },
    { label: "Drafts tracked", value: drafts.length },
  ];

  return (
    <>
      <PageHeader title="Analytics" subtitle="Delivery health of the automation." />
      <div className="grid cols-3">
        {stats.map((s) => (
          <Card key={s.label} title={s.label}>
            <div className="big">{s.value}</div>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 16 }} title="Engagement analytics">
        <div className="sub">
          Likes, reach and clicks live in your Buffer / platform analytics. This dashboard focuses on
          delivery — that posts are generated and published reliably. Buffer's analytics API can be
          connected here later if you want engagement numbers in one place.
        </div>
      </Card>
    </>
  );
}
