# Putting it on Vercel

The site is the **root of this folder**: `index.html`, `img/`,
`share-card.jpg` and `vercel.json`. It is static — no framework, no build
step on Vercel's side, nothing to install there.

```
index.html          the page
img/                car.webp · eleph.webp · head.webp
share-card.jpg      the picture in the link preview
vercel.json         cache and security headers
.vercelignore       keeps the sources out of the deployment
```

> **Do not deploy `claude-artifact.html`.** That build is for the Claude
> Artifact service, which supplies the `<!doctype>`/`<head>`/`<body>`
> wrapper itself. Served raw by a web host it is a page with no `<head>`,
> and a phone lays it out at 980px and shrinks the whole thing to fit —
> which looks exactly like "the site is not responsive". It is deliberately
> not named `index.html` so a host will never pick it by accident.

---

## The short way (CLI)

```bash
npm i -g vercel
vercel           # first run: signs you in, creates the project, gives a preview URL
vercel --prod    # publishes it to the real address
```

Run it from **this** folder. `.vercelignore` keeps `build/`, `assets/`,
`test/` and `preview/` out of the upload, so only the five things above go
up.

## The Git way

Push this folder to a GitHub repo, then on vercel.com → **Add New →
Project → Import**, and set:

| Setting | Value |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | `./` (the repo root) |
| Build Command | leave empty (untick the override) |
| Output Directory | leave empty |
| Install Command | leave empty |

Every push to the default branch redeploys; every push to another branch
gets its own preview URL, which is a nice way to try a change before the
guests see it.

---

## One step you should not skip

WhatsApp, iMessage and Facebook will not follow a **relative** `og:image`.
Until the address baked into the page is the real one, the link preview
shows the title and text with no picture.

So after the first deploy:

1. copy your real domain, e.g. `https://rishaan-birthday-invite.vercel.app`
2. open `build.py` and set

   ```python
   SITE_URL = "https://rishaan-birthday-invite.vercel.app"
   ```

3. `python3 build.py`
4. deploy again

Then paste the link into a WhatsApp chat with yourself to check the card.
If you add a custom domain later, change `SITE_URL` to that and redeploy —
and note that WhatsApp caches previews for a while, so test with a fresh
link or a `?v=2` on the end.

## Checking it on a phone before you send it

```bash
npm i playwright
node test/sweep.js https://your-domain.vercel.app/
```

It loads the live site at fourteen sizes, three of them under real iPhone
and Android emulation, and prints a line beginning `!!` for anything that
lays out at the wrong width, overflows sideways, or has a tap target under
44px. Silence means it is fine.

A narrow desktop window is **not** the same test: it lays the page out at
its own width whatever the HTML says, which is why a missing viewport tag
can look perfect in a resized browser and be broken on the phone in your
hand. Chrome DevTools' device toolbar does emulate this properly.

## Changing anything afterwards

Edit the sources under `build/`, run `python3 build.py`, deploy again. The
party details are all in one `window.EVENT` object at the top of
`build/04-app.js` — see the README.

## A custom domain

Vercel → your project → **Settings → Domains → Add**. A subdomain of a
domain you already own is a CNAME to `cname.vercel-dns.com`; a bare domain
is an A record to the address Vercel shows you. It issues the certificate
itself. Remember to update `SITE_URL` and redeploy.

---

## The Claude artifact is separate

`claude-artifact.html` is the same page built for the Claude Artifact
service. Deploying to Vercel does not touch it, and republishing the
artifact does not touch Vercel. Keep whichever one you are actually
sending to people up to date.
