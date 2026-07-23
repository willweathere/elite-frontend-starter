// api.js
// Thin wrapper around the preload bridge (window.westbury). If the app is opened
// in a plain browser (e.g. Vite dev without Electron), it returns safe mock data
// so the UI still renders instead of crashing.

const bridge = typeof window !== "undefined" ? window.westbury : undefined;

const mock = {
  getConfig: async () => ({
    automationFound: false,
    github: { repo: "willweathere/elite-frontend-starter", workflowFile: "westbury-daily-post.yml", branch: "main" },
    hasBufferKey: false,
    hasGithubToken: false,
  }),
  getLastPost: async () => null,
  generate: async () => ({ ok: false, error: "Run inside the desktop app to generate." }),
  publish: async () => ({ ok: false, log: "Desktop app only." }),
  getChannels: async () => ({ ok: false, error: "Desktop app only." }),
  getIdeas: async () => [],
  readBrand: async () => "",
  getRuns: async () => [],
  triggerWorkflow: async () => ({ ok: false, error: "Desktop app only." }),
  getRunJobs: async () => [],
  getWorkflowState: async () => ({ state: "unknown" }),
  getNextRun: async () => ({ label: "09:00 UK", isoDateOnly: "" }),
  getStore: async () => ({ drafts: [], settings: { defaultPostMode: "shareNow" } }),
  saveDraft: async (d) => d,
  setDraftStatus: async () => ({}),
  removeDraft: async () => ({ ok: true }),
  saveSettings: async (p) => p,
  openExternal: async () => {},
};

export const api = bridge || mock;
export const isDesktop = Boolean(bridge);
