# Architecture — Westbury Social Manager

## Principle
The app is a **control panel**, not a new engine. It **reads** the existing system's files and
**calls** its scripts/workflows. It never re-implements generation, brand rules, Buffer, or
scheduling. **Zero changes** to `Westbury-Automation/` or `.github/workflows/`.

## Existing system (the source of truth — untouched)
- `Westbury-Automation/automation/` — Node scripts: `scheduler.js` (generate/publish),
  `buffer.js` (Buffer GraphQL), `list-channels.js`, `post-generator.js`, `validator.js`,
  `providers/` (image rendering).
- `Westbury-Automation/brand/` — brand rules + `Logo.png`.
- `Westbury-Automation/output/` — `post.json`, `caption.txt`, `image.png`, `archive/`.
- `.github/workflows/westbury-daily-post.yml` — posts daily at 9am UK (automatic).
- Buffer — the publishing platform, via `BUFFER_API_KEY`.

## App → existing system map
| App feature | Existing component | Mechanism |
|---|---|---|
| Generate Post | `scheduler.js generate` | child process, reads `output/post.json` + `image.png` |
| Approve → publish | `scheduler.js publish` (`buffer.js`) | child process (existing publish path) |
| Buffer status | `list-channels.js` | child process, parses channels |
| Dashboard "last post" | `output/*` | file read |
| Automation status/logs, triggers | GitHub Actions REST API | `runs`, `jobs`, `dispatches` |
| Calendar | `content/post-ideas.json` + 9am schedule | local rotation preview |
| Approval/drafts state | *(new)* app store | JSON in OS user-data dir |

## Process model
- **Renderer (React)**: `contextIsolation: true`, `nodeIntegration: false`. No secrets, no Node.
- **Preload**: exposes a fixed, whitelisted `window.westbury` API over IPC — nothing else.
- **Main (Node)**: reads `.env`, runs the existing scripts, calls GitHub API. All secret handling
  lives here.

## Modes
- **Automatic** (default & only automated path): the 9am workflow runs unchanged; the app watches it.
- **Manual**: generate a draft in the app → optionally review in Approval Queue → publish via the
  existing `scheduler.js publish`. This never disables the automatic workflow.

## Security
- Keys (`GITHUB_TOKEN`, `BUFFER_API_KEY`) are read only in main from a git-ignored `.env`
  (production: the same GitHub Secrets). Never stored by the app, never sent to the renderer.

## Build
- Vite + React → `dist/` (renderer). Electron loads it.
- `electron-builder --win` → NSIS installer + portable `.exe` in `release/`.
