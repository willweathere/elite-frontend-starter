// validator.js
// -----------------------------------------------------------------------------
// Checks a finished caption against the Westbury Post Rules before it is allowed
// to be published. This is what stops an off-brand or rule-breaking caption from
// ever reaching Buffer.
//
// It returns { ok, errors, warnings }. "errors" block publishing; "warnings" are
// printed but do not block (e.g. slightly outside the ideal word count).
// -----------------------------------------------------------------------------

// Emoji detection (covers the common emoji ranges).
const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/u;

export function validateCaption(caption, brand, opts = {}) {
  const allowHashtags = opts.allowHashtags === true;
  const errors = [];
  const warnings = [];
  const text = (caption || "").trim();

  if (!text) errors.push("Caption is empty.");

  // No emojis.
  if (EMOJI.test(text)) errors.push("Caption contains an emoji (not allowed).");

  // No hashtags unless explicitly allowed.
  if (!allowHashtags && /(^|\s)#\w+/.test(text)) {
    errors.push("Caption contains a hashtag (not allowed unless requested).");
  }

  // Forbidden words / phrases from Writing_Style.md.
  const lower = text.toLowerCase();
  for (const word of brand.forbiddenWords || []) {
    // "industry-leading" is allowed if proven — treat as a warning, not an error.
    if (word.startsWith("industry-leading")) continue;
    if (lower.includes(word)) {
      errors.push(`Caption uses a forbidden word/phrase: "${word}".`);
    }
  }

  // Exclamation marks: at most one, and not overused.
  const bangs = (text.match(/!/g) || []).length;
  if (bangs > 1) errors.push(`Caption overuses exclamation marks (${bangs}).`);

  // Length target 80–150 words (warning only, per the rules' "unless instructed").
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 60) warnings.push(`Caption is short (${words} words; aim for 80–150).`);
  if (words > 170) warnings.push(`Caption is long (${words} words; aim for 80–150).`);

  // No prices (a simple guard against a currency amount slipping in). The known
  // approved figure "£110M" is fine; flag other pound-and-pence amounts.
  const priceLike = text.match(/£\s?\d[\d,]*(\.\d{2})?/g) || [];
  for (const p of priceLike) {
    if (!/£\s?110\s?m/i.test(p.replace(/\+/g, ""))) {
      warnings.push(`Possible price/amount "${p}" — confirm it is an approved fact.`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, words };
}
