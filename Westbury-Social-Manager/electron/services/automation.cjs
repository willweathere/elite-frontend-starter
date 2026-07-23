// automation.cjs
// Wraps the EXISTING automation scripts. It spawns them as child processes and
// reads their output files. It does not reimplement generation, brand rules or
// Buffer — it calls scheduler.js / list-channels.js exactly as the CLI does.

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { config } = require("./config.cjs");

// Run a Node script from the automation folder using Electron's bundled Node
// (ELECTRON_RUN_AS_NODE), so the user does not need a separate Node install.
function runNode(args, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: config.automationDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        ...extraEnv,
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => resolve({ ok: false, stdout, stderr: String(err) }));
    child.on("close", (code) => resolve({ ok: code === 0, code, stdout, stderr }));
  });
}

function imageAsDataUrl(file) {
  if (!fs.existsSync(file)) return null;
  const b64 = fs.readFileSync(file).toString("base64");
  return `data:image/png;base64,${b64}`;
}

// Read the most recently generated post (produced by scheduler.js generate).
function getLastPost() {
  const jsonPath = path.join(config.outputDir, "post.json");
  if (!fs.existsSync(jsonPath)) return null;
  let record = {};
  try {
    record = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch {
    return null;
  }
  return {
    ...record,
    image: imageAsDataUrl(path.join(config.outputDir, "image.png")),
  };
}

// Generate a fresh post by calling the EXISTING generator (no publish).
async function generate() {
  if (!fs.existsSync(config.automationDir)) {
    return { ok: false, error: `Automation folder not found at ${config.automationDir}` };
  }
  const res = await runNode(["scheduler.js", "generate"]);
  if (!res.ok) return { ok: false, error: res.stderr || res.stdout || "generate failed" };
  return { ok: true, log: res.stdout, post: getLastPost() };
}

// Publish the already-generated post through the EXISTING publish path.
// mode: "shareNow" | "addToQueue". dryRun avoids sending anything.
async function publish({ mode = "shareNow", dryRun = false } = {}) {
  const res = await runNode(["scheduler.js", "publish"], {
    BUFFER_API_KEY: config.bufferApiKey,
    BUFFER_POST_MODE: mode,
    DRY_RUN: dryRun ? "true" : "",
  });
  return { ok: res.ok, log: (res.stdout + "\n" + res.stderr).trim() };
}

// List Buffer channels via the EXISTING helper (proves the connection).
async function listChannels() {
  if (!config.bufferApiKey) return { ok: false, error: "No Buffer API key set in .env" };
  const res = await runNode(["list-channels.js"], { BUFFER_API_KEY: config.bufferApiKey });
  if (!res.ok) return { ok: false, error: (res.stderr || res.stdout).trim() };
  // Parse "  <service>  <name>" + "    id: <id>" lines from the helper output.
  const channels = [];
  const lines = res.stdout.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const idm = lines[i].match(/id:\s*([a-f0-9]+)/i);
    if (idm) {
      const header = (lines[i - 1] || "").trim().split(/\s{2,}/);
      channels.push({
        service: header[0] || "channel",
        name: header[1] || "",
        id: idm[1],
      });
    }
  }
  return { ok: true, channels, log: res.stdout };
}

// Read the rotating idea bank so the Calendar can show upcoming topics.
function getIdeas() {
  const p = path.join(config.automationDir, "content", "post-ideas.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")).ideas || [];
  } catch {
    return [];
  }
}

// Read a brand file (for Settings / About). Read-only.
function readBrandFile(name) {
  const p = path.join(config.brandDir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

module.exports = { generate, publish, listChannels, getLastPost, getIdeas, readBrandFile };
