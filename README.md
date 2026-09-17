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

## Opening it

`rishaan-ride.html` is a complete document — double-click it, no server, no
build step, nothing to install. Everything (artwork included) is inside that
one file. The only outside request is Google Fonts; without a network it
falls back to system serif and sans and still reads.

`index.html` is the same page **without** the `<!doctype>`/`<head>`/`<body>`
wrapper, because the Claude Artifact service supplies those at publish time.
That is the file to republish to the artifact.

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
assets.json           the artwork, base64, injected at build time
build.py              assembles index.html and rishaan-ride.html
```

```
python3 build.py
```

`cutout.py` is how the landing artwork was lifted off its blue paper —
run it again if you ever swap in a new illustration:

```
python3 cutout.py assets/source.png assets/car900.webp
```

## Parked, not deleted

The **Meet the birthday boy** section (the photo where he waves, plus the
first-year tally) is still in the file, commented out, with its artwork
still loaded. To bring it back:

1. uncomment the `<section class="sec recsec">` block in `build/03-body.html`
2. uncomment the matching block at the foot of `build/02-style.css`
3. uncomment the four `lRacer1` / `lWv1-3` lines in the artwork list near the
   top of `build/04-app.js`
4. `python3 build.py`

## Notes on how it behaves

- **No JavaScript** → the gate never appears and the invitation is simply
  there. The inlined artwork is handed to the `<img>` tags by the script, so
  a script-less visitor gets the words but not the pictures.
- **Reduced motion** → the button takes you straight in; no drive, no
  confetti, no typing.
- **Escape**, or *Skip ahead*, ends the ride early.
- **Dark mode** → the scene and the header band stay ivory on purpose. They
  are lit surfaces, so every token that paints on them keeps its light value;
  otherwise dark mode drops a charcoal card with navy text onto an ivory
  band and the text disappears.
- The arch is parked at the exact distance the speed curve integrates to, so
  he comes to rest dead centre under it at 5.0 s on any screen.

## Files

```
rishaan-ride.html     open this one
index.html            the same page, for republishing to the artifact
build/                the authored sources
build.py              assembler
cutout.py             background removal for the landing artwork
assets.json           artwork as base64
assets/source.png     the original illustration, untouched
assets/car900.webp    the cut-out version the page uses
assets/share-card.jpg the link-preview image (og:image)
```
