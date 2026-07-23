// providers/local-canvas.js
// -----------------------------------------------------------------------------
// DEFAULT image provider. Renders the Westbury post locally with @napi-rs/canvas.
// No external API, no paid service, no network — it just draws the brand design
// from Design_Rules.md / Image_Rules.md and saves a PNG.
//
// Interface (shared by every provider):
//   generateImage({ post, brand, outPath, size }) -> Promise<outPath>
// -----------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(__dirname, "..", "fonts");

// Register the bundled fonts once, under stable family names.
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  const reg = (file, name) => {
    const p = path.join(FONT_DIR, file);
    if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, name);
  };
  reg("Gloock-Regular.ttf", "Gloock");
  reg("CrimsonPro-Regular.ttf", "CrimsonPro");
  reg("CrimsonPro-Italic.ttf", "CrimsonProItalic");
  reg("Lora-Bold.ttf", "LoraBold");
  reg("Lora-Regular.ttf", "LoraReg");
  fontsReady = true;
}

// ---- Brand palette (from Design_Rules.md) -----------------------------------
const C = {
  crimsonDeep: [63, 8, 17],
  crimson: [192, 18, 46],
  plumNoir: [26, 9, 16],
  gold: [222, 178, 110],
  blush: [242, 168, 181],
  white: [255, 255, 255],
};
const rgb = (a, alpha = 1) => `rgba(${a[0]},${a[1]},${a[2]},${alpha})`;
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

const SIZES = {
  portrait: [1080, 1350],
  square: [1080, 1080],
  landscape: [1200, 675],
};

// ---- drawing helpers --------------------------------------------------------

function gradientField(ctx, w, h, dark) {
  const top = dark ? C.plumNoir : C.crimsonDeep;
  const bottom = dark ? [94, 20, 34] : C.crimson;
  for (let y = 0; y < h; y++) {
    const t = Math.pow(y / h, 1.25); // hold the darkness longer at the top
    const col = lerp(top, bottom, t);
    ctx.fillStyle = rgb(col);
    ctx.fillRect(0, y, w, 1);
  }
  // Warm lamplight glow, low and to the left.
  const g = ctx.createRadialGradient(
    w * 0.3, h * 0.86, 0,
    w * 0.3, h * 0.86, w * 0.95
  );
  g.addColorStop(0, rgb([255, 90, 100], 0.12));
  g.addColorStop(1, rgb([255, 90, 100], 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function addGrain(ctx, w, h) {
  // Build a small noise tile, then scale it up faintly over the whole canvas so
  // the flat gradient reads as "printed" rather than digital.
  const nw = Math.floor(w / 2), nh = Math.floor(h / 2);
  const noise = createCanvas(nw, nh);
  const nctx = noise.getContext("2d");
  const img = nctx.createImageData(nw, nh);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 20);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(noise, 0, 0, w, h);
  ctx.restore();
}

function watermarkW(ctx, w, h, size) {
  const scale = size === "landscape" ? 0.72 : 0.58;
  const ox = size === "landscape" ? 0.86 : 0.8;
  const oy = size === "landscape" ? 0.44 : 0.56;
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = rgb(C.blush);
  ctx.font = `${Math.round(h * scale)}px Gloock`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("W", w * ox, h * oy);
  ctx.restore();
}

function particles(ctx, w, h, margin, n) {
  const palette = [C.gold, C.white, C.blush];
  for (let i = 0; i < n; i++) {
    const x = margin + Math.random() * (w - 2 * margin);
    const y = margin * 0.6 + Math.random() * (h * 0.42 - margin * 0.6);
    const r = [1, 1, 1, 2, 2, 3][Math.floor(Math.random() * 6)];
    const col = palette[Math.floor(Math.random() * palette.length)];
    ctx.fillStyle = rgb(col, 0.15 + Math.random() * 0.25);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw letter-spaced text; returns the total width. anchor: left|center|right.
function drawTracked(ctx, text, x, y, tracking, anchor = "left") {
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1);
  let cx = x;
  if (anchor === "center") cx = x - total / 2;
  if (anchor === "right") cx = x - total;
  ctx.textAlign = "left";
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cx, y);
    cx += widths[i] + tracking;
  }
  return total;
}

function goldDivider(ctx, cx, y, width) {
  const seg = (width - 26) / 2;
  ctx.strokeStyle = rgb(C.gold, 0.82);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx - width / 2 + seg, y);
  ctx.moveTo(cx + width / 2 - seg, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
  const r = 5;
  ctx.fillStyle = rgb(C.gold, 0.9);
  ctx.beginPath();
  ctx.moveTo(cx, y - r); ctx.lineTo(cx + r, y);
  ctx.lineTo(cx, y + r); ctx.lineTo(cx - r, y);
  ctx.closePath();
  ctx.fill();
}

function logoLockup(ctx, w, h, margin) {
  const wm = Math.round(h * 0.048);
  ctx.fillStyle = rgb(C.white);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${wm}px LoraBold`;
  const y1 = h - margin - Math.round(wm * 0.55);
  ctx.fillText("Westbury", w - margin, y1);
  const tw = ctx.measureText("Westbury").width;
  ctx.textAlign = "center";
  ctx.font = `${Math.round(wm * 0.44)}px LoraReg`;
  ctx.fillText("Collections Ltd", w - margin - tw / 2, y1 + Math.round(wm * 0.62));
}

// ---- provider entry point ---------------------------------------------------

export async function generateImage({ post, brand, outPath, size = "portrait" }) {
  ensureFonts();
  const [w, h] = SIZES[size] || SIZES.portrait;
  const margin = Math.round(Math.min(w, h) * 0.085);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  gradientField(ctx, w, h, post.dark);
  addGrain(ctx, w, h);
  watermarkW(ctx, w, h, size);
  particles(ctx, w, h, margin, size === "landscape" ? 16 : 26);

  // Type scale (from Design_Rules.md hierarchy).
  const hlPx = Math.round(
    h * (size === "portrait" ? 0.082 : size === "square" ? 0.094 : 0.15)
  );
  const ebPx = Math.max(22, Math.round(hlPx * 0.3));
  const subPx = Math.round(hlPx * 0.52);
  const lineH = Math.round(hlPx * 1.18);
  const lines = post.headline;

  // Vertical block placement — low centre of gravity.
  const blockH =
    ebPx + Math.round(hlPx * 0.75) + lines.length * lineH +
    (post.subline ? Math.round(subPx * 1.7) : 0) + (post.divider ? 34 : 0);
  let y = Math.round(h * (size === "landscape" ? 0.5 : 0.54) - blockH / 2);
  const cx = w / 2;
  const left = post.layout !== "center";

  ctx.textBaseline = "alphabetic";

  // Eyebrow (gold, letter-spaced caps).
  ctx.fillStyle = rgb(C.gold, 0.92);
  ctx.font = `${ebPx}px CrimsonPro`;
  const eyebrow = post.eyebrow.toUpperCase();
  if (left) drawTracked(ctx, eyebrow, margin, y + ebPx, ebPx * 0.5, "left");
  else drawTracked(ctx, eyebrow, cx, y + ebPx, ebPx * 0.5, "center");
  y += ebPx + Math.round(hlPx * 0.75);

  // Headline (white Didone).
  ctx.fillStyle = rgb(C.white);
  ctx.font = `${hlPx}px Gloock`;
  for (const ln of lines) {
    if (left) {
      ctx.textAlign = "left";
      ctx.fillText(ln, margin - Math.round(hlPx * 0.02), y + hlPx);
    } else {
      ctx.textAlign = "center";
      ctx.fillText(ln, cx, y + hlPx);
    }
    y += lineH;
  }

  // Optional gold divider.
  if (post.divider) {
    y += left ? 6 : 26;
    goldDivider(ctx, left ? margin + 130 : cx, y, left ? 260 : 300);
    y += left ? 28 : 34;
  }

  // Subline (italic serif).
  if (post.subline) {
    ctx.font = `italic ${subPx}px CrimsonProItalic`;
    ctx.fillStyle = left ? rgb(C.gold, 0.94) : rgb(C.white, 0.95);
    const sy = y + subPx + Math.round(hlPx * 0.18);
    if (left) { ctx.textAlign = "left"; ctx.fillText(post.subline, margin, sy); }
    else { ctx.textAlign = "center"; ctx.fillText(post.subline, cx, sy); }
  }

  // Footer sign-off (bottom-left) and logo lockup (bottom-right).
  const signoff = post.cta && post.cta.trim()
    ? post.cta.trim()
    : "From all of us at Westbury Collections";
  const footPx = Math.max(24, Math.round(h * 0.024));
  ctx.font = `italic ${footPx}px CrimsonProItalic`;
  ctx.fillStyle = rgb(C.white, 0.88);
  ctx.textAlign = "left";
  ctx.fillText(signoff, margin, h - margin);
  logoLockup(ctx, w, h, margin);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}
