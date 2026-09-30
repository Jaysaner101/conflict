const { chromium } = require('playwright');
const serve = require('./serve.js');

(async () => {
  const srv = await serve('preview');
  const b = await chromium.launch();
  const pages = ['index','collection','product','cart','page.apparel','page.show','page.work','page.murphy',
    'page.allies','page.custom-and-bulk','page.contact','search','404','list-collections','blog','article',
    'page','password','gift_card','customers/login','customers/register','customers/account',
    'customers/addresses','customers/order','customers/reset_password','customers/activate_account'];
  const errs = [];
  for (const w of [[1288,725,'d'],[390,844,'m']]) {
    const ctx = await b.newContext({ viewport:{width:w[0],height:w[1]}, isMobile:w[0]<800, hasTouch:w[0]<800 });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(w[2]+' '+String(e).slice(0,90)));
    // The sandbox cannot reach fonts.googleapis.com, so every page would stall
    // waiting on it. Abort external requests; they are irrelevant to layout here.
    // NOTE: this means the display webfont is NOT applied in local screenshots —
    // headings fall back. The webfont can only be verified on the live store.
    await pg.route('**', r => /^https?:\/\/(?!127\.0\.0\.1|localhost)/.test(r.request().url()) ? r.abort() : r.continue());
    for (const p of pages) {
      await pg.goto(srv.base + '/'+p+'.html', {waitUntil:'networkidle'}).catch(()=>{});
      // Scroll the page so IntersectionObserver fires: .rv sections are
      // opacity:0 until revealed, so an unscrolled fullPage shot is blank.
      await pg.evaluate(async () => {
        // 'instant' matters: html has scroll-behavior:smooth, so a plain
        // scrollTo animates and the loop outruns it without ever scrolling.
        document.documentElement.style.scrollBehavior = 'auto';
        const step = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise(r => setTimeout(r, 90));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }).catch(e => errs.push(w[2]+' scroll failed on '+p+': '+String(e.message).slice(0,60)));
      await pg.waitForTimeout(700);
      const over = await pg.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1).catch(()=>false);
      if (over) errs.push(w[2]+' overflow: '+p);
      await pg.screenshot({path:`shots/${w[2]}_${p.replace('/','-')}.jpg`, type:'jpeg', quality:72, fullPage:true});
    }
    await ctx.close();
  }
  console.log(errs.length ? 'ISSUES:\n'+errs.join('\n') : 'no script errors, no overflow');
  await b.close();
  srv.close();
})();
