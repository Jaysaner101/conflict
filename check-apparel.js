#!/usr/bin/env node
/*
 * check-apparel.js — is every apparel product actually sellable and wired to
 * the apparel page? Store data, not theme files, so doctor.js can't see it.
 *
 * The fault behind it: the first three apparel products had no sizes at all.
 * Each was one "Default Title" variant, so a tee could be bought with no size.
 *
 * Usage: save the response of this Admin GraphQL query to a file, then
 *   node check-apparel.js products.json
 *
 *   products(first: 50, query: "tag:apparel") { nodes {
 *     handle title productType templateSuffix status tags
 *     options { name values }
 *     media(first: 1) { nodes { id } }  mediaCount { count }
 *     shipsAs: metafield(namespace: "custom", key: "ships_as") { value }
 *     sizeGuide: metafield(namespace: "custom", key: "size_guide") { value }
 *     story: metafield(namespace: "custom", key: "design_story") { value }
 *     variants(first: 100) { nodes { title availableForSale } }
 *   } }
 */
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync(process.argv[2] || 'products.json', 'utf8'));
const nodes = raw?.data?.products?.nodes || raw?.products?.nodes || raw;
let bad = 0;
for (const p of nodes) {
  const issues = [];
  const isCap = /cap|hat/i.test(p.productType || '') || /cap|hat|trucker/i.test(p.title);
  const opt = n => (p.options || []).find(o => o.name.toLowerCase().includes(n));
  if (p.templateSuffix !== 'apparel') issues.push('not on the apparel template (templateSuffix is ' + JSON.stringify(p.templateSuffix) + ')');
  if (!(p.tags || []).includes('apparel')) issues.push('missing the "apparel" tag, so it is not in the apparel collection');
  if ((p.options || []).some(o => o.values.includes('Default Title'))) issues.push('single "Default Title" variant — no colour or size to choose');
  if (!isCap && !opt('size')) issues.push('no Size option');
  if (!isCap && !p.sizeGuide?.value) issues.push('no size guide linked');
  if (!p.shipsAs?.value) issues.push('"Ships as" not set (badge falls back to Made to order)');
  if (!p.story?.value) issues.push('no "The design" copy');
  const media = p.mediaCount?.count ?? (p.media?.nodes || []).length;
  if (media < 2) issues.push(`only ${media} image(s) — needs front and back at least`);
  if (!(p.productType || '').trim()) issues.push('no product type, so the type chips cannot file it');
  const avail = (p.variants?.nodes || []).filter(v => v.availableForSale).length;
  if (!avail) issues.push('no variant can be bought');
  if (issues.length) { bad++; console.log(`✗ ${p.handle}\n    ${issues.join('\n    ')}`); }
  else console.log(`✓ ${p.handle}  (${(p.variants?.nodes || []).length} variants, ${media} images)`);
}
console.log(`\n${nodes.length} apparel product(s), ${bad} with problems`);
process.exit(bad ? 1 : 0);
