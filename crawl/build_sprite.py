#!/usr/bin/env python3
"""Build assets/crawl.webp — one strip, six cells, all on the same canvas.

    0-3  the crawl cycle        (profile sheet, frames 1-4)
    4    looking at the camera  (three-quarter sheet, frame 1)
    5    sitting                (profile sheet, frame 5)

Every cell shares one canvas and one ground line, so the page can step
through them with background-position and nothing moves that should not.

Registration is the whole job here:

  · the four crawl frames are pinned by the centre of his HAIR. The eye
    follows the head, so a head that holds still while the hands move
    reads as crawling; a head that wobbles a few pixels reads as a bad GIF.
  · the look-at-camera frame is pinned by its BODY, not its head — its head
    is the one thing meant to differ. It sits where the best body match
    against crawl frame 1 put it (86% overlap below the neck).
  · the sitting frame stands on the same ground, centred on the crawl
    frames' torso, so when he plops down he lands where his body was.

    python3 crawl/build_sprite.py
"""
import json, pathlib, sys
import numpy as np
from PIL import Image

here = pathlib.Path(__file__).parent
sys.path.insert(0, str(here))
from slice import frames

A = frames(str(here / "sheetA.png"))
B = frames(str(here / "sheetB.png"))


def hair(f):
    rgb, al = f["rgb"], f["al"]
    y0, y1, x0, x1 = f["y0"], f["y1"], f["x0"], f["x1"]
    sub = rgb[y0:y0 + (y1 - y0) // 2, x0:x1 + 1]
    a = al[y0:y0 + (y1 - y0) // 2, x0:x1 + 1]
    ys, xs = np.where((sub.mean(2) < 75) & (a > .5))
    return x0 + xs.mean(), y0 + ys.mean()


def rgba(f):
    return Image.fromarray(np.dstack([f["rgb"], f["al"] * 255]).astype(np.uint8), "RGBA")


# the canvas, in sheet pixels
CW, CH = 490, 416
AX = 305            # where the centre of his hair sits, crawling
GY = 404            # the ground line

cells = []


def place(f, dx, dy):
    """Put frame f on a fresh canvas, shifted so sheet point (0,0) lands at (dx,dy)."""
    c = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    src = rgba(f)
    c.paste(src, (int(round(dx)), int(round(dy))), src)
    return c


# 0-3 · crawl, pinned by the hair; the hair centre is a fixed height above the
# ground in every frame of this sheet, so pinning the head pins the ground too
for f in B[:4]:
    hx, hy = hair(f)
    ground_from_hair = f["y1"] - hy
    cells.append(place(f, AX - hx, (GY - ground_from_hair) - hy))

# 4 · looking at the camera: frame A1's body onto frame B1's body. The body
# match (crawl/onion + the IoU search) found them aligned with the bottom
# lines level and A1's left edge 2px right of B1's.
b1 = B[0]
hx, hy = hair(b1)
b1_left_in_cell = AX - (hx - b1["x0"])
a1 = A[0]
cells.append(place(a1, (b1_left_in_cell + 2) - a1["x0"], GY - a1["y1"]))

# 5 · sitting, on the same ground, centred under where his torso was
torso_x = (b1["x0"] + hx) / 2 - hx + AX          # halfway from his heels to his head
s = B[4]
cells.append(place(s, torso_x - (s["x0"] + s["x1"]) / 2, GY - s["y1"]))

# one strip, then scaled to the size the page needs at 2x
SCALE = 0.6
w, h = int(CW * SCALE), int(CH * SCALE)
strip = Image.new("RGBA", (w * len(cells), h), (0, 0, 0, 0))
for i, c in enumerate(cells):
    strip.paste(c.resize((w, h), Image.LANCZOS), (i * w, 0))

out = here.parent / "assets" / "crawl.webp"
strip.save(out, "WEBP", quality=80, method=6)

# the numbers the page needs, as fractions of one cell so they hold at any size
meta = {
    "cells": len(cells),
    "cellAspect": round(CW / CH, 4),                 # width / height
    "ground": round(GY / CH, 4),                     # ground line, from the top
    "sitCX": round(torso_x / CW, 4),                 # where the sitting body is centred
    "noseX": round((AX + 150) / CW, 4),              # roughly where he stops being "him"
}
(here / "sprite.json").write_text(json.dumps(meta, indent=2))
print("wrote", out, strip.size, "%.1f KB" % (out.stat().st_size / 1024))
print(json.dumps(meta))

# a check sheet on the page's own ivory
pv = Image.new("RGB", strip.size, (251, 250, 247))
pv.paste(strip, (0, 0), strip)
for i in range(1, len(cells)):
    for y in range(0, h, 6):
        pv.putpixel((i * w, y), (200, 120, 120))
gy = int(GY * SCALE)
for x in range(0, strip.size[0], 4):
    pv.putpixel((x, gy), (120, 160, 200))
pv.save(here / "strip_check.png")
