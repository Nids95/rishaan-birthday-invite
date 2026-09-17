# Rishaan's Ride — first birthday invitation

A single self-contained page in two acts.

**Act one, the gate.** Rishaan is parked on a country road under a string of
party lights with one button: *Come on my ride*. Press it and he drives for
five seconds — the car never moves, the world scrolls past it — then pulls up
under a balloon arch and the whole cover lifts away like a curtain.

**Act two, the invitation** underneath: *You are lovingly invited* ·
*Curtain up in* · *When & where* · *Your presence will make his day even
sweeter*.

---

## Two builds of the same page

`python3 build.py` writes both.

**`site/`** — a static site. Double-click `site/index.html` to look at it,
or deploy the folder to Vercel; see **DEPLOY.md**. The artwork is three
`.webp` files the browser caches for a year, so the HTML is 68 KB and a
second visit re-fetches almost nothing.

**`artifact/index.html`** — one self-contained file for the Claude Artifact
service, which supplies the `<!doctype>`/`<head>`/`<body>` wrapper itself
and has nowhere to put side files, so the artwork is inlined. 249 KB.

The only outside request either one makes is Google Fonts; with no network
they fall back to system serif and sans and still read.

## Changing the details

Everything about the party lives in one object at the top of
`build/04-app.js` (and near the top of the `<script>` in the built files).
Edit a field there and the header line, the ticket, the countdown, the
directions link and the calendar link all follow:

```js
window.EVENT = {
  name:      "Rishaan Vineesh",
  startISO:  "2026-09-25T18:00:00+05:30",
  endISO:    "2026-09-25T22:00:00+05:30",
  venue:     "The Locus",
  address:   "Punnapra, Alappuzha, Kerala",
  hosts:     "Rishaan's Family",
  whatsapp:  "919400000000",     // the RSVP button
  geo:       "",                 // see below
  ...
};
```

**`geo` is worth filling in.** Left empty, *Get directions* opens a Google
Maps **search** for "The Locus, Punnapra, Alappuzha, Kerala". Paste
`"9.4603,76.3319"` (right-click the venue pin in Google Maps → copy the
coordinates) and it becomes an exact route instead. A name that Maps cannot
match confidently will route people to the wrong place, so a coordinate is
the safe option for an invitation.

## Rebuilding

The page is authored in pieces so it stays readable, and assembled by a
script that injects the base64 artwork:

```
build/01-head.html    meta, share card, fonts, the no-JS guard
build/02-style.css    the whole stylesheet
build/03-body.html    the gate and the four sections
build/04-app.js       EVENT, the invitation, the ride engine
assets.json           the artwork, base64, the source of both builds
build.py              assembles site/ and artifact/
vercel.json           headers, copied into site/ by the build
```

```
python3 build.py
```

`cutout.py` is how the landing artwork was lifted off its blue paper —
run it again if you ever swap in a new illustration:

```
python3 cutout.py assets/source.png assets/car900.webp
```

`test/sweep.js` and `test/verify.js` are the checks used while building it:
the sweep walks fourteen viewport sizes from a 320px iPhone SE to a 2560px
monitor and reports anything that overflows or clips; verify covers reduced
motion, no-JavaScript, and that the arch comes to rest centred on the car.
Both need `npm i playwright`.

## Parked, not deleted

The **Meet the birthday boy** section (the photo where he waves, plus the
first-year tally) is still here, commented out. Its four images live in
`assets.json` but are deliberately **left out of the built page** — shipping
143 KB that nothing displays would be 143 KB every guest downloads on their
phone. To bring the section back:

1. uncomment the `<section class="sec recsec">` block in `build/03-body.html`
2. uncomment the matching block at the foot of `build/02-style.css`
3. uncomment the four `lRacer1` / `lWv1-3` lines in the artwork list near the
   top of `build/04-app.js`
4. set `INCLUDE_PARKED = True` in `build.py`
5. `python3 build.py`

## Notes on how it behaves

- **No JavaScript** → the gate never appears and the invitation is simply
  there. The inlined artwork is handed to the `<img>` tags by the script, so
  a script-less visitor gets the words but not the pictures.
- **Reduced motion** → the button takes you straight in; no drive, no
  confetti, no typing.
- **Escape**, or *Skip ahead*, ends the ride early.
- **One theme.** There is no dark mode. `color-scheme: light` on `:root`
  also stops the browser tinting scrollbars and form controls when the
  reader's system is set to dark.
- The arch is parked at the exact distance the speed curve integrates to, so
  he comes to rest dead centre under it at 5.0 s on any screen.

## How it fits a screen

Nothing about the gate is a fixed number. On every resize the script works
out three things from the scene box: how deep the road band is, how wide the
car can be (limited by the width **and** by the headroom left above the road,
so a phone held sideways never pushes his head into the party lights), and
one scale factor for the scenery. The set is drawn at 1150px and that factor
shrinks it on a phone — a 940px hill on a 390px screen is a wall, not a hill
— and grows it up to 1.6× on a wide monitor so the same hill is not tiled six
times across the horizon. Road markings scale with it, and the parallax loop
wraps on exactly one painted period so the dashes never stutter.

Three widths change the layout rather than the scale:

- **under 420px** — the three facts stack instead of running on one line
  with a separator that would dangle at the line break; the countdown labels
  lose tracking so "SECONDS" fits its column; the buttons tighten so
  "ADD TO CALENDAR" stays on one line.
- **landscape under 600px tall** — the gate turns into two columns, scene
  beside words. Stacked, the road would be a letterbox slit.
- **1700px and 2200px** — the root font size steps to 18px and then 20px.
  Every measure in the invitation is in rem, so the column, the type and the
  vertical rhythm all grow together instead of a 1160px strip sitting in the
  middle of a 2560px monitor.

Checked from 320×568 to 2560×1440, portrait and landscape: no horizontal
overflow, no tap target under 44px.

## Files

```
site/                 ← deploy this folder (index.html, img/, share-card.jpg)
artifact/index.html   the same page, for republishing to the Claude artifact
DEPLOY.md             how to put it on Vercel
build/                the authored sources
build.py              assembler — SITE_URL and INCLUDE_PARKED live at the top
vercel.json           cache and security headers
cutout.py             background removal for the landing artwork
assets.json           artwork as base64
assets/source.png     the original illustration, untouched
assets/car900.webp    the cut-out version the page uses
assets/eleph464.webp  the elephant
assets/head96.webp    his face in the note
assets/share-card.jpg the link-preview image (og:image)
test/                 the viewport sweep and the behaviour checks
preview/              what it looks like
```

`site/` and `artifact/` are generated — edit `build/`, not them.

Every image is sized to about twice the largest space the page ever gives
it — 900px for a car shown at most 475 CSS px, 96px for a 40px avatar —
which is what a 2× screen needs and not a byte more.
