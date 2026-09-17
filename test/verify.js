const { chromium } = require('playwright');
const fs = require('fs');
const SKELETON = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n%BODY%\n</body></html>`;

(async () => {
  fs.writeFileSync('/tmp/page.html', SKELETON.replace('%BODY%', fs.readFileSync('claude-artifact.html', 'utf8')));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // 1 · full invitation, light and dark, after the ride
  for (const [tag, scheme, w] of [['light', 'light', 1180], ['dark', 'dark', 1180], ['mob', 'light', 390]]) {
    const c = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme });
    const p = await c.newPage();
    await p.goto('file:///tmp/page.html');
    await p.waitForTimeout(600);
    await p.click('#gGo');
    await p.waitForTimeout(8500);
    await p.evaluate(() => { document.querySelectorAll('[data-rev]').forEach(e => e.classList.remove('hid')); });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `shots/full-${tag}.png`, fullPage: true });
    const note = await p.evaluate(() => {
      const n = document.getElementById('lNote');
      return { cls: n.className, text: n.querySelector('p').textContent.trim().slice(0, 40) };
    });
    console.log(tag, JSON.stringify(note));
    await c.close();
  }

  // 2 · reduced motion — the button must still get you in
  {
    const c = await b.newContext({ viewport: { width: 900, height: 780 }, reducedMotion: 'reduce' });
    const p = await c.newPage();
    await p.goto('file:///tmp/page.html');
    await p.waitForTimeout(400);
    await p.click('#gGo');
    await p.waitForTimeout(1200);
    console.log('reduced:', JSON.stringify(await p.evaluate(() => ({
      hidden: document.getElementById('gate').hidden,
      open: document.documentElement.classList.contains('open'),
      noteIn: document.getElementById('lNote').classList.contains('in'),
      canScroll: getComputedStyle(document.body).overflow,
    }))));
    await p.screenshot({ path: 'shots/reduced.png' });
    await c.close();
  }

  // 3 · no JavaScript — the invitation must simply be there
  {
    const c = await b.newContext({ viewport: { width: 900, height: 780 }, javaScriptEnabled: false });
    const p = await c.newPage();
    await p.goto('file:///tmp/page.html');
    await p.waitForTimeout(400);
    console.log('nojs:', JSON.stringify(await p.evaluate(() => 1).catch(() => 'js off')));
    await p.screenshot({ path: 'shots/nojs.png' });
    await c.close();
  }

  // 4 · the arch must come to rest centred on the car
  {
    const c = await b.newContext({ viewport: { width: 1180, height: 820 } });
    const p = await c.newPage();
    await p.goto('file:///tmp/page.html');
    await p.waitForTimeout(500);
    await p.click('#gGo');
    await p.waitForTimeout(5100);
    console.log('arch centring:', JSON.stringify(await p.evaluate(() => {
      const a = document.getElementById('gArch').getBoundingClientRect();
      const c = document.getElementById('gCar').getBoundingClientRect();
      return { archMid: Math.round(a.left + a.width / 2), carMid: Math.round(c.left + c.width / 2),
               archBottom: Math.round(a.bottom), carBottom: Math.round(c.bottom) };
    })));
    await c.close();
  }
  await b.close();
})();
