# Westbury Social Manager

A professional **Windows desktop control dashboard** for the existing Westbury Collections
automation system. It **monitors and controls** that system — it does **not** replace it.

- Built with **Electron + React**.
- Talks to the existing automation, GitHub Actions and Buffer.
- Never stores API keys — secrets live only in your local `.env` (main process) or GitHub Secrets.

> This app changes **nothing** in `Westbury-Automation/` or `.github/workflows/`. It reads their
> files and runs their scripts, exactly as the command line and the "Run workflow" button do.

---

## What it shows / does

| Screen | What it does | Connects to |
|---|---|---|
| **Dashboard** | Last post, next scheduled post, Buffer + automation status, recent runs | output files + GitHub API + Buffer |
| **Posts** | Generated post, caption, image, status | `output/` + local drafts |
| **Generator** | "Generate Post" runs the **existing** generator and previews the result | `scheduler.js generate` |
| **Approval Queue** | Optional manual review — approve publishes via the **existing** Buffer path | `scheduler.js publish` |
| **Calendar** | Upcoming posts at 9am UK with the real rotating topics | `content/post-ideas.json` |
| **Automation** | Workflow status, runs, logs; **Run Test** / **Trigger Workflow** buttons | GitHub Actions API |
| **Analytics** | Delivery health (run success rate, counts) | GitHub API + local store |
| **Settings** | View config, connected channels, posting mode | config + Buffer |

The automatic **9am UK daily post keeps running on its own** — this app just gives you a window
into it and manual controls.

---

## Setup

### 1. Install
```bash
cd Westbury-Social-Manager
npm install
```

> If Electron's binary download is blocked on your network, the first run downloads it. On a
> normal home/office connection this just works.

### 2. Configure (`.env`)
Copy the example and fill it in:
```bash
cp .env.example .env
```
- `GITHUB_TOKEN` — a **fine-grained Personal Access Token** for this repo with **Actions: Read
  and write** and **Contents: Read**. Create it at GitHub → Settings → Developer settings →
  Fine-grained tokens.
- `GITHUB_REPO` — e.g. `willweathere/elite-frontend-starter` (already filled in).
- `BUFFER_API_KEY` — the same Buffer key the automation uses (Buffer → Settings → API).

Your `.env` is git-ignored and never leaves your machine. The React UI never sees these values —
only the Electron main process reads them.

### 3. Run in development
```bash
npm run dev
```
This starts Vite and opens the Electron app pointing at it.

---

## Build a Windows `.exe`

On a **Windows** machine (packaging is OS-specific):

```bash
npm install
npm run dist
```

This produces, in the `release/` folder:
- `Westbury-Social-Manager-1.0.0.exe` — an installer (NSIS), and
- a portable `.exe` you can run without installing.

> Packaging must run on Windows (or a Windows CI runner). It cannot be produced from macOS/Linux
> without extra cross-build tooling.

---

## How it connects (architecture)

```
┌──────────── React UI (renderer) ────────────┐   contextIsolation ON
│ Dashboard · Posts · Generator · Approval ·   │   nodeIntegration OFF
│ Calendar · Automation · Analytics · Settings │   no secrets here
└───────────────▲──────────────────────────────┘
                │  window.westbury.*  (preload, whitelisted IPC)
┌───────────────┴──── Electron main (Node) ────┐   secrets read from .env here only
│ services: automation · github · buffer · store│
│   • spawns scheduler.js / list-channels.js     │  ← existing automation
│   • calls GitHub Actions REST API              │  ← existing workflow
└────────────────────────────────────────────────┘
```

- **automation.cjs** spawns the existing Node scripts (`scheduler.js generate|publish`,
  `list-channels.js`) using Electron's bundled Node — no separate Node install needed.
- **github.cjs** uses the GitHub Actions REST API to list runs, read jobs, and dispatch the
  workflow (the same action as the "Run workflow" button).
- **store.cjs** keeps the app's own draft/settings data in your OS user-data folder — the only
  new data; it never touches the automation.

See `ARCHITECTURE.md` for the full plan.

---

## Requirements to control the automation

- The `Westbury-Automation` folder present next to this app (or set `AUTOMATION_DIR` in `.env`),
  with its dependencies installed (`cd Westbury-Automation/automation && npm install`) — needed
  for local generation.
- A GitHub token — needed for the Automation/Dashboard status and triggers.
- A Buffer key — needed to show channel connection status.

The app degrades gracefully: screens that need a missing piece explain what to add.

---

## Security

- No API keys, passwords or tokens are ever stored by the app or shown in the UI.
- Secrets are read only by the Electron main process from `.env` (local) — the same values you
  keep in GitHub Secrets for production.
- `contextIsolation` is on and `nodeIntegration` is off; the UI can only call a fixed set of
  safe, whitelisted operations.
