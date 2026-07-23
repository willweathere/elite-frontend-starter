# Google Sheet Control System — "Westbury Content Tracker"

One spreadsheet controls the entire pipeline. Import
`westbury-content-tracker-template.csv` to create it, then apply the settings below.

## Columns

| Col | Header | Filled by | Notes / validation |
|---|---|---|---|
| A | Date | Human (planning) | Post date, `YYYY-MM-DD` |
| B | Post topic | Human (planning) | Short brief + any FACTS the copy may use |
| C | Category | Human (planning) | Dropdown: the 10 categories from `02-content-strategy.md` |
| D | Caption | Claude | Full caption incl. CTA + hashtags + `ALT:` line |
| E | Image file | Claude | Exact Drive file name `YYYY-MM-DD-<slug>.png` |
| F | Status | Claude / Human / Make | Dropdown: `PLANNED → READY → SCHEDULED → PUBLISHED` (+ `NEEDS APPROVAL`, `BLOCKED`) |
| G | Buffer status | Make.com | Dropdown: *(empty)* `QUEUED`, `SENT`, `ERROR` |
| H | Published date | Make.com | Set when the post goes live |

Add data-validation dropdowns on C, F, G and conditional formatting:
`READY` = amber, `SCHEDULED` = blue, `PUBLISHED` = green, `ERROR`/`BLOCKED` = red.

## Who touches what

- **Human (weekly, ~15 min):** adds next week's rows with Date, Post topic (including any real
  facts/promotions), Category, `Status = PLANNED`. Reviews any `NEEDS APPROVAL` rows.
- **Claude (daily):** reads today's `PLANNED` row → generates image (saved to Drive) and
  caption → fills D and E → sets `Status = READY` (or `NEEDS APPROVAL`/`BLOCKED`).
  Claude also reads the last 14 rows to avoid repeating topics or phrasings.
- **Make.com (automated):** picks up `READY` rows → queues in Buffer → advances Status/G/H.
  Make never edits A–E; Claude never edits G–H. No column has two writers.

## Why this works

The sheet is a simple state machine — every post moves left-to-right through unambiguous
states, any human can see pipeline health at a glance, and the approval gate is just "don't
set READY". If automation breaks, the sheet still works as a manual checklist.
