#!/usr/bin/env node
/*
 * doctor.js — static fault-finder for this theme.
 *
 * Every check here exists because the fault it looks for actually shipped.
 * The governing lesson: validating our own files is not the same as knowing
 * what Shopify accepts or what a visitor sees. Checks marked [SERVER] guard
 * limits Shopify enforces silently; [RENDER] checks read preview/ and need
 * `node render.js` to have run.
 */
const fs = require('fs'), path = require('path'), glob = p => {
  const out = [];
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const q = path.join(d, f);
      fs.statSync(q).isDirectory() ? walk(q) : out.push(q);
    }
  })(p);
  return out;
};

const problems = [];
const fail = (check, file, msg) => problems.push({ sev: 'FAIL', check, file, msg });
const warn = (check, file, msg) => problems.push({ sev: 'WARN', check, file, msg });

const liquidFiles = [...glob('sections'), ...glob('snippets'), ...glob('templates'), ...glob('layout')]
  .filter(f => f.endsWith('.liquid'));
const read = f => fs.readFileSync(f, 'utf8');
const schemaOf = f => {
  const m = read(f).match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { fail('schema-json', f, 'schema is not valid JSON: ' + e.message); return null; }
};

/* 1 [SERVER] settings_schema limits. Shopify replaces the whole file with []
 *  if any of these is violated, with no error anywhere. This shipped. */
{
  const f = 'config/settings_schema.json';
  let d;
  try { d = JSON.parse(read(f)); } catch (e) { fail('settings-schema', f, 'invalid JSON: ' + e.message); d = null; }
  if (Array.isArray(d)) {
    if (!d.length) fail('settings-schema', f, 'file is an empty array — Shopify blanks it on a validation failure');
    const info = d[0] || {};
    if (info.name !== 'theme_info') fail('settings-schema', f, 'first group must be theme_info');
    for (const [k, lim] of [['theme_name', 25], ['theme_author', 25], ['theme_version', 25]]) {
      const v = info[k] || '';
      if (v.length > lim) fail('settings-schema', f, `${k} is ${v.length} chars, Shopify's limit is ${lim}: "${v}"`);
    }
    const seen = new Set();
    for (const g of d) for (const s of (g.settings || [])) {
      if (!s.id) continue;
      if (seen.has(s.id)) fail('settings-schema', f, 'duplicate setting id: ' + s.id);
      seen.add(s.id);
    }
  }
}

/* 2 render/section targets exist. */
for (const f of liquidFiles) {
  const src = read(f);
  for (const m of src.matchAll(/\{%-?\s*render\s+'([^']+)'/g))
    if (!fs.existsSync(`snippets/${m[1]}.liquid`)) fail('missing-snippet', f, `renders '${m[1]}' but snippets/${m[1]}.liquid does not exist`);
  for (const m of src.matchAll(/\{%-?\s*section\s+'([^']+)'/g))
    if (!fs.existsSync(`sections/${m[1]}.liquid`)) fail('missing-section', f, `sections '${m[1]}' but sections/${m[1]}.liquid does not exist`);
  if (/\{%-?\s*include\s/.test(src)) warn('deprecated', f, 'uses {% include %}; Shopify deprecated it in favour of {% render %}');
}

/* 3 asset_url targets exist. A missing one is a broken image on the live site
 *  and cannot fail locally, because asset_url always returns a valid-looking URL. */
{
  const have = new Set(fs.existsSync('assets') ? fs.readdirSync('assets') : []);
  for (const f of liquidFiles)
    for (const m of read(f).matchAll(/'([^']+)'\s*\|\s*asset_url/g))
      if (!have.has(m[1])) fail('missing-asset', f, `asset_url '${m[1]}' but assets/${m[1]} does not exist`);
}

/* 4 [SERVER] `where` with a dotted path. Shopify's where does item[property]
 *  and cannot walk 'settings.x'; liquidjs can, so this passes locally and
 *  returns an empty array on the live store. This shipped. */
for (const f of liquidFiles)
  for (const m of read(f).matchAll(/\|\s*where:\s*'([^']*\.[^']*)'/g))
    fail('where-dotted-path', f, `where: '${m[1]}' — Shopify's where cannot walk a dotted path and returns nothing. Filter inside a loop instead.`);

/* 5 Reassigning a for-loop variable inside its own loop. Breaks iteration. */
for (const f of liquidFiles) {
  const src = read(f);
  for (const m of src.matchAll(/\{%-?\s*for\s+(\w+)\s+in\s+[^%]+%\}([\s\S]{0,900}?)\{%-?\s*endfor/g))
    if (new RegExp(`assign\\s+${m[1]}\\s*=`).test(m[2]))
      fail('loop-var-reassigned', f, `'${m[1]}' is reassigned inside its own {% for ${m[1]} in ... %}, which breaks iteration`);
}

/* 6 Global settings.X referenced but never defined — renders blank forever. */
{
  let defined = new Set();
  try {
    for (const g of JSON.parse(read('config/settings_schema.json')))
      for (const s of (g.settings || [])) if (s.id) defined.add(s.id);
  } catch (e) { /* reported above */ }
  for (const f of liquidFiles)
    for (const m of read(f).matchAll(/(^|[^.\w])settings\.([a-z_0-9]+)/g))
      if (!defined.has(m[2]))
        fail('undefined-setting', f, `uses settings.${m[2]}, which is not declared in settings_schema.json — it renders blank and the merchant cannot set it`);
}

/* 7 Section schemas: ids unique, labels present, presets reference real blocks. */
for (const f of glob('sections').filter(x => x.endsWith('.liquid'))) {
  const sch = schemaOf(f);
  if (!sch) { if (!/\{%\s*schema/.test(read(f))) warn('no-schema', f, 'section has no {% schema %}'); continue; }
  if ((sch.name || '').length > 25) fail('schema-name', f, `schema name is ${sch.name.length} chars; Shopify's limit is 25`);
  const ids = new Set();
  for (const s of (sch.settings || [])) {
    if (s.type === 'header' || s.type === 'paragraph') continue;
    if (!s.id) { fail('schema-setting', f, 'setting with no id'); continue; }
    if (ids.has(s.id)) fail('schema-setting', f, 'duplicate setting id: ' + s.id);
    ids.add(s.id);
    if (!s.label) warn('schema-setting', f, `setting '${s.id}' has no label`);
  }
  const blockTypes = new Set((sch.blocks || []).map(b => b.type));
  for (const b of (sch.blocks || [])) {
    if (!b.type) fail('schema-block', f, 'block with no type');
    const bids = new Set();
    for (const s of (b.settings || [])) {
      if (s.type === 'header' || s.type === 'paragraph' || !s.id) continue;
      if (bids.has(s.id)) fail('schema-block', f, `block '${b.type}' has duplicate setting id: ${s.id}`);
      bids.add(s.id);
    }
  }
  for (const p of (sch.presets || []))
    for (const b of (p.blocks || []))
      if (b.type && !blockTypes.has(b.type))
        fail('schema-preset', f, `preset uses block type '${b.type}', which the schema does not declare`);
}

/* 8 JSON templates line up with the section schemas they configure. */
for (const f of glob('templates').filter(x => x.endsWith('.json'))) {
  let t; try { t = JSON.parse(read(f)); } catch (e) { fail('template-json', f, 'invalid JSON: ' + e.message); continue; }
  for (const k of (t.order || []))
    if (!t.sections || !t.sections[k]) fail('template-order', f, `order references '${k}', which is not in sections`);
  for (const [key, sec] of Object.entries(t.sections || {})) {
    const file = `sections/${sec.type}.liquid`;
    if (!fs.existsSync(file)) { fail('template-section', f, `section '${key}' has type '${sec.type}' with no matching file`); continue; }
    const sch = schemaOf(file); if (!sch) continue;
    const known = new Set((sch.settings || []).map(s => s.id).filter(Boolean));
    for (const k of Object.keys(sec.settings || {}))
      if (!known.has(k)) fail('template-setting', f, `'${key}' sets '${k}', which ${sec.type}'s schema does not declare`);
    const bt = new Set((sch.blocks || []).map(b => b.type));
    for (const [bk, b] of Object.entries(sec.blocks || {})) {
      if (!bt.has(b.type)) { fail('template-block', f, `'${key}' block '${bk}' has type '${b.type}', undeclared in ${sec.type}`); continue; }
      const bsch = (sch.blocks || []).find(x => x.type === b.type);
      const bknown = new Set((bsch.settings || []).map(s => s.id).filter(Boolean));
      for (const k of Object.keys(b.settings || {}))
        if (!bknown.has(k)) fail('template-block-setting', f, `'${key}' block '${bk}' sets '${k}', undeclared on block '${b.type}'`);
    }
    if (sch.max_blocks && Object.keys(sec.blocks || {}).length > sch.max_blocks)
      fail('template-max-blocks', f, `'${key}' has more blocks than ${sec.type}'s max_blocks (${sch.max_blocks})`);
  }
}

/* 9 A section with a preset a merchant can add, whose template ships no blocks,
 *  renders as an empty band. The work gallery shipped this way. */
for (const f of glob('templates').filter(x => x.endsWith('.json'))) {
  let t; try { t = JSON.parse(read(f)); } catch { continue; }
  for (const [key, sec] of Object.entries(t.sections || {})) {
    const file = `sections/${sec.type}.liquid`; if (!fs.existsSync(file)) continue;
    const sch = schemaOf(file); if (!sch || !(sch.blocks || []).length) continue;
    if (!Object.keys(sec.blocks || {}).length)
      warn('empty-section', f, `'${key}' (${sec.type}) accepts blocks but has none, so it renders empty`);
  }
}


/* 9b An attribute that looks like a JS hook but nothing reads. data-bg shipped
 *  this way: the section emitted it, the prototype's reader was never ported,
 *  and the panel rendered flat black. */
{
  // Include inline <script> blocks: some templates carry their own JS.
  const inline = liquidFiles.map(f => (read(f).match(/<script[\s\S]*?<\/script>/g) || []).join('\n')).join('\n');
  const jsSrc = (fs.existsSync('assets/theme.js') ? read('assets/theme.js') : '') + '\n' + inline
              + '\n' + (fs.existsSync('assets/base.css') ? read('assets/base.css') : '');
  const camel = a => a.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const seen = new Set();
  for (const f of liquidFiles)
    for (const m of read(f).matchAll(/\s(data-[a-z][a-z0-9-]*)=/g)) {
      const a = m[1], key = a + '|' + f;
      if (seen.has(key)) continue; seen.add(key);
      if (jsSrc.includes(a) || jsSrc.includes('.' + camel(a)) || jsSrc.includes("'" + camel(a) + "'")) continue;
      warn('orphan-data-attr', f, `emits ${a}, which no JavaScript in the theme reads`);
    }
}


/* 9c Templates the platform expects. A missing one is not a broken reference
 *  inside the repo, so nothing else here would see it — which is how the
 *  contact page and gift_card were missed. store-pages.json (optional) is a
 *  list of the templateSuffix values the store's pages actually use. */
{
  const has = n => fs.existsSync(`templates/${n}.liquid`) || fs.existsSync(`templates/${n}.json`);
  for (const t of ['index','product','collection','list-collections','page','blog','article','cart','search','404','password','gift_card'])
    if (!has(t)) fail('missing-template', 'templates/', `no ${t} template — Shopify renders this route on every store`);
  for (const t of ['account','activate_account','addresses','login','order','register','reset_password'])
    if (!has('customers/' + t)) fail('missing-template', 'templates/customers/', `no customers/${t} template`);
  if (fs.existsSync('store-pages.json')) {
    let suffixes = [];
    try {
      const raw = JSON.parse(read('store-pages.json'));
      const nodes = raw?.data?.pages?.nodes || raw?.pages?.nodes || raw?.nodes || raw;
      suffixes = (Array.isArray(nodes) ? nodes : []).map(p => p.templateSuffix).filter(Boolean);
    } catch (e) { warn('store-pages', 'store-pages.json', 'could not read: ' + e.message); }
    for (const sfx of [...new Set(suffixes)])
      if (!has('page.' + sfx))
        fail('missing-template', 'templates/', `a page on the store uses templateSuffix "${sfx}" but templates/page.${sfx} does not exist`);
  } else {
    warn('store-pages', 'store-pages.json', 'absent — export the store\'s pages { handle templateSuffix } to check suffix coverage');
  }
}


/* 9d A section file that no template uses. apparel-hero and episodes were both
 *  fully built and wired to nothing, so a whole page and the show's episode
 *  list were simply absent from the site. */
{
  const used = new Set();
  for (const f of glob('templates').filter(x => x.endsWith('.json'))) {
    try { for (const sec of Object.values(JSON.parse(read(f)).sections || {})) used.add(sec.type); }
    catch (e) { /* reported elsewhere */ }
  }
  for (const f of [...liquidFiles])
    for (const m of read(f).matchAll(/\{%-?\s*section\s+'([^']+)'/g)) used.add(m[1]);
  for (const f of glob('sections').filter(x => x.endsWith('.liquid'))) {
    const name = path.basename(f, '.liquid');
    if (!used.has(name)) warn('unused-section', f, `no template uses this section — it is built but renders nowhere`);
  }
}

module.exports = { problems, fail, warn, liquidFiles, read, glob, schemaOf };
if (require.main === module) require('./doctor-part2.js');
