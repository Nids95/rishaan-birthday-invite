/* End-to-end audit of the deployed build (index.html + img/ served over HTTP,
   exactly what Vercel serves). For each device: load → gate → ride → lift →
   party → crawl → scroll to the end, measuring as it goes.

   Phones run with the CPU slowed 4x and a mid-range mobile network, because
   a fast laptop pretending to be a phone flatters everything.

     node audit.js [baseURL]           default http://127.0.0.1:8290/        */
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:8290/';

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const AND = 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const DEVICES = [
  // label, w, h, dpr, mobile, ua, cpu slowdown, throttle network
  ['iPhone SE',          375, 667, 2, true,  IOS, 4, true],
  ['iPhone 14',          390, 844, 3, true,  IOS, 4, true],
  ['Galaxy S8+',         360, 740, 3, true,  AND, 4, true],
  ['Pixel 7',            412, 915, 2.6, true, AND, 4, true],
  ['Phone landscape',    844, 390, 3, true,  IOS, 4, true],
  ['iPad mini portrait', 768, 1024, 2, true, IOS, 2, false],
  ['iPad Air landscape',1180, 820, 2, true,  IOS, 2, false],
  ['iPad Pro portrait', 1024, 1366, 2, true, IOS, 2, false],
  ['Laptop',            1366, 768, 1, false, null, 1, false],
  ['Desktop',           1920, 1080, 1, false, null, 1, false],
];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = [];
  for (const [label, w, h, dpr, mobile, ua, cpu, slowNet] of DEVICES) {
    const c = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr,
      isMobile: mobile, hasTouch: mobile, userAgent: ua || undefined });
    const p = await c.newPage();
    const cdp = await c.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    if (slowNet) {
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150,
        downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    }
    const errs = [], bytes = { total: 0, n: 0 };
    p.on('pageerror', e => errs.push(String(e)));
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
    p.on('response', async r => { if (/fonts\.g/.test(r.url())) return;
      try { const bd = await r.body(); bytes.total += bd.length; bytes.n++; } catch (e) {} });

    await p.addInitScript(() => {
      window.__m = { cls: 0, shifts: [], lcp: 0, long: [], frames: [] };
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) {
        window.__m.cls += e.value; window.__m.shifts.push([Math.round(e.startTime), +e.value.toFixed(4),
          (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.nodeName)).join('|')]); } }))
        .observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => { window.__m.lcp = e.startTime; }))
        .observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => window.__m.long.push([Math.round(e.startTime), Math.round(e.duration)])))
        .observe({ type: 'longtask', buffered: true });
    });

    const t0 = Date.now();
    await p.goto(BASE, { waitUntil: 'load', timeout: 60000 });
    const loadMs = Date.now() - t0;
    await p.waitForTimeout(700);

    // ── the gate, before anything moves
    const gate = await p.evaluate(() => {
      const r = el => el.getBoundingClientRect();
      const btn = document.getElementById('gGo'), car = document.getElementById('gCar'), sc = document.getElementById('gScene');
      const lights = document.querySelector('#gScene .l-lights');
      return {
        btnVisible: r(btn).bottom <= innerHeight && r(btn).top >= 0, btnH: Math.round(r(btn).height),
        carClear: Math.round(r(car).top - r(sc).top),
        carInScene: r(car).top >= r(sc).top - 1 && r(car).left >= r(sc).left - 1 && r(car).right <= r(sc).right + 1,
        overflowX: document.documentElement.scrollWidth - innerWidth,
        heroLines: Math.round(r(document.querySelector('.g-hero')).height / parseFloat(getComputedStyle(document.querySelector('.g-hero')).lineHeight)),
      };
    });

    // ── the ride: count frames that miss a 60Hz deadline by more than half
    await p.evaluate(() => { const f = window.__m.frames; let last = 0;
      (function tick(t){ if (last) f.push(t - last); last = t; if (f.length < 600) requestAnimationFrame(tick); })(0); });
    await p.click('#gGo');
    const skip = await p.evaluate(() => Math.round(document.getElementById('gSkip').getBoundingClientRect().height));
    await p.waitForTimeout(5400);
    const ride = await p.evaluate(() => { const f = window.__m.frames.slice(5);
      const slow = f.filter(d => d > 25).length;
      return { frames: f.length, avg: +(f.reduce((a, b) => a + b, 0) / f.length).toFixed(1), janky: slow,
               pct: +(100 * slow / f.length).toFixed(1), worst: Math.round(Math.max(...f)) }; });

    // ── lift + party + crawl: stay put until he is sitting and has spoken
    await p.waitForTimeout(2600);
    const party = await p.evaluate(() => ({ balloons: document.getElementById('hSky').childElementCount }));
    let sat = false;
    for (let i = 0; i < 24 && !sat; i++) {
      sat = await p.evaluate(() => document.getElementById('lKid').classList.contains('sat'));
      if (!sat) { await p.evaluate(() => { const r = document.getElementById('lSay').getBoundingClientRect();
        window.scrollBy(0, Math.max(0, r.top - innerHeight * .45) / 6); }); await p.waitForTimeout(500); }
    }
    await p.waitForTimeout(3200);
    const note = await p.evaluate(() => {
      const k = document.querySelector('.kid-slot').getBoundingClientRect(), n = document.getElementById('lNote').getBoundingClientRect();
      return { sat: document.getElementById('lKid').classList.contains('sat'),
               typed: document.getElementById('lNote').classList.contains('typed'),
               kidLeftOfNote: k.right <= n.left + 1 && k.left >= -1, noteRight: Math.round(innerWidth - n.right) };
    });

    // ── scroll the whole page like a person, checking every section
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += Math.round(h * .6)) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(260); }
    await p.waitForTimeout(900);
    const page = await p.evaluate(() => {
      const bad = [];
      const vw = document.documentElement.clientWidth;
      document.querySelectorAll('main *').forEach(el => {
        const r = el.getBoundingClientRect(); if (!r.width) return;
        if (el.closest('.h-sky,.kid-slot,.l-lights,.bulbs')) return;           // decoration may bleed
        if (r.right > vw + 1 || r.left < -1) bad.push((el.id || el.className || el.nodeName) + ' ' + Math.round(r.left) + '→' + Math.round(r.right));
      });
      const clipped = [...document.querySelectorAll('main p, main h1, main h2, main .v, main .s, main .k, main .l-btn, .tick b, .tick span')]
        .filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(e => e.id || e.className);
      const taps = [...document.querySelectorAll('a[href], button')].filter(e => e.offsetParent)
        .map(e => [e.id || e.textContent.trim().slice(0, 16), Math.round(e.getBoundingClientRect().height), Math.round(e.getBoundingClientRect().width)])
        .filter(x => x[1] < 44);
      const fact = document.getElementById('lFacts');
      return { overflowX: document.documentElement.scrollWidth - vw, outside: bad.slice(0, 5), clipped: clipped.slice(0, 5), smallTaps: taps,
               factsOneLine: !fact.classList.contains('stack'),
               tkt: getComputedStyle(document.querySelector('.tkt-grid')).gridTemplateColumns.split(' ').length,
               revealsLeft: document.querySelectorAll('[data-rev].hid').length, pageH: document.documentElement.scrollHeight };
    });
    await p.screenshot({ path: `shots/audit/${label.replace(/\W+/g, '_')}.png`, fullPage: true });

    const m = await p.evaluate(() => ({ cls: +window.__m.cls.toFixed(4), shifts: window.__m.shifts.slice(0, 4), lcp: Math.round(window.__m.lcp),
      long: window.__m.long.length, longMax: window.__m.long.reduce((a, x) => Math.max(a, x[1]), 0),
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null }));
    out.push({ label, w, h, cpu, loadMs, KB: Math.round(bytes.total / 1024), req: bytes.n, gate, skip, ride, party, note, page, m, errs });
    await c.close();
  }
  await b.close();
  require('fs').writeFileSync('shots/audit/report.json', JSON.stringify(out, null, 1));
  for (const r of out) {
    console.log(`\n■ ${r.label} ${r.w}x${r.h}  cpu÷${r.cpu}`);
    console.log(`  load ${r.loadMs}ms  ${r.KB}KB in ${r.req} requests  LCP ${r.m.lcp}ms  CLS ${r.m.cls}  long tasks ${r.m.long} (max ${r.m.longMax}ms)  heap ${r.m.heap}MB`);
    console.log(`  gate: button on screen ${r.gate.btnVisible} (${r.gate.btnH}px)  car fits ${r.gate.carInScene} (${r.gate.carClear}px headroom)  headline ${r.gate.heroLines} line(s)  skip ${r.skip}px`);
    console.log(`  ride: ${r.ride.frames} frames, avg ${r.ride.avg}ms, janky ${r.ride.janky} (${r.ride.pct}%), worst ${r.ride.worst}ms`);
    console.log(`  after: balloons ${r.party.balloons}  kid sat ${r.note.sat}  typed ${r.note.typed}  beside note ${r.note.kidLeftOfNote}`);
    console.log(`  page: overflowX ${r.page.overflowX}  outside ${JSON.stringify(r.page.outside)}  clipped ${JSON.stringify(r.page.clipped)}  facts 1-line ${r.page.factsOneLine}  ticket cols ${r.page.tkt}  unrevealed ${r.page.revealsLeft}`);
    if (r.page.smallTaps.length) console.log(`  small taps: ${JSON.stringify(r.page.smallTaps)}`);
    if (r.m.shifts.length) console.log(`  shifts: ${JSON.stringify(r.m.shifts)}`);
    if (r.errs.length) console.log(`  ERRORS: ${r.errs.join(' | ')}`);
  }
})();
