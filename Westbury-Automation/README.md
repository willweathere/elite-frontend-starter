# Westbury Automation

Automatically create and publish one Westbury Collections social post every day.

Each day the system:

1. Reads the Westbury brand files (`/brand`).
2. Picks the day's topic and writes a caption that follows the brand rules.
3. Renders a branded image (crimson, gold, serif type, logo) that matches the topic.
4. Saves `caption.txt`, `image.png` and `post.json`.
5. Sends the finished post to **Buffer**, which publishes it to your social account.

It runs on **GitHub Actions** (free), needs **no paid services** by default, and keeps every
API key in **GitHub Secrets**.

---

## What each file does

```
Westbury-Automation/
├── automation/
│   ├── scheduler.js        # Main entry point. Runs the whole daily process.
│   ├── post-generator.js   # Picks today's topic and builds + checks the caption.
│   ├── validator.js        # Enforces the Post Rules (no emojis, no forbidden words, length…).
│   ├── brand.js            # Loads the six brand .md files and the logo.
│   ├── buffer.js           # Sends the post to Buffer. Reads keys from Secrets only.
│   ├── providers/
│   │   ├── index.js        # Chooses the image provider from the IMAGE_PROVIDER setting.
│   │   ├── local-canvas.js # DEFAULT image maker. Draws the design locally. No API, no cost.
│   │   └── ai-provider.js  # Example stub showing how to plug in an AI image API later.
│   ├── content/
│   │   └── post-ideas.json # The bank of pre-written, on-brand post ideas. Edit these freely.
│   ├── fonts/              # The brand fonts (bundled so images render anywhere).
│   └── package.json        # Dependencies and the npm commands.
│
├── brand/                  # Your brand rules. The system READS these; edit them to change output.
│   ├── Brand_Info.md
│   ├── Post_Rules.md
│   ├── Writing_Style.md
│   ├── Design_Rules.md
│   ├── Image_Rules.md
│   ├── CTA_Rules.md
│   └── Logo.png
│
├── output/                 # Created each run: caption.txt, image.png, post.json, archive/…
│
├── .github/workflows/
│   └── daily-post.yml      # The GitHub Action: runs daily at 9am UK + a manual test button.
│
├── .gitignore
└── README.md               # This file.
```

---

## 1. How to install (to test on your own computer)

You need [Node.js](https://nodejs.org) version 18 or newer.

```bash
cd Westbury-Automation/automation
npm install
```

Then do a safe test run that generates everything but does **not** post anything:

```bash
npm run dry-run
```

Look in the `output/` folder — you will see `image.png`, `caption.txt` and `post.json`.
Open the image to check it looks right.

To generate only (no posting):

```bash
npm run generate
```

---

## 2. How to add your Buffer API key

**Never put your key in a file or in the code.** It goes in GitHub Secrets, which are encrypted.

You only need **one** secret:

- **`BUFFER_API_KEY`** — your Buffer personal API key, from **Buffer → Settings → API**.

The channel to post to is found **automatically** from your account. (Optional:
`BUFFER_CHANNEL_IDS` if you want to force a specific channel; `DRY_RUN=true` to test without
posting.)

> Buffer replaced its old REST API with a GraphQL API (`https://api.buffer.com`). This project
> uses the new one. A key from Settings > API is the right kind; an old REST/OAuth token will be
> rejected with a 401 error.

**Finding your channel IDs:**

```bash
cd Westbury-Automation/automation
npm install
BUFFER_API_KEY=your_key_here npm run channels
```

It prints each connected channel with its `id`. Copy the one(s) you want.

To add the secrets:

1. Push this project to GitHub (see step 3).
2. On GitHub, open your repository → **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add:
   - Name `BUFFER_API_KEY`, value = your Buffer API key.
   - Name `BUFFER_CHANNEL_IDS`, value = your channel id(s).
4. (Optional) Add a secret named `DRY_RUN` with value `true` while you are testing — the workflow
   will do everything except actually send to Buffer. Delete it (or set it to `false`) when you
   are ready to go live.

> If you have ever pasted a Buffer key into a chat, an email, or a file, treat it as exposed:
> revoke it in Buffer and generate a fresh one before adding it here.

---

## 3. How to upload to GitHub

If this project is not already on GitHub:

```bash
# from the Westbury-Automation folder
git init
git add .
git commit -m "Westbury automation"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(If it is already part of an existing repository, just commit and push as normal.)

---

## 4. How GitHub Actions works here

GitHub Actions is a free robot that runs your code on a schedule. The schedule and steps are
defined in `.github/workflows/daily-post.yml`.

- **When it runs:** every day at **08:00 UTC**, which is **9am UK time during British Summer
  Time**. You can also run it any time from the **Actions** tab using the **Run workflow**
  button (this is `workflow_dispatch`, the manual test button).
- **What it does each run:** installs the project, generates the caption and image, commits the
  image to the repo (so it has a public web address), then sends the post to Buffer.
- **Why it commits the image:** Buffer needs a public image URL to attach the picture. Committing
  the PNG gives it one automatically — no image hosting service needed.
- **Secrets:** the workflow reads `BUFFER_API_KEY` and `BUFFER_PROFILE_IDS` from GitHub Secrets.
  They are never shown in the logs and never saved into the repository.

> **Winter time note:** cron always uses UTC, so in winter (GMT) the 08:00 run is 8am UK. If you
> want 9am all year, change the cron in `daily-post.yml` to `"0 9 * * *"` for the winter months,
> or accept the one-hour shift. This is a GitHub/cron limitation, not a bug.

---

## 5. Changing what gets posted

- **Edit the words:** change the brand rules in `/brand`, or edit/add ideas in
  `automation/content/post-ideas.json`. The validator will block any caption that breaks the
  Post Rules, so you cannot accidentally publish something off-brand.
- **Edit the look:** adjust colours, fonts or layout in `automation/providers/local-canvas.js`
  (guided by `brand/Design_Rules.md`).
- **Change the size:** set `IMAGE_SIZE` to `portrait` (default), `square` or `landscape`.

---

## 6. Swapping the image provider later

The image maker is deliberately separate from everything else, so you can replace it without
rewriting the project. Every provider in `automation/providers/` exports the same function:

```js
generateImage({ post, brand, outPath, size }) // returns the saved image path
```

To use a different one, set the `IMAGE_PROVIDER` environment variable:

- `IMAGE_PROVIDER=local` — the built-in renderer (default, free, no key).
- `IMAGE_PROVIDER=ai` — the example stub in `ai-provider.js`. To make it real, implement the API
  call there and add its key as a GitHub Secret (e.g. `IMAGE_API_KEY`). Nothing else changes.

You can also add your own file (e.g. `providers/canva.js`) and register it in
`providers/index.js`.

---

## 7. Important notes on Buffer

- This uses Buffer's current **GraphQL API** (`https://api.buffer.com`) with a personal API key.
  Make sure your Buffer account and plan allow API access.
- Posts are added to your Buffer **queue** (`mode: addToQueue`), so they publish at the times you
  set inside Buffer. Make sure the channel has a posting schedule set, and its queue is not paused.
- If a run fails, open the **Actions** tab on GitHub and read the log — `buffer.js` prints a clear
  reason (missing key, missing channel id, a 401 for a wrong key type, timeout, or the message
  Buffer returned).

---

## Quick command reference

```bash
npm run dry-run    # generate everything, do NOT post (safe test)
npm run generate   # generate caption + image only
npm run publish    # send the already-generated post.json to Buffer
npm run post       # generate then publish
npm run channels   # list your Buffer channel IDs (needs BUFFER_API_KEY)
```
