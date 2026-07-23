#!/usr/bin/env python3
"""Westbury Collections — branded social post generator.

Renders original social graphics that follow the Westbury Design System
(see 01-westbury-design-system.md): crimson gradient field, translucent
"W" watermark, gold letterspaced eyebrow, white Didone headline, italic
serif subline, sign-off left / logo lockup right.

Usage:
    python3 westbury_post.py                  # renders the example set
    python3 westbury_post.py out.png portrait "EYEBROW" "Line one|Line two" "Subline."
"""

import math
import random
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_DIR = "/root/.claude/skills/canvas-design/canvas-fonts"

FONTS = {
    "headline": f"{FONT_DIR}/Gloock-Regular.ttf",        # Didone display serif
    "italic": f"{FONT_DIR}/CrimsonPro-Italic.ttf",       # warm italic serif
    "eyebrow": f"{FONT_DIR}/CrimsonPro-Regular.ttf",     # letterspaced caps
    "wordmark": f"{FONT_DIR}/Lora-Bold.ttf",             # logo stand-in serif
    "wordmark_sub": f"{FONT_DIR}/Lora-Regular.ttf",
}

# Westbury palette
CRIMSON_DEEP = (63, 8, 17)      # gradient top
CRIMSON = (192, 18, 46)         # gradient base / brand red
PLUM_NOIR = (26, 9, 16)         # seasonal dark variant
GOLD = (222, 178, 110)          # champagne gold accent
BLUSH = (242, 168, 181)         # watermark pink
WHITE = (255, 255, 255)

SIZES = {
    "portrait": (1080, 1350),
    "square": (1080, 1080),
    "landscape": (1200, 675),
}


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_field(size, top=CRIMSON_DEEP, bottom=CRIMSON):
    """Vertical crimson gradient with a soft warm glow low in the frame."""
    w, h = size
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = (y / h) ** 1.25          # hold darkness longer at the top
        row = lerp(top, bottom, t)
        for x in range(w):
            px[x, y] = row
    # gentle radial warmth, lower-left, like lamplight
    glow = Image.new("L", (w, h), 0)
    gd = ImageDraw.Draw(glow)
    cx, cy, r = int(w * 0.30), int(h * 0.86), int(w * 0.95)
    gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=46)
    glow = glow.filter(ImageFilter.GaussianBlur(w // 5))
    warm = Image.new("RGB", (w, h), lerp(bottom, (255, 90, 100), 0.18))
    img = Image.composite(warm, img, glow)
    return img


def add_grain(img, strength=7, seed=7):
    """Fine print-like grain so the canvas feels physical, not digital."""
    rnd = random.Random(seed)
    w, h = img.size
    noise = Image.new("L", (w // 2, h // 2))
    noise.putdata([rnd.randint(128 - strength, 128 + strength)
                   for _ in range((w // 2) * (h // 2))])
    noise = noise.resize((w, h))
    return Image.composite(
        Image.new("RGB", (w, h), (255, 255, 255)), img,
        noise.point(lambda v: max(0, v - 128))
    ).blend if False else Image.blend(
        img, Image.merge("RGB", (noise, noise, noise)), strength / 255 * 1.6
    )


def particles(layer, box, n, seed=3, palette=((GOLD, 120), (WHITE, 90), (BLUSH, 80))):
    """Distant dust-in-lamplight specks. Kept sparse — restraint is the rule."""
    rnd = random.Random(seed)
    d = ImageDraw.Draw(layer)
    x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        r = rnd.choice([1, 1, 1, 2, 2, 3])
        col, a = rnd.choice(palette)
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (rnd.randint(a // 2, a),))


def draw_tracked(d, xy, text, font, fill, tracking, anchor="ls"):
    """Letterspaced caps. Returns total width."""
    widths = [d.textlength(ch, font=font) for ch in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, y = xy
    if anchor == "ms":     # centered
        x -= total / 2
    elif anchor == "rs":   # right-aligned
        x -= total
    for ch, cw in zip(text, widths):
        d.text((x, y), ch, font=font, fill=fill)
        x += cw + tracking
    return total


def watermark_w(canvas, size, alpha=78, scale=0.60, offset=(0.72, 0.52)):
    """Oversized translucent W, bleeding off the bottom-right edge."""
    w, h = size
    fs = int(h * scale)
    font = ImageFont.truetype(FONTS["headline"], fs)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((int(w * offset[0]), int(h * offset[1])), "W",
           font=font, fill=BLUSH + (alpha,), anchor="mm")
    canvas.alpha_composite(layer)


def logo_lockup(canvas, size, margin, wordmark_px=None):
    """'Westbury / Collections Ltd' lockup, bottom-right."""
    w, h = size
    wordmark_px = wordmark_px or int(h * 0.048)
    f1 = ImageFont.truetype(FONTS["wordmark"], wordmark_px)
    f2 = ImageFont.truetype(FONTS["wordmark_sub"], int(wordmark_px * 0.44))
    d = ImageDraw.Draw(canvas)
    text = "Westbury"
    sub = "Collections Ltd"
    tw = d.textlength(text, font=f1)
    x1 = w - margin
    y1 = h - margin - int(wordmark_px * 0.55)
    d.text((x1, y1), text, font=f1, fill=WHITE + (255,), anchor="rs")
    d.text((x1 - tw / 2, y1 + int(wordmark_px * 0.62)), sub,
           font=f2, fill=WHITE + (255,), anchor="ms")


def gold_divider(d, cx, y, width):
    """Hairline — diamond — hairline, as on formal Westbury posts."""
    seg = (width - 26) / 2
    d.line([cx - width / 2, y, cx - width / 2 + seg, y], fill=GOLD + (210,), width=2)
    d.line([cx + width / 2 - seg, y, cx + width / 2, y], fill=GOLD + (210,), width=2)
    r = 5
    d.polygon([(cx, y - r), (cx + r, y), (cx, y + r), (cx - r, y)], fill=GOLD + (230,))


def render_post(path, size_name, eyebrow, headline_lines, subline,
                layout="left", signoff="From all of us at Westbury Collections",
                dark=False, dust=True, divider=False, seed=11):
    size = SIZES[size_name]
    w, h = size
    margin = int(min(w, h) * 0.085)

    base = gradient_field(size, top=PLUM_NOIR if dark else CRIMSON_DEEP,
                          bottom=(94, 20, 34) if dark else CRIMSON)
    base = add_grain(base, strength=7)
    canvas = base.convert("RGBA")

    watermark_w(canvas, size, alpha=64 if dark else 76,
                scale=0.58 if size_name != "landscape" else 0.72,
                offset=(0.80, 0.56) if size_name != "landscape" else (0.86, 0.44))

    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    if dust:
        particles(layer, (margin, margin * 0.6, w - margin, h * 0.42),
                  n=26 if size_name != "landscape" else 16, seed=seed)
    d = ImageDraw.Draw(layer)

    # --- type scale ---
    hl_px = int(h * (0.082 if size_name == "portrait" else
                     0.094 if size_name == "square" else 0.15))
    eb_px = max(22, int(hl_px * 0.30))
    sub_px = int(hl_px * 0.52)
    f_h = ImageFont.truetype(FONTS["headline"], hl_px)
    f_e = ImageFont.truetype(FONTS["eyebrow"], eb_px)
    f_s = ImageFont.truetype(FONTS["italic"], sub_px)
    f_foot = ImageFont.truetype(FONTS["italic"], max(24, int(h * 0.024)))

    line_h = int(hl_px * 1.18)
    block_h = eb_px + int(hl_px * 0.75) + len(headline_lines) * line_h \
        + (int(sub_px * 1.7) if subline else 0) + (34 if divider else 0)
    # low centre of gravity: block sits just below the vertical middle
    y = int(h * (0.54 if size_name != "landscape" else 0.50) - block_h / 2)

    cx = w / 2
    if layout == "left":
        draw_tracked(d, (margin, y + eb_px), eyebrow.upper(), f_e,
                     GOLD + (235,), tracking=int(eb_px * 0.62))
        y += eb_px + int(hl_px * 0.75)
        for ln in headline_lines:
            d.text((margin - int(hl_px * 0.04), y + hl_px), ln,
                   font=f_h, fill=WHITE + (255,), anchor="ls")
            y += line_h
        if divider:
            y += 6
            gold_divider(d, margin + 130, y, 260)
            y += 28
        if subline:
            d.text((margin, y + sub_px + int(hl_px * 0.18)), subline,
                   font=f_s, fill=GOLD + (240,), anchor="ls")
    else:  # centered
        draw_tracked(d, (cx, y + eb_px), eyebrow.upper(), f_e,
                     GOLD + (235,), tracking=int(eb_px * 0.62), anchor="ms")
        y += eb_px + int(hl_px * 0.75)
        for ln in headline_lines:
            d.text((cx, y + hl_px), ln, font=f_h, fill=WHITE + (255,), anchor="ms")
            y += line_h
        if divider:
            y += 26
            gold_divider(d, cx, y, 300)
            y += 34
        if subline:
            d.text((cx, y + sub_px + int(hl_px * 0.18)), subline,
                   font=f_s, fill=WHITE + (242,), anchor="ms")

    # --- footer ---
    d.text((margin, h - margin), signoff, font=f_foot,
           fill=WHITE + (225,), anchor="ls")
    canvas.alpha_composite(layer)
    logo_lockup(canvas, size, margin)

    canvas.convert("RGB").save(path, quality=95)
    print("wrote", path)


EXAMPLES = [
    # Positioning / educational — calm, never aggressive
    dict(path="example-posts/01-positioning-portrait.png", size_name="portrait",
         eyebrow="Commercial Debt Recovery", layout="left", seed=11,
         headline_lines=["Getting", "you paid."],
         subline="Professionally, and without the friction.",
         signoff="Speak with our team — westburycollections.com"),
    # Credibility — real facts from the brand brief only
    dict(path="example-posts/02-credibility-square.png", size_name="square",
         eyebrow="Since 2019", layout="center", divider=True, seed=23,
         headline_lines=["£110M+", "recovered."],
         subline="For more than 3,500 UK businesses.",
         signoff="westburycollections.com"),
    # Approach / myth-bust — relationship-first tone
    dict(path="example-posts/03-approach-landscape.png", size_name="landscape",
         eyebrow="Our Approach", layout="left", dark=True, seed=5,
         headline_lines=["Firm, fair, friendly."],
         subline="Recovery that protects the relationship.",
         signoff="From all of us at Westbury Collections"),
]

if __name__ == "__main__":
    if len(sys.argv) >= 6:
        render_post(sys.argv[1], sys.argv[2], sys.argv[3],
                    sys.argv[4].split("|"), sys.argv[5])
    else:
        for spec in EXAMPLES:
            render_post(**spec)
