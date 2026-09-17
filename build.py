#!/usr/bin/env python3
"""Assemble the invitation.

The page is authored in pieces under build/ so it stays editable, and this
script puts them together. It writes TWO builds of the same page, because
the two places it lives want different things:

  site/        a static site for Vercel (or any host). The artwork is served
               as three .webp files the browser can cache forever, so the
               HTML is small and a second visit re-fetches almost nothing.
               index.html here is a complete document — you can also just
               double-click it.

  artifact/    one self-contained file for the Claude Artifact service,
               which supplies the <!doctype>/<head>/<body> wrapper itself
               and has nowhere to put side files. The artwork is inlined.

    python3 build.py
"""
import base64
import json
import pathlib
import re
import shutil

# ── the deployed address ────────────────────────────────────────────────
# Social apps (WhatsApp, iMessage, Facebook) will not follow a relative
# og:image — the link preview silently loses its picture. Put the real
# Vercel domain here before you share the link.
SITE_URL = "https://rishaan-turns-one.vercel.app"

# The parked "Meet the birthday boy" section is commented out in the markup,
# so shipping its four images means every guest downloads 143 KB they will
# never see. They stay in assets.json — flip this to True at the same time
# you uncomment the section.
INCLUDE_PARKED = False

LIVE = ("car", "eleph", "head")
PARKED = ("racer1", "wave1", "wave2", "wave3")

here = pathlib.Path(__file__).parent
b = here / "build"
assets = json.load(open(here / "assets.json"))

head = (b / "01-head.html").read_text()
style = (b / "02-style.css").read_text()
body = (b / "03-body.html").read_text()
app = (b / "04-app.js").read_text()

keys = LIVE + (PARKED if INCLUDE_PARKED else ())

ART_NOTE = (
    "/* ── artwork ──────────────────────────────────────────────\n"
    "   car    · the landing portrait, also parked under the arch below\n"
    "   eleph  · the ticket stub and the closing line\n"
    "   head   · his face in the little note\n"
    "   The four images for the parked \"Meet the birthday boy\" section are\n"
    "   held in assets.json and left out on purpose; set INCLUDE_PARKED in\n"
    "   build.py when you bring the section back. */\n"
)


def page(art_js, extra_head="", standalone=True, og_absolute=False):
    h = head
    if og_absolute:
        h = h.replace('content="share-card.jpg"', 'content="%s/share-card.jpg"' % SITE_URL)
        h = h.replace('name="twitter:image" content="share-card.jpg"',
                      'name="twitter:image" content="%s/share-card.jpg"' % SITE_URL)
    h += extra_head
    out = (h
           + "\n<style>\n" + style + "\n</style>\n"
           + body
           + "\n<script>\n" + ART_NOTE + art_js + "</script>\n"
           + "\n<script>\n" + app + "\n</script>\n")
    if not standalone:
        return out
    shell = (
        '<!doctype html>\n<html lang="en">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>:root{color-scheme:light}html{scroll-padding-top:env(safe-area-inset-top,0px)}\n'
        'body{margin:0;padding:0;background:#D8EBFC}img{max-width:100%}\n'
        '[hidden]:not([hidden=until-found i]){display:none!important}</style>\n'
        '@HEAD@\n</head>\n<body>\n@BODY@\n</body>\n</html>\n'
    )
    head_part, rest = out.split("\n</style>\n", 1)
    return shell.replace("@HEAD@", head_part + "\n</style>").replace("@BODY@", rest)


# ── 1 · the static site ─────────────────────────────────────────────────
site = here / "site"
(site / "img").mkdir(parents=True, exist_ok=True)

FILE = {"car": "img/car.webp", "eleph": "img/eleph.webp", "head": "img/head.webp",
        "racer1": "img/racer1.webp", "wave1": "img/wave1.webp",
        "wave2": "img/wave2.webp", "wave3": "img/wave3.webp"}

for k in keys:
    raw = base64.b64decode(assets[k].split(",", 1)[1])
    (site / FILE[k]).write_bytes(raw)

art_files = "window.ART = {\n" + ",\n".join(
    '  %s: "%s"' % (k, FILE[k]) for k in keys) + "\n};\n"

# the car is the first thing anyone sees; tell the browser before it has
# finished reading the stylesheet
preload = ('<link rel="preload" as="image" href="img/car.webp" fetchpriority="high">\n'
           '<link rel="preload" as="image" href="img/eleph.webp">\n')

(site / "index.html").write_text(page(art_files, preload, standalone=True, og_absolute=True))
shutil.copy(here / "assets" / "share-card.jpg", site / "share-card.jpg")
shutil.copy(here / "vercel.json", site / "vercel.json")

# ── 2 · the Claude artifact ─────────────────────────────────────────────
artifact = here / "artifact"
artifact.mkdir(exist_ok=True)
art_inline = "window.ART = {\n" + ",\n".join(
    '  %s: "%s"' % (k, assets[k]) for k in keys) + "\n};\n"
(artifact / "index.html").write_text(page(art_inline, standalone=False))

sz = lambda p: p.stat().st_size / 1024
print("site/index.html      %7.1f KB  + %.1f KB of images (cached separately)"
      % (sz(site / "index.html"), sum(sz(site / FILE[k]) for k in keys)))
print("artifact/index.html  %7.1f KB  (everything inlined)" % sz(artifact / "index.html"))

# a quick sanity pass: every id the script reaches for exists in the markup
ids = set(re.findall(r'id="([A-Za-z0-9_-]+)"', body))
missing = sorted({m for m in re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', app)} - ids)
print("script ids with no element:", missing or "none")
