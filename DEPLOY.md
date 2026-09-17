# Putting it on Vercel

The whole site is the `site/` folder. It is static — no framework, no build
step on Vercel's side, nothing to install there. Four things live in it:

```
site/
  index.html        the page
  img/              car.webp · eleph.webp · head.webp
  share-card.jpg    the picture in the link preview
  vercel.json       cache and security headers
```

---

## The short way (CLI)

```bash
npm i -g vercel
cd site
vercel           # first run: signs you in, creates the project, gives a preview URL
vercel --prod    # publishes it to the real address
```

Run it **from inside `site/`**. That makes `site/` the root of the
deployment, so `index.html` is served at `/` and `img/` resolves. If you run
`vercel` from the folder above, you get a directory listing instead of the
invitation.

## The Git way

Push this whole folder to a GitHub repo, then on vercel.com → **Add New →
Project → Import**, and set:

| Setting | Value |
| --- | --- |
| Framework Preset | **Other** |
| Root Directory | **site** |
| Build Command | leave empty (untick the override) |
| Output Directory | leave empty |
| Install Command | leave empty |

Every push to the default branch redeploys; every push to another branch
gets its own preview URL, which is a nice way to try a change before the
guests see it.

---

## One step you should not skip

WhatsApp, iMessage and Facebook will not follow a **relative** `og:image`.
Until the address in the page is the real one, the link preview shows the
title and text with no picture.

So after the first deploy:

1. copy your real domain, e.g. `https://rishaan-turns-one.vercel.app`
2. open `build.py` and set

   ```python
   SITE_URL = "https://rishaan-turns-one.vercel.app"
   ```

3. `python3 build.py`
4. deploy again (`cd site && vercel --prod`, or push)

Then paste the link into a WhatsApp chat with yourself to check the card.
If you add a custom domain later, change `SITE_URL` to that and redeploy —
and note that WhatsApp caches previews for a while, so test with a fresh
link or a `?v=2` on the end.

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

`artifact/index.html` is the same page built for the Claude Artifact
service, which wraps it in its own `<head>`/`<body>` and has nowhere to put
side files, so the artwork is inlined there instead. Deploying to Vercel
does not touch it, and republishing the artifact does not touch Vercel.
Keep whichever one you are actually sending to people up to date — or send
the Vercel link and let the artifact be the working copy.
