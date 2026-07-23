// store.cjs
// A tiny local JSON store for the app's OWN data — the manual-draft review list
// and UI settings overrides. This is the only new data the app keeps; it never
// touches the automation's files. Stored in the OS user-data directory.

const path = require("path");
const fs = require("fs");
const { app } = require("electron");

const file = path.join(app.getPath("userData"), "westbury-manager-store.json");

const DEFAULTS = {
  drafts: [], // { id, date, category, caption, image, status, createdAt }
  settings: {
    defaultPostMode: "shareNow",
  },
};

function read() {
  try {
    if (fs.existsSync(file)) return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULTS };
}

function write(data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return data;
}

function getState() {
  return read();
}

function saveDraft(draft) {
  const data = read();
  const id = draft.id || String(Date.now());
  const existing = data.drafts.findIndex((d) => d.id === id);
  const record = { status: "draft", createdAt: new Date().toISOString(), ...draft, id };
  if (existing >= 0) data.drafts[existing] = { ...data.drafts[existing], ...record };
  else data.drafts.unshift(record);
  write(data);
  return record;
}

function setDraftStatus(id, status) {
  const data = read();
  const d = data.drafts.find((x) => x.id === id);
  if (d) d.status = status;
  write(data);
  return d;
}

function removeDraft(id) {
  const data = read();
  data.drafts = data.drafts.filter((d) => d.id !== id);
  write(data);
  return { ok: true };
}

function saveSettings(patch) {
  const data = read();
  data.settings = { ...data.settings, ...patch };
  write(data);
  return data.settings;
}

module.exports = { getState, saveDraft, setDraftStatus, removeDraft, saveSettings, file };
