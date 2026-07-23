// preload.cjs
// The ONLY bridge between the React UI and the main process. Runs with context
// isolation, so the UI can call exactly these whitelisted methods and nothing
// else. No Node APIs, no secrets, are ever exposed to the renderer.

const { contextBridge, ipcRenderer } = require("electron");

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld("westbury", {
  // configuration (no secrets)
  getConfig: () => invoke("config:get"),

  // existing automation
  generate: () => invoke("automation:generate"),
  publish: (opts) => invoke("automation:publish", opts),
  getLastPost: () => invoke("automation:lastPost"),
  getChannels: () => invoke("automation:channels"),
  getIdeas: () => invoke("automation:ideas"),
  readBrand: (name) => invoke("brand:read", name),

  // github actions (monitor + control)
  getRuns: () => invoke("github:runs"),
  triggerWorkflow: (inputs) => invoke("github:dispatch", inputs),
  getRunJobs: (runId) => invoke("github:runJobs", runId),
  getWorkflowState: () => invoke("github:workflowState"),
  getNextRun: () => invoke("github:nextRun"),

  // local app data (drafts, settings)
  getStore: () => invoke("store:get"),
  saveDraft: (draft) => invoke("store:saveDraft", draft),
  setDraftStatus: (id, status) => invoke("store:setDraftStatus", { id, status }),
  removeDraft: (id) => invoke("store:removeDraft", id),
  saveSettings: (patch) => invoke("store:saveSettings", patch),

  // misc
  openExternal: (url) => invoke("shell:open", url),
});
