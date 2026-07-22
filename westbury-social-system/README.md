# Westbury Collections — AI Social Media System

A complete, repeatable workflow for producing premium branded social content daily with
minimal human input.

```
Claude → image + caption → Google Drive + Google Sheet → Make.com → Buffer → Instagram
```

## Contents

| File | Deliverable |
|---|---|
| `00-design-philosophy.md` | The aesthetic manifesto behind the visual language |
| `01-westbury-design-system.md` | **The design system** — palette, type, logo, layout rules |
| `02-content-strategy.md` | Posting frequency, times, weekly schedule, category rotation |
| `03-daily-post-prompt.md` | The daily post-generation prompt for Claude |
| `04-buffer-automation.md` | Buffer setup and publishing instructions |
| `05-make-com-workflow.md` | Make.com scenarios connecting Sheet → Drive → Buffer |
| `06-google-sheet-template.md` | Sheet structure + `westbury-content-tracker-template.csv` |
| `07-example-content-calendar.md` | Worked 7-day calendar with captions, hashtags, alt text |
| `generator/westbury_post.py` | Brand-post generator (renders the design system as PNGs) |
| `generator/example-posts/` | Example finished posts (portrait, square, landscape) |

## Daily loop (once set up)

1. **Human, weekly (~15 min):** add next week's rows to the Google Sheet — date, topic +
   real facts, category. Approve anything flagged.
2. **Claude, daily:** runs `03-daily-post-prompt.md` against today's row → renders the image
   with `generator/westbury_post.py` → saves to Drive → writes caption to the sheet →
   `Status = READY`.
3. **Make.com, every 30 min:** finds `READY` rows, sends image + caption to Buffer's queue,
   advances the status.
4. **Buffer:** publishes at the scheduled slot; Make marks the row `PUBLISHED`.

Truthfulness is enforced structurally: copy may only use facts written into the sheet row,
and anything involving prices, promotions or customers requires a human to flip
`NEEDS APPROVAL → READY`.

## Regenerating / creating posts

```bash
cd generator
python3 westbury_post.py                                   # example set
python3 westbury_post.py out.png portrait "DESIGN NOTES" \
        "Let the|room|breathe." "Space is the quietest luxury."
```

Fonts: Gloock (headlines), Crimson Pro (+Italic), Lora — all Google Fonts (OFL); update
`FONT_DIR` in the script to wherever they're installed.
