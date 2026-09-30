// Parse every Liquid file so a syntax error is caught here rather than by
// Shopify rejecting the whole theme upload.
const { Liquid } = require('liquidjs');
const fs = require('fs'), path = require('path');
const eng = new Liquid({ root: ['sections', 'snippets', 'templates', 'layout'], extname: '.liquid' });

// Shopify block tags liquidjs doesn't know: consume through their end tag.
const block = (name) => ({
  parse(token, remain) {
    const end = 'end' + name;
    let t;
    while ((t = remain.shift())) { if (t.name === end) return; }
    throw new Error(`${name} not closed`);
  },
  render() { return ''; }
});
for (const t of ['schema', 'form', 'paginate', 'style', 'javascript', 'stylesheet'])
  eng.registerTag(t, block(t));
// Shopify inline tags that take no body.
for (const t of ['section', 'sections', 'layout'])
  eng.registerTag(t, { parse() {}, render() { return ''; } });

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (p.includes('node_modules') || p.startsWith('./preview') || p.startsWith('./dist')) continue;
    fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.liquid') && files.push(p);
  }
})('.');

let bad = 0;
for (const f of files) {
  try { eng.parse(fs.readFileSync(f, 'utf8'), f); }
  catch (e) { bad++; console.log('FAIL ' + f + '\n     ' + String(e.message).split('\n')[0]); }
}
console.log(bad ? `\n${bad} of ${files.length} failed to parse` : `all ${files.length} liquid files parse`);
process.exit(bad ? 1 : 0);
