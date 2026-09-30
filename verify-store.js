#!/usr/bin/env node
/*
 * verify-store.js — diff what Shopify actually stored against this repo.
 *
 * The bug that made this necessary: Shopify's theme import silently replaced
 * config/settings_schema.json with `[]` because one string was two characters
 * over a limit. Every local check passed. Nothing in the API response said so.
 * The only way to know is to ask the store what it ended up with.
 *
 * Usage:
 *   1. Query the theme's files (Admin GraphQL):
 *        theme(id: "gid://shopify/OnlineStoreTheme/<id>") {
 *          files(first: 250) { nodes { filename size } }
 *        }
 *   2. Save the response to store-files.json
 *   3. node verify-store.js store-files.json
 */
const fs = require('fs'), path = require('path');

const src = process.argv[2] || 'store-files.json';
if (!fs.existsSync(src)) { console.error(`no ${src} — see the usage note at the top of this file`); process.exit(2); }

let raw = JSON.parse(fs.readFileSync(src, 'utf8'));
// Accept either the raw GraphQL envelope or a bare {filename: size} map.
let store = {};
const nodes = raw?.data?.theme?.files?.nodes || raw?.theme?.files?.nodes || raw?.nodes;
if (Array.isArray(nodes)) for (const n of nodes) store[n.filename] = Number(n.size);
else store = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]));

const DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
const local = {};
for (const d of DIRS) {
  if (!fs.existsSync(d)) continue;
  (function walk(p) {
    for (const f of fs.readdirSync(p)) {
      const q = path.join(p, f);
      fs.statSync(q).isDirectory() ? walk(q) : (local[q] = fs.statSync(q).size);
    }
  })(d);
}

const missing = Object.keys(local).filter(f => !(f in store)).sort();
const extra   = Object.keys(store).filter(f => !(f in local)).sort();
const differs = Object.keys(local).filter(f => f in store && local[f] !== store[f]).sort();

console.log(`repo: ${Object.keys(local).length} files   store: ${Object.keys(store).length} files\n`);
let bad = 0;

if (missing.length) { bad++; console.log('✗ IN REPO BUT NOT ON THE STORE — Shopify dropped these:'); missing.forEach(f => console.log('    ' + f)); }
if (extra.length)   { console.log('! ON THE STORE BUT NOT IN THE REPO (left over from an earlier build):'); extra.forEach(f => console.log('    ' + f)); }

if (differs.length) {
  // A file the store holds as 2-3 bytes is the blanking signature: "[]", "{}".
  const blanked = differs.filter(f => store[f] <= 4 && local[f] > 4);
  const other = differs.filter(f => !blanked.includes(f));
  if (blanked.length) {
    bad++;
    console.log('✗ SILENTLY BLANKED BY SHOPIFY — the file was rejected on import and replaced with an empty value:');
    blanked.forEach(f => console.log(`    ${f}: repo ${local[f]} bytes -> store ${store[f]} bytes`));
    console.log('    Upsert the file directly (themeFilesUpsert) to see the validation error Shopify will not give you on import.');
  }
  if (other.length) {
    console.log('! SIZE DIFFERS (often harmless — Shopify rewrites settings_data.json and adds a header comment):');
    other.forEach(f => console.log(`    ${f}: repo ${local[f]} -> store ${store[f]}`));
  }
}

if (!bad && !extra.length && !differs.length) console.log('✓ every file on the store matches the repo');
else if (!bad) console.log('\n✓ no dropped or blanked files');
process.exit(bad ? 1 : 0);
