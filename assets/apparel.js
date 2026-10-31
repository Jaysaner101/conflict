/* Apparel product page. Loaded only by sections/apparel-product.liquid.
   The form always posts natively (name="id"), so if this file fails to load the
   page still sells: the hidden input simply needs a variant, which is why the
   button stays as "Choose a size" until one is set. */
(function () {
'use strict';
const root = document.getElementById('apd');
if (!root) return;
const $ = (s, r = root) => r.querySelector(s);
const $$ = (s, r = root) => [...r.querySelectorAll(s)];

let variants = [];
try { variants = JSON.parse(document.getElementById('apdVariants').textContent); } catch (e) { return; }
const cPos = +root.dataset.colourPos || 0, sPos = +root.dataset.sizePos || 0;
const groups = [...new Set($$('[data-pos]').map(b => +b.dataset.pos))].sort();
const chosen = {};                      // position -> value
const idIn = $('#apdId'), add = $('#apdAdd'), price = $('#apdPrice');
const barBtn = $('#apdBarBtn'), barPrice = $('#apdBarPrice');

/* ---- which variant do the current choices describe? ---- */
const match = () => variants.find(v => groups.every(p => v.o[p - 1] === chosen[p]));
const anyAvail = (pos, val) => variants.some(v => v.o[pos - 1] === val && v.a &&
  groups.every(p => p === pos || chosen[p] === undefined || v.o[p - 1] === chosen[p]));

/* ---- gallery ---- */
const slides = $$('.apd-slide[data-media]'), thumbs = $$('.apd-th');
// An image that is some variant's own picture belongs to that variant's colour.
const ownerColour = {};
if (cPos) variants.forEach(v => { if (v.m) ownerColour[v.m] = v.o[cPos - 1]; });
let shownIdx = 0, fromScroll = false;
const snap = matchMedia('(max-width:1020px)');
function visibleSlides() {
  return slides.filter(s => {
    const owner = ownerColour[s.dataset.media];
    return !owner || !chosen[cPos] || owner === chosen[cPos];
  });
}
function show(mediaId) {
  slides.forEach(s => {
    const on = s.dataset.media === String(mediaId);
    s.classList.toggle('on', on);
    if (s.tagName === 'VIDEO') { on ? s.play().catch(() => {}) : s.pause(); }
  });
  thumbs.forEach(t => t.classList.toggle('on', t.dataset.media === String(mediaId)));
  const vis = visibleSlides(); shownIdx = Math.max(0, vis.findIndex(s => s.dataset.media === String(mediaId)));
  count();
  const m = $('#apdMain'), el = vis[shownIdx];
  if (snap.matches && m && el && !fromScroll) m.scrollTo({ left: el.offsetLeft, behavior: 'smooth' });
  const th = thumbs.find(t => t.dataset.media === String(mediaId));
  if (th && th.parentElement) th.parentElement.scrollLeft = th.offsetLeft - 8;
}
function filterThumbs() {
  const vis = new Set(visibleSlides().map(s => s.dataset.media));
  thumbs.forEach(t => { t.hidden = !vis.has(t.dataset.media); });
  slides.forEach(s => { s.hidden = !vis.has(s.dataset.media); });   // out of the swipe row too
  count();
}
function count() { const n = $('#apdN'); if (n) n.textContent = (shownIdx + 1) + ' / ' + visibleSlides().length; }
thumbs.forEach(t => t.addEventListener('click', () => show(t.dataset.media)));
$$('.apd-nav').forEach(b => b.addEventListener('click', () => {
  const vis = visibleSlides(); if (!vis.length) return;
  shownIdx = (shownIdx + (+b.dataset.step) + vis.length) % vis.length;
  show(vis[shownIdx].dataset.media);
}));
// Phones and tablets: the photos are a swipe row (CSS scroll-snap); the
// thumbnails and counter follow the swipe.
(() => {
  const m = $('#apdMain'); if (!m) return; let raf = 0;
  m.addEventListener('scroll', () => {
    if (!snap.matches) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const vis = visibleSlides(), k = Math.round(m.scrollLeft / m.clientWidth);
      if (vis[k] && k !== shownIdx) { fromScroll = true; show(vis[k].dataset.media); fromScroll = false; }
    });
  }, { passive: true });
})();

/* ---- delivery estimate: a date, not a speed ---- */
function addWorkDays(d, n) { d = new Date(d); let i = 0; while (i < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w && w !== 6) i++; } return d; }
function fmt(a, b) {
  const m = d => d.toLocaleDateString('en-US', { month: 'short' });
  return a.getMonth() === b.getMonth() ? `${m(a)} ${a.getDate()}–${b.getDate()}` : `${m(a)} ${a.getDate()} – ${m(b)} ${b.getDate()}`;
}
(() => {
  const eta = $('#apdEta'); if (!eta) return;
  // Made to order: 2–5 working days to print + 3–4 in transit, plus a day of slack.
  // In stock: 1–2 to dispatch from Omaha + 3–5 in transit.
  const [lo, hi] = root.dataset.ships === 'stock' ? [4, 7] : [5, 10];
  const now = new Date();
  eta.textContent = 'Arrives ' + fmt(addWorkDays(now, lo), addWorkDays(now, hi));
})();

/* ---- options ---- */
function paint() {
  // availability for each button given the other choices
  $$('[data-pos][data-val]').forEach(b => {
    const pos = +b.dataset.pos, val = b.dataset.val;
    b.setAttribute('aria-pressed', chosen[pos] === val);
    b.classList.toggle('na', !anyAvail(pos, val));
  });
  $$('.apd-val').forEach(el => { el.textContent = chosen[+el.dataset.valFor] || ''; });
  const v = match();
  const missing = groups.filter(p => chosen[p] === undefined);
  let label, ok = false;
  if (!variants.some(x => x.a)) label = 'Sold out';
  else if (missing.includes(sPos)) label = 'Choose a size';
  else if (missing.length) label = 'Choose an option';
  else if (!v || !v.a) label = 'Sold out in this size';
  else { label = 'Add to cart'; ok = true; }
  add.textContent = label; if (barBtn) barBtn.textContent = label;
  add.disabled = label.startsWith('Sold out');
  idIn.value = ok ? v.id : '';
  const xp = $('#xpay'); if (xp) xp.classList.toggle('off', !ok);
  if (v) { price.textContent = v.p; if (barPrice) barPrice.textContent = v.p; }
  if (ok) { const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState(null, '', u); }
  const need = $('#apdNeed'); if (need && !missing.includes(sPos)) need.hidden = true;
  filterThumbs();
}
$$('[data-pos][data-val]').forEach(b => b.addEventListener('click', () => {
  const pos = +b.dataset.pos;
  chosen[pos] = b.dataset.val;
  if (pos === cPos) {
    const v = variants.find(x => x.o[cPos - 1] === chosen[cPos] && x.m);
    if (v) show(v.m);
  }
  paint();
}));

// Start state: a variant in the URL wins. Otherwise colour is pre-picked (the
// picture already shows one) and size never is — a pre-picked size gets bought
// by mistake.
(() => {
  const want = new URL(location.href).searchParams.get('variant');
  const v = want && variants.find(x => String(x.id) === want);
  if (v) groups.forEach(p => { chosen[p] = v.o[p - 1]; });
  else {
    const first = variants.find(x => x.a) || variants[0];
    if (first) groups.forEach(p => { if (p !== sPos) chosen[p] = first.o[p - 1]; });
  }
  if (cPos && chosen[cPos]) { const c = variants.find(x => x.o[cPos - 1] === chosen[cPos] && x.m); if (c) show(c.m); }
  paint();
})();

/* ---- submit without a size: point at the sizes instead of failing ---- */
function needSize() {
  const box = $('#apdSizes'), need = $('#apdNeed');
  if (need) need.hidden = false;
  if (box) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
}
$('#apdForm').addEventListener('submit', e => { if (!idIn.value) { e.preventDefault(); needSize(); } });
if (barBtn) barBtn.addEventListener('click', () => { if (idIn.value) $('#apdForm').requestSubmit(add); else needSize(); });

/* ---- phone buy bar ---- */
(() => {
  const bar = $('#apdBar'); if (!bar || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0;
    bar.classList.toggle('on', on); bar.setAttribute('aria-hidden', !on);
    if (barBtn) barBtn.tabIndex = on ? 0 : -1;
  }).observe(add);
})();

/* ---- size guide ---- */
(() => {
  const dlg = document.getElementById('sizeGuide'); if (!dlg) return;
  $$('[data-sg-open]').forEach(b => b.addEventListener('click', () => dlg.showModal()));
  dlg.querySelectorAll('[data-sg-close]').forEach(b => b.addEventListener('click', () => dlg.close()));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.querySelectorAll('[data-unit]').forEach(b => b.addEventListener('click', () => {
    const u = b.dataset.unit;
    dlg.querySelectorAll('[data-unit]').forEach(o => o.setAttribute('aria-pressed', o === b));
    dlg.querySelectorAll('td[data-in]').forEach(td => { td.textContent = td.dataset[u]; });
  }));
})();
})();
