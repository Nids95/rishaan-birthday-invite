#!/usr/bin/env python3
"""Draw the raster icons that go alongside assets/favicon.svg.

Modern browsers take the SVG. These exist for the places that cannot:

  favicon.ico        old browsers, and the one Windows still shows in
                     shortcuts and some feed readers (16 + 32 + 48)
  apple-touch-icon   iOS "Add to Home Screen". 180x180, fully opaque, no
                     rounded corners of our own — iOS applies its own mask
                     and a pre-rounded icon ends up with a double corner.
  icon-192/512       the same for Android, referenced by site.webmanifest.
                     512 is what the splash screen scales from.

The mark is drawn rather than rasterised from the SVG so that this has no
dependency beyond Pillow, and so the small sizes can be nudged: at 16px a
hairline pole disappears, so it is drawn a little heavier than the vector.

    python3 icons.py
"""
import pathlib
from PIL import Image, ImageDraw

NAVY = (31, 85, 129, 255)
IVORY = (251, 250, 247, 255)

here = pathlib.Path(__file__).parent
out = here / "assets"


def draw(size, rounded=True, pad=0.0):
    """The mark, at any size. Everything is a fraction of the canvas so the
    proportions hold from 16px to 512px."""
    ss = 8                                   # supersample, then downscale
    n = size * ss
    im = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)

    if rounded:
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=n * 0.234, fill=NAVY)
    else:
        d.rectangle([0, 0, n - 1, n - 1], fill=NAVY)

    k = n / 32.0                             # the SVG's 32-unit grid
    inset = n * pad
    k = (n - 2 * inset) / 32.0

    def box(x, y, w, h, r=0, fill=IVORY):
        xy = [inset + x * k, inset + y * k, inset + (x + w) * k, inset + (y + h) * k]
        if r:
            d.rounded_rectangle(xy, radius=r * k, fill=fill)
        else:
            d.rectangle(xy, fill=fill)

    box(6.4, 5.2, 2.6, 21.6, r=1.3)          # the pole
    box(8.8, 6.8, 17.0, 11.2, r=1.6)         # the flag
    box(8.8, 6.8, 5.67, 5.6, fill=NAVY)      # three checks
    box(20.13, 6.8, 5.67, 5.6, fill=NAVY)
    box(14.47, 12.4, 5.67, 5.6, fill=NAVY)

    return im.resize((size, size), Image.LANCZOS)


# .ico carries its own sizes; 48 is what Windows reaches for
draw(48).save(out / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# iOS masks the corners itself and composites on white if there is alpha
apple = Image.new("RGB", (180, 180), (31, 85, 129))
apple.paste(draw(180, rounded=False, pad=0.0).convert("RGB"), (0, 0))
apple.save(out / "apple-touch-icon.png")

for s in (192, 512):
    draw(s).save(out / ("icon-%d.png" % s))

# maskable: the launcher crops this to a circle, a squircle or whatever the
# phone prefers, so the mark has to sit inside the middle ~80%
draw(512, rounded=False, pad=0.115).save(out / "icon-512-maskable.png")

print("wrote favicon.ico, apple-touch-icon.png, icon-192/512.png, icon-512-maskable.png")

# a contact sheet, to check the mark actually reads at tab size
sheet = Image.new("RGB", (540, 200), (240, 240, 244))
x = 12
for s in (16, 32, 48, 96, 180):
    tile = draw(s)
    sheet.paste(tile, (x, 100 - s // 2), tile)
    big = tile.resize((96, 96), Image.NEAREST)
    sheet.paste(big, (x - 24 if s < 96 else x, 150), big)
    x += max(s, 96) + 24
sheet.save(here / "icon-preview.png")
