// config.cjs
// Central configuration + path resolution. Loads the local .env (main process
// only) and works out where the EXISTING automation system lives. It never
// writes to the automation folder — it only reads it and runs its scripts.

const path = require("path");
const fs = require("fs");
const { app } = require("electron");

// Load .env from the app's own folder (next to package.json).
const appRoot = path.resolve(__dirname, "..", "..");
require("dotenv").config({ path: path.join(appRoot, ".env") });

// The automation folder: env override, else the sibling folder in the repo.
// In this repo the app sits at <repo>/Westbury-Social-Manager and the automation
// at <repo>/Westbury-Automation/automation.
function resolveAutomationDir() {
  if (process.env.AUTOMATION_DIR && process.env.AUTOMATION_DIR.trim()) {
    return path.resolve(process.env.AUTOMATION_DIR.trim());
  }
  return path.resolve(appRoot, "..", "Westbury-Automation", "automation");
}

const automationDir = resolveAutomationDir();

const config = {
  appRoot,
  automationDir,
  outputDir: path.join(automationDir, "..", "output"),
  brandDir: path.join(automationDir, "..", "brand"),
  github: {
    token: process.env.GITHUB_TOKEN || "",
    repo: process.env.GITHUB_REPO || "willweathere/elite-frontend-starter",
    workflowFile: process.env.GITHUB_WORKFLOW_FILE || "westbury-daily-post.yml",
    branch: process.env.GITHUB_BRANCH || "main",
  },
  hasBufferKey: Boolean(process.env.BUFFER_API_KEY),
  hasGithubToken: Boolean(process.env.GITHUB_TOKEN),
  bufferApiKey: process.env.BUFFER_API_KEY || "",
};

// A safe subset that is OK to send to the UI — NO secrets, only booleans/paths.
function publicConfig() {
  return {
    automationDir: config.automationDir,
    automationFound: fs.existsSync(config.automationDir),
    outputDir: config.outputDir,
    brandDir: config.brandDir,
    github: {
      repo: config.github.repo,
      workflowFile: config.github.workflowFile,
      branch: config.github.branch,
    },
    hasBufferKey: config.hasBufferKey,
    hasGithubToken: config.hasGithubToken,
  };
}

module.exports = { config, publicConfig };
