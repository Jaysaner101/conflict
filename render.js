/* Local render harness. Runs the theme's Liquid with mock Shopify data so the
   markup and CSS can be checked without a store. Not a substitute for previewing
   in Shopify, but it catches layout and template faults. */
const { Liquid } = require('liquidjs');
const fs = require('fs'), path = require('path');

const money = c => '$' + (c / 100).toFixed(2).replace(/\.00$/, '');
const eng = new Liquid({ root: [__dirname, path.join(__dirname,'snippets'), path.join(__dirname,'sections')], extname: '.liquid', jsTruthy: true, strictFilters: false, strictVariables: false });

// Shopify filters used by the theme
eng.registerFilter('money', money);
eng.registerFilter('money_without_trailing_zeros', money);
eng.registerFilter('asset_url', n => '/assets/' + n);
eng.registerFilter('file_url', n => '/media/' + n);
eng.registerFilter('image_url', (v) => (typeof v === 'string' ? v : (v && v.src) || '/assets/lid-copville.jpg'));
eng.registerFilter('handleize', s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
eng.registerFilter('handle', s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
eng.registerFilter('at_most', (a, b) => Math.min(a, b));
eng.registerFilter('default_pagination', () => '');
eng.registerFilter('newline_to_br', s => String(s || '').replace(/\n/g, '<br />'));
eng.registerFilter('format_address', a => a ? [a.first_name + ' ' + a.last_name, a.company, a.address1, a.address2, a.city, a.province + ' ' + a.zip, a.country].filter(Boolean).join('<br>') : '');
eng.registerFilter('default_errors', e => e ? '<span>' + e + '</span>' : '');
eng.registerFilter('divided_by', (a, b) => a / b);
eng.registerFilter('prepend', (a, b) => String(b) + String(a));

// {% schema %} carries editor config only — ignore when rendering
eng.registerTag('schema', { parse(tt, remain) { while (remain.length) { const t = remain.shift(); if (t.name === 'endschema') break; } }, render() { return ''; } });
eng.registerTag('form', {
  parse(tt, remain) {
    this.args = tt.args || '';
    const body = []; let t;
    while ((t = remain.shift())) { if (t.name === 'endform') break; body.push(t); }
    this.tpls = this.liquid.parser.parseTokens(body);
  },
  * render(ctx, em) {
    const id = (this.args.match(/id:\s*'([^']+)'/) || [])[1];
    const cls = (this.args.match(/class:\s*'([^']+)'/) || [])[1];
    em.write(`<form${id ? ` id="${id}"` : ''}${cls ? ` class="${cls}"` : ''} method="post">`);
    ctx.push({ form: { posted_successfully: false, errors: null, country: 'United States', province: 'Nebraska',
      set_as_default_checkbox: '<input type="checkbox" name="address[default]">', address: null } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em);
    ctx.pop();
    em.write('</form>');
  }
});

eng.registerTag('paginate', { parse(tt, remain) { this.tpls = []; let t; const body = []; while ((t = remain.shift())) { if (t.name === 'endpaginate') break; body.push(t); } this.tpls = this.liquid.parser.parseTokens(body); }, * render(ctx, em) { yield this.liquid.renderer.renderTemplates(this.tpls, ctx, em); } });

const img = f => ({ src: '/assets/' + f, alt: '' });
const prod = (h, t, cents, tags, im) => ({
  id: h, handle: h, title: t, url: '/products/' + h, price: cents, price_varies: false, available: true,
  tags: tags, type: 'Engraved', description: '<p>Placeholder description.</p>',
  featured_media: img(im), media: [img(im)], images: [img(im)],
  has_only_default_variant: true, variants: [{ id: 1, title: 'Default', price: cents, available: true }],
  selected_or_first_available_variant: { id: 1, title: 'Default', price: cents, available: true },
  options_with_values: [], collections: [{ handle: 'can-lids' }], metafields: { custom: { material: 'Anodized aluminum' } }
});
const products = [
  prod('copville-script-lid', 'Copville script can lid', 2800, ['lids'], 'lid-copville.jpg'),
  prod('oil-slick-folder', 'Oil slick folder', 3800, ['knives'], 'c-folder.webp'),
  prod('tumbler-30', '30 oz tumbler', 3400, ['drinkware'], 'c-tumbler.webp'),
  prod('ammo-can', 'Engraved ammo can', 6800, ['duty'], 'c-ammo-can.webp'),
  prod('bear-lid', 'Bear in area can lid', 2800, ['lids'], 'c-lid-bear.webp'),
  prod('truck-lid', 'A.I.G. truck can lid', 2800, ['lids'], 'c-lid-aig.webp'),
  prod('conflict-tee', 'Conflict tee', 3200, ['apparel'], 'tee-front.jpg'),
  prod('conflict-cap', 'Conflict cap', 3000, ['apparel'], 'cap-mock.jpg'),
];
const menu = items => ({ links: items.map(([title, url]) => ({ title, url, active: false })) });
const settings = JSON.parse(fs.readFileSync('config/settings_data.json')).current;


// --- mocks for the account, search, blog and article templates ---------------
const addr = (id, def) => ({
  id, first_name: 'Murphy', last_name: 'Doe', company: '', address1: '114 S 13th St',
  address2: 'Unit 4', city: 'Omaha', province: 'Nebraska', country: 'United States',
  zip: '68102', phone: '402 555 0117', url: '/account/addresses/' + id,
  street: '114 S 13th St'
});
const addresses = [addr(1), addr(2)];
const orderLine = (title, price, qty, props) => ({
  title, price, quantity: qty, line_price: price * qty,
  product: { url: '/products/copville-script-can-lid' },
  properties: props || []
});
const mockOrder = {
  name: '#1042', created_at: '2026-09-14', financial_status_label: 'Paid',
  fulfillment_status_label: 'Fulfilled', customer_url: '/account/orders/1042',
  subtotal_price: 7400, total_price: 8200,
  line_items: [
    orderLine('Copville script can lid', 2200, 2, [{ first: 'Name to engrave', last: 'M. DOE' }]),
    orderLine('Conflict tee', 3000, 1, [])
  ],
  shipping_methods: [{ title: 'Standard', price: 800 }],
  tax_lines: [{ title: 'NE', rate_percentage: 5.5, price: 0 }],
  billing_address: addresses[0], shipping_address: addresses[0]
};
const mockCustomer = {
  email: 'murphy@example.com', first_name: 'Murphy',
  orders: [mockOrder], addresses, default_address: addresses[0],
  new_address: { id: null, country: 'United States', province: 'Nebraska' }
};
const article = (title, i) => ({
  title, url: '/blogs/news/' + i, published_at: '2026-09-0' + (i + 1),
  excerpt: 'A short standfirst for ' + title + '.',
  excerpt_or_content: 'A short standfirst for ' + title + '.',
  content: '<p>Body copy for ' + title + '.</p><h2>A heading</h2><p>More body copy, long enough to show the measure.</p><ul><li>One</li><li>Two</li></ul>',
  image: null, comments_count: 0, comments: []
});
const articles = [article('Inside a fiber laser run', 0), article('Why the engraving does not wear off', 1), article('Custom orders, start to finish', 2)];

const base = {
  shop: { name: 'Counter Culture Conflict', url: 'https://k0uw8n-4v.myshopify.com', email: 'hello@counterculturecc.com' },
  settings,
  routes: { root_url: '/', cart_url: '/cart', all_products_collection_url: '/collections/all',
    search_url: '/search', account_url: '/account', account_login_url: '/account/login',
    account_logout_url: '/account/logout', account_register_url: '/account/register',
    account_addresses_url: '/account/addresses' },
  request: { locale: { iso_code: 'en' } },
  cart: { item_count: 0, items: [], total_price: 0 },
  linklists: {
    'main-menu': menu([['Home','/'],['Shop','/collections/all'],['Apparel','/collections/apparel'],['Custom and bulk','/pages/custom-and-bulk'],['The work','/pages/the-work'],['The show','/pages/the-show'],['Murphy','/pages/murphy']]),
    'footer': menu([['Custom and bulk','/pages/custom-and-bulk'],['Search','/search']]),
    'footer-shop': menu([['Can lids','/collections/can-lids'],['Knives','/collections/knives'],['Tumblers','/collections/tumblers'],['Duty gear','/collections/duty-gear'],['Apparel','/collections/apparel']]),
    'footer-about': menu([['Murphy','/pages/murphy'],['The show','/pages/the-show'],['The work','/pages/the-work'],['Allies','/pages/allies']]),
  }, canonical_url: '/', page_title: 'Counter Culture Conflict', page_description: '',
  content_for_header: '', collections: [], paginate: { pages: 1 }, form: { posted_successfully: false },
  customer: mockCustomer, order: mockOrder,
  gift_card: { balance: 5000, initial_value: 5000, code: 'abcd1234efgh5678', enabled: true,
               expired: false, expires_on: null, qr_identifier: 'qr', currency: 'USD' },
  blog: { title: 'From the bench', url: '/blogs/news', articles, all_tags: ['process', 'gear'], comments_enabled: false },
  article: articles[0],
  page: { title: 'Shipping and returns', content: '<p>Orders ship in about three days.</p><h2>Returns</h2><p>Engraved pieces are made to order.</p>' },
  search: { performed: true, terms: 'can lid', results_count: 2, results: products.slice(0, 2) },
  country_option_tags: '<option value="United States">United States</option><option value="Canada">Canada</option>',
  current_tags: null,
  product: products[0], collection: { title: 'The shop', handle: 'all', products, products_count: products.length, description: '', metafields: { custom: {} } },
};

function sectionCtx(name, cfg) {
  const file = fs.readFileSync(path.join('sections', name + '.liquid'), 'utf8');
  const m = file.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  const schema = m ? JSON.parse(m[1]) : { settings: [], blocks: [] };
  const defs = {}; (schema.settings || []).forEach(s => { if ('default' in s) defs[s.id] = s.default; });
  const s = Object.assign({}, defs, (cfg && cfg.settings) || {});
  // A `link_list` setting stores a menu handle, but Shopify resolves it to the
  // menu object itself. Resolve it the same way here, or the harness renders
  // every menu column identically and hides real wiring mistakes.
  for (const def of (schema.settings || [])) {
    if (def.type === 'link_list' && typeof s[def.id] === 'string') {
      s[def.id] = base.linklists[s[def.id]] || { links: [] };
    }
  }
  let blocks = [];
  if (cfg && cfg.blocks) {
    const order = cfg.block_order || Object.keys(cfg.blocks);
    blocks = order.map(k => {
      const b = cfg.blocks[k]; const bs = (schema.blocks || []).find(x => x.type === b.type) || { settings: [] };
      const bd = {}; (bs.settings || []).forEach(x => { if ('default' in x) bd[x.id] = x.default; });
      return { type: b.type, id: k, shopify_attributes: '', settings: Object.assign({}, bd, b.settings || {}) };
    });
  } else if (schema.presets && schema.presets[0] && schema.presets[0].blocks) {
    blocks = schema.presets[0].blocks.map((b, i) => {
      const bs = (schema.blocks || []).find(x => x.type === b.type) || { settings: [] };
      const bd = {}; (bs.settings || []).forEach(x => { if ('default' in x) bd[x.id] = x.default; });
      return { type: b.type, id: 'b' + i, shopify_attributes: '', settings: bd };
    });
  }
  if (s.collection !== undefined) s.collection = base.collection;
  return { id: name, settings: s, blocks, blocks_size: blocks.length };
}

eng.registerTag('section', {
  parse(tt) { this.name = tt.args.replace(/['"]/g, '').trim(); },
  * render(ctx, em) {
    const cfg = (settings.sections || {})[this.name];
    const html = yield eng.renderFile(path.join('sections', this.name), Object.assign({}, ctx.getAll(), { section: sectionCtx(this.name, cfg) }));
    em.write(html);
  }
});

async function renderTemplate(name) {
  let inner = '';
  const jsonPath = path.join('templates', name + '.json');
  const liquidPath = path.join('templates', name + '.liquid');
  if (fs.existsSync(jsonPath)) {
    const t = JSON.parse(fs.readFileSync(jsonPath));
    for (const key of t.order) {
      const cfg = t.sections[key];
      inner += await eng.renderFile(path.join('sections', cfg.type), Object.assign({}, base, { section: sectionCtx(cfg.type, cfg) }));
    }
  } else if (fs.existsSync(liquidPath)) {
    const raw = fs.readFileSync(liquidPath, 'utf8');
    inner = await eng.renderFile(liquidPath, base);
    // {% layout none %} means the template is the whole document.
    if (/\{%-?\s*layout\s+none\s*-?%\}/.test(raw)) return inner;
  } else { throw new Error('no template ' + name); }
  return eng.renderFile('layout/theme', Object.assign({}, base, { content_for_layout: inner, template: { name } }));
}

(async () => {
  const out = 'preview'; fs.mkdirSync(out, { recursive: true });
  const targets = process.argv.slice(2).length ? process.argv.slice(2)
    : ['index', 'product', 'collection', 'cart', 'page.custom-and-bulk', 'page.work', 'page.show', 'page.murphy', 'page.allies',
       '404', 'search', 'page', 'blog', 'article', 'password', 'list-collections',
       'customers/account', 'customers/addresses', 'customers/login', 'customers/register',
       'customers/order', 'customers/reset_password', 'customers/activate_account',
       'page.contact', 'gift_card'];
  for (const t of targets) {
    try {
      const html = await renderTemplate(t);
      const dest = path.join(out, t + '.html');
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, html);
      console.log('ok   ', t, html.length, 'bytes');
    } catch (e) { console.log('FAIL ', t, '->', String(e.message).slice(0, 200)); }
  }
})();
