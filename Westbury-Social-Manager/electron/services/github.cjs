// github.cjs
// Talks to the GitHub Actions REST API to monitor and control the EXISTING
// workflow. Nothing here changes the workflow files — it only reads status and
// triggers runs the same way the "Run workflow" button does.

const { config } = require("./config.cjs");

const API = "https://api.github.com";

function headers() {
  return {
    Authorization: `Bearer ${config.github.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Westbury-Social-Manager",
  };
}

async function gh(pathname, options = {}) {
  if (!config.github.token) throw new Error("No GITHUB_TOKEN set in .env");
  const res = await fetch(`${API}${pathname}`, { ...options, headers: headers() });
  if (res.status === 204) return {}; // dispatch returns no content
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!res.ok) {
    const msg = body && body.message ? body.message : `HTTP ${res.status}`;
    throw new Error(`GitHub API: ${msg}`);
  }
  return body;
}

const repoPath = () => `/repos/${config.github.repo}`;

// Recent runs of the daily workflow (newest first).
async function listRuns(perPage = 10) {
  const wf = config.github.workflowFile;
  const data = await gh(`${repoPath()}/actions/workflows/${wf}/runs?per_page=${perPage}`);
  return (data.workflow_runs || []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    event: r.event,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    url: r.html_url,
    runNumber: r.run_number,
  }));
}

// Trigger the workflow (same as the Run workflow button). inputs are optional.
async function dispatch(inputs = {}) {
  const wf = config.github.workflowFile;
  await gh(`${repoPath()}/actions/workflows/${wf}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref: config.github.branch, inputs }),
  });
  return { ok: true };
}

// Logs URL for a run (opened in browser) + basic jobs summary.
async function getRunJobs(runId) {
  const data = await gh(`${repoPath()}/actions/runs/${runId}/jobs`);
  return (data.jobs || []).map((j) => ({
    name: j.name,
    status: j.status,
    conclusion: j.conclusion,
    startedAt: j.started_at,
    completedAt: j.completed_at,
    steps: (j.steps || []).map((s) => ({ name: s.name, conclusion: s.conclusion })),
  }));
}

// Whether the workflow is currently active (enabled) on GitHub.
async function getWorkflowState() {
  const wf = config.github.workflowFile;
  const data = await gh(`${repoPath()}/actions/workflows/${wf}`);
  return { state: data.state, name: data.name, htmlUrl: data.html_url };
}

// Compute the next scheduled 9am UK run (the workflow's own gate enforces 9am
// London year-round; here we just show the user the next 09:00 Europe/London).
function nextScheduledRun() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit", hour12: false,
  });
  const londonHour = Number(fmt.format(now));
  const next = new Date(now);
  // Move to today 09:00 London; if that has passed, tomorrow.
  const daysToAdd = londonHour >= 9 ? 1 : 0;
  next.setUTCDate(next.getUTCDate() + daysToAdd);
  // Approximate: 9am London. Good enough for display.
  return { label: "09:00 UK", isoDateOnly: next.toISOString().slice(0, 10) };
}

module.exports = { listRuns, dispatch, getRunJobs, getWorkflowState, nextScheduledRun };
