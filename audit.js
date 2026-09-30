// Mechanical layout audit: for every rendered section, report its height,
// visible text length, and any child left at opacity 0. Catches empty bands
// that are easy to miss when eyeballing a full-page screenshot.
const { chromium } = require('playwright');
const serve = require('./serve.js');
const pages = process.argv.slice(2).length ? process.argv.slice(2)
  : ['index','collection','product','page.custom-and-bulk','page.work','page.show','page.murphy','page.allies','cart'];
(async () => {
  const srv = await serve('preview');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1288, height: 725 } });
  const pg = await ctx.newPage();
  // The sandbox cannot reach fonts.googleapis.com, so pages stall on it.
  // Abort external requests. The display webfont therefore does NOT apply in
  // local runs — that can only be confirmed on the live store.
  await pg.route('**', r => /^https?:\/\/(?!127\.0\.0\.1|localhost)/.test(r.request().url()) ? r.abort() : r.continue());

  const bad = [];
  pg.on('pageerror', e => bad.push('JS ' + String(e).slice(0, 100)));
  for (const name of pages) {
    const res = await pg.goto(srv.base + '/' + name + '.html', { waitUntil: 'networkidle' }).catch(e => null);
    if (!res || !res.ok()) { bad.push(name + ': page did not load'); continue; }
    await pg.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 80)); }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return [...main.children].map(el => {
        const r = el.getBoundingClientRect();
        // Intentionally hidden: inactive slider slides, and card copy that is
        // revealed on hover. Anything else at opacity 0 is a real fault.
        // Intentionally hidden: inactive slider slides, the hero crossfade
        // image pair, hover-reveal card copy, and the styled file input.
        const ok = c => c.closest('.hs-screen,.hs-stage,.hs-t,.seen-stage,.hs-bg,.qt,.upl,.lb,dialog')
          || c.matches('video.manual,article.hs-t');
        const hid = [...el.querySelectorAll('*')].filter(c => getComputedStyle(c).opacity === '0' && !ok(c))
          .map(c => c.tagName.toLowerCase() + '.' + (c.className || '').toString().split(' ')[0]);
        const h1 = el.querySelector('h1,h2,h3');
        const media = el.querySelectorAll('img[src],video[src],svg,canvas,source').length;
        return { tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 34), media,
                 h: Math.round(r.height), text: el.innerText.replace(/\s+/g, ' ').trim().length,
                 hidden: [...new Set(hid)].join(','), head: h1 ? h1.innerText.trim().slice(0, 38) : '(no heading)' };
      });
    });
    console.log('\n== ' + name);
    for (const r of rows) {
      // A band is only empty if it has neither text nor media.
      const flag = (r.h > 200 && r.text < 40 && r.media === 0) ? '  <-- EMPTY BAND' : (r.hidden ? '  <-- HIDDEN CONTENT' : '');
      console.log(`  ${String(r.h).padStart(5)}px text:${String(r.text).padStart(5)}  ${r.tag}.${r.cls.padEnd(20)} "${r.head}"${r.hidden ? '  hidden:[' + r.hidden + ']' : ''}${flag}`);
      if (flag) bad.push(`${name}: ${r.tag}.${r.cls}${flag}`);
    }
  }
  console.log('\n' + (bad.length ? 'PROBLEMS:\n' + bad.join('\n') : 'no empty bands, no hidden content, no script errors'));
  await b.close();
  srv.close();
})();
