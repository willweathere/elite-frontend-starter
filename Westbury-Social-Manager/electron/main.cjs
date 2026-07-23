// main.cjs
// Electron main process: creates the window, loads the React UI, and registers
// the IPC handlers that connect the UI to the existing automation, GitHub and
// Buffer. All secret handling stays here — never in the renderer.

const path = require("path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

const APP_ICON = path.join(__dirname, "..", "build", "icon.png");
const { publicConfig } = require("./services/config.cjs");
const automation = require("./services/automation.cjs");
const github = require("./services/github.cjs");
const store = require("./services/store.cjs");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#2a0710",
    title: "Westbury Social Manager",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  win.on("closed", () => (win = null));
}

// Small helper so a thrown error becomes { ok:false, error } instead of crashing.
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      return await fn(payload);
    } catch (err) {
      return { ok: false, error: String(err && err.message ? err.message : err) };
    }
  });
}

function registerIpc() {
  handle("config:get", () => publicConfig());

  // existing automation
  handle("automation:generate", () => automation.generate());
  handle("automation:publish", (opts) => automation.publish(opts || {}));
  handle("automation:lastPost", () => automation.getLastPost());
  handle("automation:channels", () => automation.listChannels());
  handle("automation:ideas", () => automation.getIdeas());
  handle("brand:read", (name) => automation.readBrandFile(name));

  // github actions
  handle("github:runs", () => github.listRuns());
  handle("github:dispatch", (inputs) => github.dispatch(inputs || {}));
  handle("github:runJobs", (runId) => github.getRunJobs(runId));
  handle("github:workflowState", () => github.getWorkflowState());
  handle("github:nextRun", () => github.nextScheduledRun());

  // local store
  handle("store:get", () => store.getState());
  handle("store:saveDraft", (draft) => store.saveDraft(draft));
  handle("store:setDraftStatus", ({ id, status }) => store.setDraftStatus(id, status));
  handle("store:removeDraft", (id) => store.removeDraft(id));
  handle("store:saveSettings", (patch) => store.saveSettings(patch));

  // misc
  handle("shell:open", (url) => shell.openExternal(url));
}

app.whenReady().then(() => {
  // Windows taskbar identity — makes grouping and pinning use our app + icon.
  if (process.platform === "win32") {
    app.setAppUserModelId("com.westburycollections.socialmanager");
  }
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
