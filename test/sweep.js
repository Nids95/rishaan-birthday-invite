/* Measure the page across the widths people actually hold, and report
   anything that overflows, clips, or collides. */
const { chromium } = require('playwright');
const fs = require('fs');
const SKELETON = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n%BODY%\n</body></html>`;

const SIZES = [
  ['320x568 iPhone SE1', 320, 568],
  ['360x640 small Android', 360, 640],
  ['390x844 iPhone 14', 390, 844],
  ['430x932 iPhone Pro Max', 430, 932],
  ['600x960 small tablet', 600, 960],
  ['768x1024 iPad portrait', 768, 1024],
  ['834x1112 iPad Air', 834, 1112],
  ['1024x768 iPad landscape', 1024, 768],
  ['1280x800 laptop', 1280, 800],
  ['1440x900 laptop', 1440, 900],
  ['1920x1080 desktop', 1920, 1080],
  ['2560x1440 big desktop', 2560, 1440],
  ['844x390 phone landscape', 844, 390],
  ['667x375 SE landscape', 667, 375],
];

(async () => {
  fs.writeFileSync('/tmp/page.html', SKELETON.replace('%BODY%', fs.readFileSync('artifact/index.html', 'utf8')));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const rows = [];
  for (const [label, w, h] of SIZES) {
    const c = await b.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto('file:///tmp/page.html');
    await p.waitForTimeout(450);

    const gate = await p.evaluate(() => {
      const r = id => document.getElementById(id).getBoundingClientRect();
      const sc = r('gScene'), car = r('gCar'), ui = document.querySelector('.g-ui').getBoundingClientRect();
      const btn = document.getElementById('gGo').getBoundingClientRect();
      return {
        scene: Math.round(sc.height), ui: Math.round(ui.height),
        car: Math.round(car.width), carTop: Math.round(car.top - sc.top),
        carBelowRoad: Math.round(sc.bottom - car.bottom),
        btnH: Math.round(btn.height),
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    await p.screenshot({ path: `shots/sw-${w}x${h}-gate.png` });
    await p.click('#gGo');
    await p.waitForTimeout(6600);
    await p.evaluate(() => document.querySelectorAll('[data-rev]').forEach(e => e.classList.remove('hid')));
    await p.waitForTimeout(250);

    const inv = await p.evaluate(() => {
      const q = s => document.querySelector(s);
      const bb = s => { const e = q(s); return e ? e.getBoundingClientRect() : null; };
      const arch = bb('.arrived .arch'), note = bb('.l-note'), facts = bb('.l-facts');
      const tickB = q('.tick b');
      const btns = [...document.querySelectorAll('.l-btn, .l-note, a')].map(e => e.getBoundingClientRect());
      const small = btns.filter(r => r.height > 0 && r.height < 44).length;
      return {
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        pageH: document.documentElement.scrollHeight,
        arch: arch ? Math.round(arch.width) : 0,
        archOut: arch ? Math.round(Math.max(0, -arch.left) + Math.max(0, arch.right - window.innerWidth)) : 0,
        noteW: note ? Math.round(note.width) : 0,
        noteLines: note ? Math.round(note.height) : 0,
        factsLines: facts ? Math.round(facts.height) : 0,
        tick: tickB ? parseFloat(getComputedStyle(tickB).fontSize).toFixed(0) : 0,
        clockW: Math.round(bb('.clock').width),
        smallTargets: small,
      };
    });
    rows.push({ label, ...gate, ...inv });
    await p.screenshot({ path: `shots/sw-${w}x${h}-invite.png` });
    await c.close();
  }
  const cols = Object.keys(rows[0]);
  console.log(cols.join('\t'));
  rows.forEach(r => console.log(cols.map(c => r[c]).join('\t')));
  await b.close();
})();
