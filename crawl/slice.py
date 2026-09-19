"""Cut the two sprite sheets into registered frames.

Each character is lifted off the paper with the same three-way key as the car
(paper colour, the near-white glow, the paper's own shadow), then separated
from its neighbours as a connected blob rather than by slicing the sheet into
fifths — in the profile sheet the reaching hand of frame 2 reaches past the
point where an even fifth would cut it off."""
import numpy as np
from PIL import Image
from scipy import ndimage

def key(path):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    H, W, _ = a.shape
    m = 12
    left = np.median(a[:, :m, :], axis=1); right = np.median(a[:, -m:, :], axis=1)
    t = np.linspace(0, 1, W, dtype=np.float32)[None, :, None]
    bg = left[:, None, :] * (1 - t) + right[:, None, :] * t
    d = np.sqrt(((a - bg) ** 2).sum(2))
    hi, lo = a.max(2), a.min(2); chroma = hi - lo
    k = (a * bg).sum(2) / np.maximum((bg * bg).sum(2), 1e-6)
    resid = np.sqrt(((a - k[..., None] * bg) ** 2).sum(2))
    # NO "pale and neutral" rule here, unlike the car: this shirt and these
    # socks meet the paper with no pencil line around them, so that rule
    # reaches them from the edge and keys them out as background.
    cand = (d < 10) | ((resid < 6) & (k > .86) & (k < 1.04))
    lab, _ = ndimage.label(cand)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))); edge.discard(0)
    out = np.isin(lab, list(edge))
    al = ndimage.gaussian_filter((~out).astype(np.float32), 1.0)
    al = np.clip((al - .34) / .46, 0, 1)
    alb = al[..., None]
    rgb = np.clip(np.where(alb > .03, (a - bg * (1 - alb)) / np.maximum(alb, .03), a), 0, 255)
    return rgb, al

def frames(path, n=5):
    rgb, al = key(path)
    H, W = al.shape
    lab, cnt = ndimage.label(al > .08)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, cnt + 1))
    coms = ndimage.center_of_mass(np.ones_like(lab), lab, range(1, cnt + 1))
    centres = [(i + .5) * W / n for i in range(n)]
    owner = np.zeros(cnt + 1, int)
    for i in range(cnt):
        if sizes[i] < 60: continue                     # dust
        owner[i + 1] = 1 + int(np.argmin([abs(coms[i][1] - c) for c in centres]))
    res = []
    for f in range(1, n + 1):
        m = np.isin(lab, np.where(owner == f)[0])
        a2 = np.where(m, al, 0)
        ys, xs = np.where(a2 > .06)
        res.append(dict(rgb=rgb, al=a2, x0=xs.min(), x1=xs.max(), y0=ys.min(), y1=ys.max()))
    return res
