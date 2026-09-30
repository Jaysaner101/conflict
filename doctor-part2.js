/* doctor.js, part 2: CSS, JS and rendered-page checks. */
const fs = require('fs'), path = require('path');
const D = require('./doctor.js');
const { problems, fail, warn, liquidFiles, read, glob } = D;

// Inline <style> blocks count as CSS; some templates carry their own.
const inlineCss = liquidFiles.map(f => (read(f).match(/<style[\s\S]*?<\/style>/g) || []).join('\n')).join('\n');
const css = (fs.existsSync('assets/base.css') ? read('assets/base.css') : '') + '\n' + inlineCss;
const js  = fs.existsSync('assets/theme.js') ? read('assets/theme.js') : '';

/* 10 A class used in markup with no CSS rule anywhere. This shipped four times
 *  (.skip visible on every page, .btn2 unstyled buttons, .visually-hidden
 *  showing as body text, a lightbox with no layout). */
{
  const cssClasses = new Set();
  for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssClasses.add(m[1]);
  const used = new Map();
  for (const f of liquidFiles)
    for (const m of read(f).matchAll(/class="([^"{}]+)"/g))
      for (const c of m[1].split(/\s+/).filter(Boolean))
        if (!used.has(c)) used.set(c, f);
  // A class JS only ever uses as a selector or toggles is a behaviour hook and
  // is allowed to carry no styling.
  const jsHook = c => new RegExp(`[.'"\`]${c}\\b`).test(js);
  for (const [c, f] of used)
    if (!cssClasses.has(c) && !jsHook(c))
      fail('class-no-css', f, `class "${c}" is used in markup but has no CSS rule`);
}

/* 11 A function called but never defined. This shipped: sendForm() was the
 *  only path for quote requests and threw on every submit. */
{
  const defined = new Set();
  for (const m of js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
  for (const m of js.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) defined.add(m[1]);
  for (const m of js.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function/g)) defined.add(m[1]);
  const builtins = new Set(['if','for','while','switch','catch','return','typeof','function','await','new','get','set','of','in','do','else','try','Promise','Array','Object','String','Number','Boolean','Math','JSON','Date','Image','FormData','URL','Error','parseInt','parseFloat','isNaN','isFinite','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','cancelAnimationFrame','fetch','console','document','window','matchMedia','addEventListener','removeEventListener','dispatchEvent','getComputedStyle','scrollTo','confirm','alert','prompt','IntersectionObserver','MutationObserver','ResizeObserver','CustomEvent','Event','Set','Map','WeakMap','RegExp','Blob','File','FileReader','decodeURIComponent','encodeURIComponent','structuredClone','queueMicrotask','not','is','where','has']);
  // Scan with string literals, template literals, regexes and comments removed,
  // so CSS selector text like ':not(' is never mistaken for a call.
  const code = js
    .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
  for (const m of code.matchAll(/(?:^|[^.\w$'"`])([a-z_$][\w$]*)\s*\(/g)) {
    const n = m[1];
    if (builtins.has(n) || defined.has(n)) continue;
    // Skip locals: only flag names that never appear as a binding at all.
    if (new RegExp(`(?:const|let|var|function)\\s+${n}\\b|\\b${n}\\s*=\\s*(?:\\(|function|async)|\\(\\s*${n}\\s*[,)=]|,\\s*${n}\\s*[,)=]|\\b${n}\\s*=>`).test(code)) continue;
    fail('undefined-function', 'assets/theme.js', `calls ${n}(), which is never defined in the theme`);
  }
}

/* 12 [RENDER] Rendered-page checks. These need `node render.js` to have run. */
const pages = glob('preview').filter(f => f.endsWith('.html'));
if (!pages.length) {
  warn('render', 'preview/', 'no rendered pages found — run `node render.js` for the render-stage checks');
} else {
  for (const f of pages) {
    const h = read(f), name = f.replace(/^preview\//, '');

    // Dead links: a CTA the merchant configured that goes nowhere. This shipped
    // on every primary button on the home page.
    const dead = [...h.matchAll(/<a[^>]*href="(#|)"[^>]*>([\s\S]{0,80}?)<\/a>/g)]
      .map(m => m[2].replace(/<[^>]+>/g, ' ').trim().slice(0, 40)).filter(Boolean);
    if (dead.length) fail('dead-link', name, `${dead.length} link(s) with no destination: ${[...new Set(dead)].slice(0, 5).join(', ')}`);

    // Duplicate ids break every getElementById and any label/for pairing.
    const ids = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dupes.length) fail('duplicate-id', name, 'duplicate id(s): ' + [...new Set(dupes)].join(', '));

    // A label pointing at nothing names no field.
    const idSet = new Set(ids);
    for (const m of h.matchAll(/<label[^>]*\sfor="([^"]+)"/g))
      if (!idSet.has(m[1])) fail('label-orphan', name, `<label for="${m[1]}"> has no matching element`);

    // An input with no label, aria-label or wrapping label is unnamed for
    // screen readers. Placeholders are not labels.
    for (const m of h.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
      const attrs = m[2];
      if (/type="(hidden|submit|button|image)"/.test(attrs)) continue;
      const idm = attrs.match(/\sid="([^"]+)"/);
      const labelled = (idm && new RegExp(`<label[^>]*for="${idm[1]}"`).test(h)) || /aria-label(?:ledby)?=/.test(attrs);
      if (!labelled) {
        const before = h.slice(Math.max(0, m.index - 220), m.index);
        if (!/<label[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(before))
          fail('input-unlabelled', name, `<${m[1]}> ${(attrs.match(/name="([^"]+)"/) || [, '?'])[1]} has no label or aria-label`);
      }
    }

    for (const m of h.matchAll(/<img\b([^>]*)>/g))
      if (!/\balt=/.test(m[1])) fail('img-no-alt', name, 'an <img> has no alt attribute');

    // role="slider" etc. without the properties the role requires.
    for (const m of h.matchAll(/role="slider"([^>]*)>/g))
      if (!/aria-valuenow/.test(m[1]) || !/tabindex/.test(m[1]))
        fail('aria-incomplete', name, 'role="slider" without tabindex and aria-valuenow is not keyboard operable');
  }
}

/* 13 Assets nothing references. Reported, not failed — they bloat the upload. */
{
  const all = fs.existsSync('assets') ? fs.readdirSync('assets') : [];
  const hay = [...liquidFiles, 'assets/base.css', 'assets/theme.js'].filter(fs.existsSync).map(read).join('\n');
  const dead = all.filter(a => !hay.includes(a));
  if (dead.length) {
    const bytes = dead.reduce((n, a) => n + fs.statSync(path.join('assets', a)).size, 0);
    warn('dead-asset', 'assets/', `${dead.length} file(s) referenced by nothing (${(bytes / 1048576).toFixed(1)}MB): ${dead.slice(0, 6).join(', ')}${dead.length > 6 ? ', …' : ''}`);
  }
}

/* ---- report ---- */
const order = { FAIL: 0, WARN: 1 };
problems.sort((a, b) => order[a.sev] - order[b.sev] || a.check.localeCompare(b.check));
const fails = problems.filter(p => p.sev === 'FAIL');
if (!problems.length) console.log('doctor: no problems found');
else {
  let last = '';
  for (const p of problems) {
    if (p.check !== last) { console.log(`\n${p.sev === 'FAIL' ? '✗' : '!'} ${p.check}`); last = p.check; }
    console.log(`    ${p.file}: ${p.msg}`);
  }
  console.log(`\n${fails.length} failure(s), ${problems.length - fails.length} warning(s)`);
}
process.exit(fails.length ? 1 : 0);
