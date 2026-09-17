#!/usr/bin/env python3
"""Lift the watercolour off its paper.

The source illustration is a subject printed on a powder-blue sheet, and it
is surrounded by TWO things a plain colour key cannot tell apart from the
subject:

  · a soft near-white glow, the "sticker outline" the illustrator drew
    around everything. It is LESS chromatic than the blue paper, so a
    distance-to-background test keeps it and you get a white halo that
    only shows up once the image sits on a different colour.
  · a soft drop shadow, which is the paper's own colour scaled toward
    black — again far from the background in plain RGB distance.

So the key is three tests ORed together, and only the region CONNECTED TO
THE FRAME EDGE is removed. That last part is what protects the white shirt
and the cream whitewall tyres, which are near-white but enclosed by the
pencil outline and therefore never reachable from the border.

    python3 cutout.py source.png car900.webp
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else "source.png"
OUT = sys.argv[2] if len(sys.argv) > 2 else "car900.webp"
WIDTH = 900          # the widest the artwork is ever displayed, times ~2
QUALITY = 82

a = np.asarray(Image.open(SRC).convert("RGB")).astype(np.float32)
H, W, _ = a.shape

# The paper is not one flat colour: it has a gentle gradient. Model it per
# row, interpolated between the left and right margins.
m = 12
left = np.median(a[:, :m, :], axis=1)
right = np.median(a[:, -m:, :], axis=1)
t = np.linspace(0, 1, W, dtype=np.float32)[None, :, None]
bg = left[:, None, :] * (1 - t) + right[:, None, :] * t

dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
hi, lo = a.max(axis=2), a.min(axis=2)
chroma = hi - lo

# 1 · the paper itself
paper = dist < 12
# 2 · the glow: pale and almost neutral, where the paper is pale and blue
glow = (lo > 198) & (chroma < 34)
# 3 · the shadow: the paper colour, scaled toward black
k = (a * bg).sum(2) / np.maximum((bg * bg).sum(2), 1e-6)
resid = np.sqrt(((a - k[..., None] * bg) ** 2).sum(2))
shadow = (resid < 7.0) & (k > 0.86) & (k < 1.04)

lab, _ = ndimage.label(paper | glow | shadow)
edge = set(np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]])))
edge.discard(0)
outside = np.isin(lab, list(edge))

alpha = (~outside).astype(np.float32)
alpha = ndimage.gaussian_filter(alpha, 1.0)          # one pixel of anti-aliasing
alpha = np.clip((alpha - 0.34) / 0.46, 0, 1)

# drop the speckles the key always leaves behind
lab2, n2 = ndimage.label(alpha > 0.08)
if n2:
    sizes = ndimage.sum(np.ones_like(lab2), lab2, range(1, n2 + 1))
    big = [i + 1 for i, s in enumerate(sizes) if s > 3000]
    alpha = np.where(np.isin(lab2, big), alpha, 0.0)

# un-multiply the paper out of the semi-transparent edge, or every soft edge
# keeps a blue rim when the image is placed on ivory
al = alpha[..., None]
rgb = np.clip(np.where(al > 0.03, (a - bg * (1 - al)) / np.maximum(al, 0.03), a), 0, 255)

img = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
img = img.crop(Image.fromarray((alpha * 255).astype(np.uint8)).getbbox())
h = round(img.size[1] * WIDTH / img.size[0])
img.resize((WIDTH, h), Image.LANCZOS).save(OUT, "WEBP", quality=QUALITY, method=6)
print("wrote %s  %dx%d" % (OUT, WIDTH, h))
