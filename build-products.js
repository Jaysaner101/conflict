// Turn the approved prototype catalogue into Shopify productSet inputs.
const fs = require('fs');
const P = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));
const FILES = JSON.parse(fs.readFileSync('files.json', 'utf8')); // { 'lid-copville.jpg': 'gid://...' }

const TYPE = { lids: 'Can lid', knives: 'Knife', drinkware: 'Tumbler', duty: 'Duty gear', apparel: 'Apparel' };
const missingFiles = [];

const inputs = P.map(p => {
  const files = (p.ph || []).map(f => {
    const id = FILES[f];
    if (!id) { missingFiles.push(`${p.h} -> ${f}`); return null; }
    return { id, alt: p.n };
  }).filter(Boolean);

  const tags = [p.c];
  if (p.tag) tags.push(p.tag.toLowerCase().replace(/\s+/g, '-'));

  const base = {
    handle: p.h,
    title: p.n,
    descriptionHtml: `<p>${p.d}</p>`,
    productType: TYPE[p.c] || 'Engraved',
    vendor: 'Counter Culture Conflict',
    status: 'ACTIVE',
    tags,
    files,
    metafields: [{ namespace: 'custom', key: 'material', type: 'single_line_text_field', value: p.mat }],
    seo: { title: `${p.n} | Counter Culture Conflict`, description: p.d.slice(0, 155) }
  };

  // Inventory is untracked: every piece is engraved to order, so nothing
  // should ever read as out of stock.
  const inv = { tracked: false };

  if (p.opt) {
    base.productOptions = [{ name: p.opt.label, values: p.opt.vals.map(v => ({ name: v[0] })) }];
    base.variants = p.opt.vals.map(([name, price], i) => ({
      optionValues: [{ optionName: p.opt.label, name }],
      price: String(price), position: i + 1,
      sku: `${p.h}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      inventoryItem: inv, inventoryPolicy: 'CONTINUE', taxable: true
    }));
  } else {
    base.productOptions = [{ name: 'Title', values: [{ name: 'Default Title' }] }];
    base.variants = [{
      optionValues: [{ optionName: 'Title', name: 'Default Title' }],
      price: String(p.p), sku: p.h,
      inventoryItem: inv, inventoryPolicy: 'CONTINUE', taxable: true
    }];
  }
  return base;
});

fs.writeFileSync('product-inputs.json', JSON.stringify(inputs, null, 1));
console.log('built', inputs.length, 'product inputs');
console.log('missing files:', missingFiles.length ? missingFiles : 'none');
console.log('variants total:', inputs.reduce((n, i) => n + i.variants.length, 0));
