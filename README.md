# Rishaan's Ride — first birthday invitation

A single self-contained page in two acts.

**Act one, the gate.** Rishaan is parked on a country road under a string of
party lights: *Ready, set, ONE!* and one button, *Start your engines*. Press
it and he drives for
five seconds — the car never moves, the world scrolls past it — then pulls up
under a balloon arch and the whole cover lifts away like a curtain.

**Act two, the invitation** underneath: *You are lovingly invited* ·
*Curtain up in* · *When & where* · *Your presence will make his day even
sweeter*, which closes on the sign-off.

---

## Two builds of the same page

`python3 build.py` writes both.

**`index.html` + `img/`** — the website, at the root of this folder.
Double-click it to look at it, or deploy the folder to Vercel; see
**DEPLOY.md**. The artwork is three `.webp` files the browser caches for a
year, so the HTML is 68 KB and a second visit re-fetches almost nothing.

**`claude-artifact.html`** — one self-contained file for the Claude Artifact
service, which supplies the `<!doctype>`/`<head>`/`<body>` wrapper itself
and has nowhere to put side files, so the artwork is inlined. 249 KB. It is
deliberately not called `index.html`: served raw by a web host it would be a
page with no `<head>`, and a phone would lay it out at 980px and shrink it.

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
  timeLabel: "6:00 PM onwards",
  timeNote:  "The cake is ready. The fun is waiting. All we need is YOU!",
  venue:     "The Locus",
  address:   "Punnapra, Alappuzha, Kerala",
  dressCode: "Blue & White",
  dressNote: "Dress to match the birthday vibe!",
  hosts:     "Rishaan's Favorite Crew",
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

`test/sweep.js` and `test/verify.js` are the checks used while building it.
The sweep walks fourteen viewport sizes from a 320px iPhone SE to a 2560px
monitor — the phone-sized ones under real iPhone and Android emulation, not
just a narrow window — and prints a line beginning `!!` for anything that
lays out at the wrong width, overflows sideways, or has a tap target under
44px. Point it at a deployed site with `node test/sweep.js https://your.app/`.
`verify.js` covers reduced motion, no-JavaScript, and that the arch comes to
rest centred on the car. Both need `npm i playwright`.

## Parked, not deleted

The **RSVP button** ("Tell us you're coming", which opened a WhatsApp
message) is commented out at the foot of `build/03-body.html`. To bring it
back, uncomment that block and the matching `$("lWa")` line in
`build/04-app.js`, and set `whatsapp` in `EVENT` to the right number.

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

## He crawls in

As the note in the first section comes into view, Rishaan crawls in from the
left, sits down beside the speech bubble, and only then does the bubble pop
up and type what he says. The small round photo of his face that used to sit
inside the bubble is gone: he is the speaker now, and the bubble's tail
points at him.

**The artwork** is `crawl/sheetA.png` (three-quarter view, looking at you)
and `crawl/sheetB.png` (side profile). `crawl/build_sprite.py` turns them into
one strip, `assets/crawl.webp`, of six cells on a shared canvas: four crawl
frames, one looking at you, one sitting. The registration is what makes it
work — the crawl frames are pinned by the centre of his hair so his head
holds still while his hands step; the look-at-camera frame is pinned by its
*body* (86% overlap with crawl frame 1 below the neck), so switching to it
turns his head rather than moving the baby; the sitting frame stands on the
same ground line, centred where his torso was. The sheets are cut out with a
gentler key than the car: this shirt and these socks meet the paper with no
pencil line round them, and the car's "pale and neutral" rule would delete
them.

**The motion** (`initKid` in `build/04-app.js`) keeps to three rules:

1. His hands are tied to distance, not time. One crawl cycle is a fixed
   fraction of his own length, so a hand stays planted while it is on the
   floor and his knees never slide.
2. Scrolling sets where he is headed; he gets there at a baby's pace, so a
   fast flick does not fire him across the screen. Until the note is well
   into view, scrolling back up makes him crawl backwards.
3. Two jokes, then he stops. Pause your scrolling and he stops too and looks
   at you. On a long desktop path he looks once of his own accord; on a
   phone, where the path is short, he looks at you when he arrives. Then he
   plops down and speaks.

Poses change on a cut, not a cross-fade — a dissolve between two drawings
shows both at half strength for a moment, and that ghost is what makes this
kind of thing look cheap. The drop and squash as he sits carry the motion.
The loop only runs while the note is near the screen and stops for good once
he is sitting. With reduced motion turned on he is simply sitting there; with
no JavaScript, the bubble shows on its own.

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
- **Icons.** `assets/favicon.svg` is a checkered flag in the invitation's
  navy, drawn to still read at 16px. To use your own, replace that file and
  run `python3 build.py`; nothing in the head needs editing. Run
  `python3 icons.py` too if you want `favicon.ico`, the iOS home-screen icon
  and the Android manifest icons redrawn to match — otherwise they stay as
  they are, which is fine, they are only used when the SVG cannot be.
- **Two small drawings instead of emoji.** The checkered flag in the cover
  headline and the two hearts beside the dress code are inline SVG, in the
  invitation's own palette. Emoji render differently on every platform, and
  🩵 (light blue heart) is a 2022 addition that still shows as an empty box
  on plenty of phones — not something to discover after the link has gone
  out to sixty relatives. Swapping them back for characters is a one-line
  edit in `build/03-body.html` if you prefer.

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

- **under 420px** — the countdown labels lose tracking so "SECONDS" fits
  its column, and the buttons tighten so "ADD TO CALENDAR" stays on one line.
- **landscape under 600px tall** — the gate turns into two columns, scene
  beside words. Stacked, the road would be a letterbox slit.
- **1700px and 2200px** — the root font size steps to 18px and then 20px.
  Every measure in the invitation is in rem, so the column, the type and the
  vertical rhythm all grow together instead of a 1160px strip sitting in the
  middle of a 2560px monitor.

**The one-line facts row is measured, not guessed.** `Fri 25 Sep 2026 ◆
6 PM onwards ◆ The Locus` belongs on one line, and whether it fits is a
question about that text, at that width, in that font — so the script asks,
with `scrollWidth > clientWidth`, and only stacks the three facts when the
answer is no. A fixed breakpoint is what made a 430px iPhone show one line
and a 360px Android show three. The check runs again on resize and again
after `document.fonts.ready`, because Cormorant is not the width of the
fallback serif and a row measured against the wrong face is measured wrong.
The size and the gaps are fluid too, so at the moment nothing down to 320px
needs to stack at all — the stacked layout is there for a longer venue name
later, not for a particular phone.

Checked from 320×568 to 2560×1440, portrait and landscape, with the phone
sizes under real device emulation: every one lays out at its true width, no
horizontal overflow, no tap target under 44px.

One thing that is easy to get wrong and invisible until it is on a phone:
the page needs `<meta name="viewport" content="width=device-width">`. Without
it a phone assumes the page was built for a 980px desktop, lays it out at
980px and scales the result down — every media query still "works", and the
page is still unreadable. It lives in `build/01-head.html`, so both builds
carry it even though the Artifact service adds its own, and `build.py`
asserts it is there rather than leaving it to be noticed.

## Files

```
index.html            ← the website. Deploy this folder.
img/                  car.webp · eleph.webp · head.webp
share-card.jpg        the link-preview image (og:image)
claude-artifact.html  the same page, for republishing to the Claude artifact
DEPLOY.md             how to put it on Vercel
build/                the authored sources
build.py              assembler — SITE_URL and INCLUDE_PARKED live at the top
vercel.json           cache and security headers
cutout.py             background removal for the landing artwork
crawl/                the two crawl sheets and the script that builds the strip
icons.py              draws favicon.ico and the home-screen PNGs
assets/favicon.svg    the tab icon — replace this one to use your own
assets.json           artwork as base64
assets/source.png     the original illustration, untouched
assets/car900.webp    the cut-out version the page uses
assets/eleph464.webp  the elephant
assets/head96.webp    his face in the note
assets/share-card.jpg the master of the link-preview image
test/                 the viewport sweep and the behaviour checks
preview/              what it looks like
```

`index.html`, `img/`, `share-card.jpg` and `claude-artifact.html` are
generated — edit `build/`, not them.

Every image is sized to about twice the largest space the page ever gives
it — 900px for a car shown at most 475 CSS px, 96px for a 40px avatar —
which is what a 2× screen needs and not a byte more.
