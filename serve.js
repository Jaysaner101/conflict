/*
 * serve.js — a static server for preview/, started by the tool that needs it.
 *
 * shot.js and audit.js used to depend on a server someone had started by hand
 * on port 8799. When it died, pages failed to load and the tools reported
 * "execution context destroyed" or, worse, rendered unstyled pages that looked
 * like real layout bugs. A harness must not depend on invisible state.
 */
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml',
  '.gif':'image/gif', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm', '.woff2':'font/woff2',
  '.woff':'font/woff', '.json':'application/json', '.txt':'text/plain' };

module.exports = function serve(root = 'preview') {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(url.parse(req.url).pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, p);
    if (!f.startsWith(path.resolve(root)) && !path.resolve(f).startsWith(path.resolve(root))) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({
    base: 'http://127.0.0.1:' + srv.address().port,
    close: () => srv.close()
  })));
};
