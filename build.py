#!/usr/bin/env python3
"""Assemble the invitation.

The page is authored in pieces under build/ so it stays editable, and this
script puts them together. It writes TWO builds of the same page, because
the two places it lives want different things:

  index.html + img/   the website. A complete document, with the artwork as
               three .webp files the browser caches for a year, so the HTML
               is small and a second visit re-fetches almost nothing. This
               sits at the root on purpose: point Vercel at this folder and
               it serves the right file with no settings to get wrong. You
               can also just double-click it.

  claude-artifact.html   the same page built for the Claude Artifact
               service, which supplies the <!doctype>/<head>/<body> wrapper
               itself and has nowhere to put side files, so the artwork is
               inlined. Deliberately NOT called index.html — served raw by a
               web host it would be a page with no <head>, and a phone would
               lay it out at 980px and shrink it.

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
SITE_URL = "https://rishaan-birthday-invite.vercel.app"

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


# ── 1 · the website, at the root ────────────────────────────────────────
site = here
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

# ── 2 · the Claude artifact ─────────────────────────────────────────────
art_inline = "window.ART = {\n" + ",\n".join(
    '  %s: "%s"' % (k, assets[k]) for k in keys) + "\n};\n"
(here / "claude-artifact.html").write_text(page(art_inline, standalone=False))

sz = lambda p: p.stat().st_size / 1024
print("index.html            %7.1f KB  + %.1f KB of images (cached separately)"
      % (sz(site / "index.html"), sum(sz(site / FILE[k]) for k in keys)))
print("claude-artifact.html  %7.1f KB  (everything inlined)" % sz(here / "claude-artifact.html"))

# ── 3 · the check that matters ──────────────────────────────────────────
# A page served to a phone without this tag is laid out at 980px and scaled
# down. It is invisible in a desktop browser and obvious on a phone, so it
# gets asserted rather than eyeballed.
for f in (site / "index.html", here / "claude-artifact.html"):
    assert 'name="viewport"' in f.read_text(), "no viewport meta in " + f.name
print("viewport meta: present in both")

# a quick sanity pass: every id the script reaches for exists in the markup
ids = set(re.findall(r'id="([A-Za-z0-9_-]+)"', body))
missing = sorted({m for m in re.findall(r'\$\("([A-Za-z0-9_-]+)"\)', app)} - ids)
print("script ids with no element:", missing or "none")
