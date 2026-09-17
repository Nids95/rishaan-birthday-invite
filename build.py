#!/usr/bin/env python3
"""Assemble the invitation into the single HTML file the Artifact tool publishes.

The page is authored in pieces under build/ so it stays editable; the artwork
lives outside the source as base64 in assets.json and is injected here, which
keeps the hand-written files small enough to read.
"""
import json, pathlib, re

here = pathlib.Path(__file__).parent
b = here / "build"
assets = json.load(open(here / "assets.json"))

head  = (b / "01-head.html").read_text()
style = (b / "02-style.css").read_text()
body  = (b / "03-body.html").read_text()
app   = (b / "04-app.js").read_text()

art = "window.ART = {\n" + ",\n".join(
    '  %s: "%s"' % (k, assets[k]) for k in
    ("car", "eleph", "head", "racer1", "wave1", "wave2", "wave3")
) + "\n};\n"

out = (
    head
    + "\n<style>\n" + style + "\n</style>\n"
    + body
    + "\n<script>\n/* ── artwork, inlined so the page is one self-contained file ──\n"
      "   car    · the landing portrait, also parked under the arch below\n"
      "   eleph  · the ticket stub and the closing line\n"
      "   head   · his face in the little note\n"
      "   racer1 + wave1-3 · kept for the parked \"Meet the birthday boy\"\n"
      "     section; unused today, see the commented block in the markup */\n"
    + art + "</script>\n"
    + "\n<script>\n" + app + "\n</script>\n"
)

target = here / "index.html"
target.write_text(out)
kb = len(out.encode()) / 1024
print("wrote %s  %.1f KB  (art %.1f KB)" % (target, kb, sum(len(v) for v in assets.values())/1024))

# The Artifact service wraps the fragment above in its own page skeleton at
# publish time. For a file you can just double-click, write the same content
# inside a skeleton of our own.
SKELETON = (
    '<!doctype html>\n<html lang="en">\n<head>\n'
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<style>:root{color-scheme:light}html{scroll-padding-top:env(safe-area-inset-top,0px)}\n'
    'body{margin:0;padding:0;background:#D8EBFC}img{max-width:100%}\n'
    '[hidden]:not([hidden=until-found i]){display:none!important}</style>\n'
    '@HEAD@\n</head>\n<body>\n@BODY@\n</body>\n</html>\n'
)
# everything up to and including the stylesheet belongs in <head>
head_tags, rest = out.split("\n</style>\n", 1)
standalone = SKELETON.replace("@HEAD@", head_tags + "\n</style>").replace("@BODY@", rest)
(here / "rishaan-ride.html").write_text(standalone)
print("wrote %s  %.1f KB" % (here / "rishaan-ride.html", len(standalone.encode())/1024))

# a quick sanity pass: no placeholder left, ids referenced by the script exist
ids = set(re.findall(r'id="([A-Za-z0-9_-]+)"', body))
missing = sorted({m for m in re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', app)} - ids)
print("script ids with no element:", missing or "none")
