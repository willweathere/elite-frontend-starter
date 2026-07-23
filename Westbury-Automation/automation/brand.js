// brand.js
// -----------------------------------------------------------------------------
// Loads the Westbury brand files so the rest of the system can "read" the brand.
// It returns the raw text of each rule file plus a few parsed helpers (the
// forbidden-words list, the approved CTAs, and the path to the logo).
//
// Nothing here is Westbury-specific in code — it just reads whatever is in the
// /brand folder. To change the brand rules, edit the .md files, not this file.
// -----------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The brand folder lives one level up from /automation.
export const BRAND_DIR =
  process.env.BRAND_DIR || path.resolve(__dirname, "..", "brand");

// Read a single brand file. Returns "" if the file is missing (so a missing
// optional file never crashes the run — but see requireBrandFiles below).
function read(file) {
  const full = path.join(BRAND_DIR, file);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "";
}

// The six brand documents the workflow is asked to read.
const FILES = {
  info: "Brand_Info.md",
  postRules: "Post_Rules.md",
  writingStyle: "Writing_Style.md",
  designRules: "Design_Rules.md",
  imageRules: "Image_Rules.md",
  ctaRules: "CTA_Rules.md",
};

// Pull the forbidden words out of Writing_Style.md. They are the bullet lines in
// the "Forbidden words" section. We lower-case them for easy matching later.
function parseForbiddenWords(writingStyle) {
  const lines = writingStyle.split("\n");
  const words = [];
  let inSection = false;
  for (const line of lines) {
    if (/forbidden words/i.test(line)) inSection = true;
    else if (inSection && /^#{1,6}\s/.test(line)) break; // next heading ends it
    else if (inSection) {
      const m = line.match(/^\s*[-*]\s+(.+?)\s*$/);
      if (m) words.push(m[1].toLowerCase());
    }
  }
  return words;
}

export function loadBrand() {
  const info = read(FILES.info);
  const writingStyle = read(FILES.writingStyle);

  const logoPath = path.join(BRAND_DIR, "Logo.png");

  return {
    dir: BRAND_DIR,
    files: FILES,
    // raw text of each document
    info,
    postRules: read(FILES.postRules),
    writingStyle,
    designRules: read(FILES.designRules),
    imageRules: read(FILES.imageRules),
    ctaRules: read(FILES.ctaRules),
    // parsed helpers
    forbiddenWords: parseForbiddenWords(writingStyle),
    logoPath: fs.existsSync(logoPath) ? logoPath : null,
  };
}

// Fail early and clearly if a required brand file is missing.
export function requireBrandFiles() {
  const missing = Object.values(FILES).filter(
    (f) => !fs.existsSync(path.join(BRAND_DIR, f))
  );
  if (missing.length) {
    throw new Error(
      `Missing brand file(s) in ${BRAND_DIR}: ${missing.join(", ")}. ` +
        `Make sure the /brand folder contains all six .md files.`
    );
  }
}
