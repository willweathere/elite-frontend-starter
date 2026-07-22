# Buffer Automation Instructions

Buffer is the publishing layer. It receives the finished image + caption, holds the queue,
and publishes to Instagram at the scheduled slots. No Instagram Graph API is used anywhere.

## One-time setup

1. **Create/log in to Buffer** (Essentials plan or above for scheduling + analytics).
2. **Connect the channel:** Buffer → *Channels → Connect → Instagram*. Choose the Westbury
   Instagram **professional (business) account** and authorise via the linked Facebook Page
   when prompted. (Connect X/Twitter the same way if used.)
3. **Set the posting schedule** (this is what "Add to Queue" uses):
   *Settings → Posting Schedule* →
   - Mon, Tue, Thu, Fri: **12:15** and **19:00**
   - Sat: **10:00**
   These mirror `02-content-strategy.md`; adjust monthly from analytics.
4. **Enable notifications** (mobile app) so a human sees failures immediately.

## How posts arrive in Buffer

Primary path — **automated via Make.com** (see `05-make-com-workflow.md`):
- Make sends Buffer a new post containing the image (from Google Drive) and the full caption
  (caption + CTA + hashtags from the Google Sheet).
- The post is added to the **queue**, so it publishes at the next free scheduled slot —
  no per-post time picking needed.

Fallback path — **manual, 2 minutes/day:** open Buffer → *Create Post* → drag the day's image
in from the shared Drive folder → paste the caption cell from the sheet → *Add to Queue*.

## Per-post checklist inside Buffer

- Image attached, correct size (portrait 1080×1350 for IG feed).
- Caption present, hashtags after a blank line, alt text added
  (*Edit post → Alt text* on the image).
- Post is in **Queue** (not Draft) and shows the expected date/time.

## After publishing

- Buffer marks the post *Sent*. The Make scenario (or a human, on the fallback path) updates
  the sheet: `Buffer status = SENT`, `Published date = <date>`.
- Weekly: skim Buffer analytics; note the two best-performing posts in the sheet so future
  briefs can lean into what works.

## Failure handling

- If Instagram rejects a post (rare: aspect ratio, connectivity), Buffer flags it and
  notifies. Fix the asset, re-queue, and set the sheet row back to `SCHEDULED`.
- Never re-authorise channels in a hurry from a phone notification link — always via
  buffer.com directly (phishing hygiene).
