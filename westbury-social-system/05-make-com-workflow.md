# Make.com Workflow Instructions

Make.com is the glue between the Google Sheet (control), Google Drive (assets) and Buffer
(publishing). The end-to-end pipeline:

```
Claude ──creates──▶ image (Drive) + caption (Sheet row, Status=READY)
                         │
                         ▼
                   Make.com scenario
                         │
                         ▼
                   Buffer (Add to Queue)
                         │
                         ▼
                     Instagram
```

## Folder & file conventions (set these up first)

- Google Drive folder: `Westbury Social / Ready` — Claude saves finished images here as
  `YYYY-MM-DD-<slug>.png`.
- Google Sheet: `Westbury Content Tracker` (structure in `06-google-sheet-template.md`).
  The **Image file** column holds exactly the Drive file name.

## Scenario 1 — "Queue READY posts" (runs every 30 min)

| # | Module | Configuration |
|---|---|---|
| 1 | **Google Sheets → Search Rows** | Spreadsheet: Westbury Content Tracker · Filter: `Status = READY` AND `Buffer status = (empty)` · Limit 1 |
| 2 | **Google Drive → Search Files** | Folder: `Westbury Social/Ready` · Name = `{{1.Image file}}` |
| 3 | **Google Drive → Download File** | File ID from module 2 |
| 4 | **Buffer → Create a Post** (Add to Queue) | Channel: Westbury Instagram · Text: `{{1.Caption}}` · Media: file data from module 3 · Method: *Add to queue* |
| 5 | **Google Sheets → Update Row** | Same row: `Status = SCHEDULED`, `Buffer status = QUEUED` |
| 6 | *Error handler* on module 4 | **Google Sheets → Update Row**: `Buffer status = ERROR` + break/notification |

> If the Buffer app is unavailable on your Make plan/region, module 4 has two drop-in
> replacements: (a) **HTTP module** calling the Buffer API `POST /1/updates/create.json` with
> your Buffer access token, or (b) skip Make→Buffer entirely and use the manual fallback in
> `04-buffer-automation.md` — the sheet and Drive stay the single source of truth either way.

## Scenario 2 — "Mark as published" (runs daily 21:30)

| # | Module | Configuration |
|---|---|---|
| 1 | **Google Sheets → Search Rows** | `Status = SCHEDULED` and `Date ≤ today` |
| 2 | **Buffer → List Sent Posts** (or HTTP `GET /1/profiles/{id}/updates/sent.json`) | Channel: Westbury Instagram |
| 3 | **Filter** | Sent post text contains the row's headline/first caption line |
| 4 | **Google Sheets → Update Row** | `Status = PUBLISHED`, `Buffer status = SENT`, `Published date = {{now}}` |

(If Buffer read-back isn't available, simplify: Scenario 2 just marks any SCHEDULED row whose
date has passed as PUBLISHED, and a human spot-checks weekly.)

## Operating notes

- **Idempotency:** the `Buffer status = (empty)` filter in Scenario 1 guarantees a post is
  queued exactly once, even if the scenario re-runs.
- **Ordering:** limit 1 row per run keeps posts flowing in date order.
- **Approvals:** rows marked `NEEDS APPROVAL` are invisible to the scenario until a human
  flips them to `READY` — that is the entire approval mechanism, on purpose.
- **Credentials:** connect Google and Buffer in Make via OAuth connections; never paste
  passwords into scenarios. Re-check connections monthly (Make shows expiring connections).
- **Cost:** at ≤5 posts/week both scenarios fit comfortably in Make's free/low tier
  (~400 operations/month).
