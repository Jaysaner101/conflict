#!/usr/bin/env node
/*
 * linkcheck.js — every link on every rendered page, checked against what the
 * store actually contains. store-inventory.json holds the live handles.
 */
const fs = require('fs'), path = require('path');
const inv = JSON.parse(fs.readFileSync('store-inventory.json', 'utf8'));
const pages = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f);
  fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })('preview');

const internal = new Map(), external = new Map(), bad = [];
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8');
  const name = f.replace(/^preview\//, '');
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]*)"/g)) {
    const href = m[1].trim();
    if (!href || href === '#') { bad.push(`${name}: link with no destination`); continue; }
    if (/^(mailto:|tel:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) { external.set(href, (external.get(href)||new Set()).add(name)); continue; }
    internal.set(href, (internal.get(href) || new Set()).add(name));
  }
}

const ok = new Set(['/', '/cart', '/search', '/collections/all', '/account', '/account/login',
                    '/account/register', '/account/logout', '/account/addresses', '/blogs/news']);
const problems = [];
for (const [href, on] of internal) {
  const [p] = href.split('?');
  if (ok.has(p) || p.startsWith('#')) continue;
  let m;
  if ((m = p.match(/^\/collections\/([^/]+)$/))) {
    if (!inv.collections.includes(m[1])) problems.push([href, 'no such collection', [...on]]);
  } else if ((m = p.match(/^\/products\/([^/]+)$/))) {
    if (!inv.products.includes(m[1])) problems.push([href, 'no such product', [...on]]);
  } else if ((m = p.match(/^\/pages\/([^/]+)$/))) {
    if (!inv.pages.includes(m[1])) problems.push([href, 'no such page', [...on]]);
  } else if (/^\/(account|blogs|policies|apps)\b/.test(p)) {
    // handled by Shopify
  } else if (p.startsWith('/')) {
    problems.push([href, 'unrecognised internal path', [...on]]);
  }
}

console.log(`pages: ${pages.length}   internal links: ${internal.size}   external links: ${external.size}\n`);
if (bad.length) { console.log('LINKS WITH NO DESTINATION:'); [...new Set(bad)].forEach(b => console.log('  ' + b)); console.log(); }
if (problems.length) {
  console.log('INTERNAL LINKS THAT DO NOT RESOLVE ON THIS STORE:');
  for (const [h, why, on] of problems) console.log(`  ${h}  — ${why}  (on ${on.slice(0,3).join(', ')})`);
} else console.log('✓ every internal link resolves to a real collection, product or page');

// Every shopify:// image reference must point at a file that exists, and every
// file_url video must too — a missing one is a blank panel on the live store.
const missingMedia = [];
for (const f of fs.readdirSync('templates').filter(x => x.endsWith('.json'))) {
  const body = fs.readFileSync(path.join('templates', f), 'utf8');
  for (const m of body.matchAll(/shopify:\/\/shop_images\/([^"']+)/g))
    if (!inv.files.includes(m[1])) missingMedia.push(`templates/${f}: image "${m[1]}" is not in Shopify Files`);
  for (const m of body.matchAll(/"(?:clip|video)"\s*:\s*"([^"]+\.(?:mp4|webm))"/g))
    if (!inv.files.includes(m[1])) missingMedia.push(`templates/${f}: video "${m[1]}" is not in Shopify Files`);
}
if (missingMedia.length) { console.log('\nMEDIA REFERENCED BUT NOT ON THE STORE:'); missingMedia.forEach(x => console.log('  ' + x)); }
else console.log('✓ every image and video reference exists in Shopify Files');

console.log('\nEXTERNAL LINKS:');
for (const [h, on] of [...external].sort()) console.log(`  ${h}  (on ${[...on].slice(0,2).join(', ')})`);
process.exit(problems.length || bad.length || missingMedia.length ? 1 : 0);
