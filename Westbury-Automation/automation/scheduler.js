// scheduler.js
// -----------------------------------------------------------------------------
// The entry point the GitHub Action runs each day. It ties the pieces together:
//
//   1. Load the brand files (brand.js)
//   2. Pick today's post and build + validate the caption (post-generator.js)
//   3. Render the image with the selected provider (providers/*)
//   4. Save caption.txt, image.png and post.json to /output
//   5. Send the post to Buffer (buffer.js)
//
// Modes (so the workflow can generate first, commit the image, then publish):
//   node scheduler.js generate   -> steps 1–4 only
//   node scheduler.js publish     -> step 5 only (reads /output/post.json)
//   node scheduler.js             -> everything (good for local DRY_RUN testing)
// -----------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadBrand, requireBrandFiles } from "./brand.js";
import { generatePost } from "./post-generator.js";
import { getImageProvider } from "./providers/index.js";
import { publishToBuffer } from "./buffer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.resolve(__dirname, "..", "output");
const ARCHIVE_DIR = path.join(OUTPUT_DIR, "archive");
const SIZE = process.env.IMAGE_SIZE || "portrait"; // portrait | square | landscape

// Build the public URL Buffer will fetch the image from. Prefer an explicit
// IMAGE_URL_BASE; otherwise construct a raw GitHub URL from the Action's env.
function buildImageUrl(imageFile) {
  if (process.env.IMAGE_URL_BASE) {
    return `${process.env.IMAGE_URL_BASE.replace(/\/$/, "")}/${imageFile}`;
  }
  const repo = process.env.GITHUB_REPOSITORY; // owner/repo
  if (!repo) return null; // running locally — no public URL available
  const branch = process.env.GITHUB_REF_NAME || "main";
  const subdir = process.env.REPO_SUBDIR || "Westbury-Automation/output/archive";
  return `https://raw.githubusercontent.com/${repo}/${branch}/${subdir}/${imageFile}`;
}

async function doGenerate() {
  requireBrandFiles();
  const brand = loadBrand();
  const allowHashtags = String(process.env.ALLOW_HASHTAGS).toLowerCase() === "true";
  const post = generatePost({ date: new Date(), brand, allowHashtags });

  console.log(`\nWestbury daily post — ${post.date}`);
  console.log(`  idea:     ${post.id} (${post.rotation})`);
  console.log(`  category: ${post.category}`);
  console.log(`  headline: ${post.headline.join(" ")}`);

  // Report validation. Warnings are printed; errors block publishing.
  for (const w of post.validation.warnings) console.log(`  warning:  ${w}`);
  if (!post.validation.ok) {
    console.error("\nCaption failed the brand rules:");
    for (const e of post.validation.errors) console.error(`  - ${e}`);
    throw new Error("Caption blocked by validator. Fix the idea in post-ideas.json.");
  }

  // Render the image with whichever provider is selected.
  const provider = await getImageProvider();
  const archivePath = path.join(ARCHIVE_DIR, post.imageFile);
  await provider.generateImage({ post, brand, outPath: archivePath, size: SIZE });
  console.log(`  image:    rendered with "${provider.name}" provider`);

  // Write the three required outputs.
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.copyFileSync(archivePath, path.join(OUTPUT_DIR, "image.png")); // latest
  fs.writeFileSync(path.join(OUTPUT_DIR, "caption.txt"), post.caption + "\n");

  const imageUrl = buildImageUrl(post.imageFile);
  const record = {
    date: post.date,
    id: post.id,
    category: post.category,
    caption: post.caption,
    altText: post.altText,
    imageFile: post.imageFile,
    imageUrl, // null when running locally
    provider: provider.name,
    size: SIZE,
    status: "generated",
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "post.json"), JSON.stringify(record, null, 2) + "\n");
  console.log(`  saved:    output/caption.txt, output/image.png, output/post.json`);
  return record;
}

async function doPublish() {
  const file = path.join(OUTPUT_DIR, "post.json");
  if (!fs.existsSync(file)) throw new Error(`No post.json in ${OUTPUT_DIR}. Run generate first.`);
  const record = JSON.parse(fs.readFileSync(file, "utf8"));

  if (!record.imageUrl) {
    console.warn(
      "[publish] No public imageUrl in post.json — Buffer needs one to attach the image. " +
        "This is normal for a local run; in GitHub Actions the image is committed first."
    );
  }
  await publishToBuffer({
    text: record.caption,
    imageUrl: record.imageUrl,
    altText: record.altText,
  });
  record.status = "sent";
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + "\n");
}

async function main() {
  const mode = (process.argv[2] || "all").toLowerCase();
  if (mode === "generate") await doGenerate();
  else if (mode === "publish") await doPublish();
  else {
    await doGenerate();
    await doPublish();
  }
}

main().catch((err) => {
  console.error("\nERROR:", err.message);
  process.exit(1);
});
