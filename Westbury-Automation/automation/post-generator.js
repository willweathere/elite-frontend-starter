// post-generator.js
// -----------------------------------------------------------------------------
// Turns "today" into a finished post: it reads the brand rules, picks the right
// idea from the rotating bank (content/post-ideas.json), assembles the caption,
// and validates that caption against the Post Rules.
//
// It does NOT draw the image (that is the image provider's job) and it does NOT
// talk to Buffer (that is buffer.js). Keeping those separate is what lets you
// swap the image provider later without touching this file.
// -----------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateCaption } from "./validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDEAS_PATH = path.resolve(__dirname, "content", "post-ideas.json");

// Whole days since the Unix epoch — a simple, stable counter for rotation.
function dayNumber(date) {
  return Math.floor(date.getTime() / 86400000);
}

function loadIdeas() {
  const raw = JSON.parse(fs.readFileSync(IDEAS_PATH, "utf8"));
  const ideas = raw.ideas || [];
  if (!ideas.length) throw new Error("post-ideas.json contains no ideas.");
  return ideas;
}

// Pick the idea for a given date. Rotating by day number means every idea is
// used once before any repeats, and the same date always gives the same idea
// (so re-running a day is predictable).
export function selectIdea(date = new Date(), ideas = loadIdeas()) {
  const index = dayNumber(date) % ideas.length;
  return { idea: ideas[index], index, total: ideas.length };
}

// Build the full post object the rest of the pipeline uses.
export function generatePost({ date = new Date(), brand, allowHashtags = false } = {}) {
  const { idea, index, total } = selectIdea(date);

  const caption = idea.caption.trim();
  const check = validateCaption(caption, brand, { allowHashtags });

  const isoDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = idea.id;

  const post = {
    date: isoDate,
    rotation: `${index + 1}/${total}`,
    id: idea.id,
    category: idea.category,
    // image text
    eyebrow: idea.eyebrow,
    headline: idea.headline, // array of lines
    subline: idea.subline,
    cta: idea.cta || "",
    layout: idea.layout || "left",
    dark: !!idea.dark,
    divider: !!idea.divider,
    // caption + accessibility
    caption,
    altText: idea.altText,
    // filenames (image provider fills imageFile/imageUrl in later)
    slug,
    imageFile: `${isoDate}-${slug}.png`,
    validation: check,
  };

  return post;
}
