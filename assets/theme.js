/* Counter Culture Conflict — Shopify theme script.
   UI modules ported from the approved prototype. Cart, products and routing are
   Shopify's; this file only drives the custom interface pieces. */
(function () {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HD = '"Mona Sans","Helvetica Neue",Arial,sans-serif';
const money = n => (window.Shopify && window.Shopify.formatMoney)
  ? window.Shopify.formatMoney(n * 100)
  : '$' + (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2));
const A = n => (window.__assets && window.__assets[n]) || n;

/* volume pricing for the custom-order estimator */
function tier(q) { return q >= 250 ? 0.30 : q >= 100 ? 0.22 : q >= 50 ? 0.15 : q >= 24 ? 0.10 : 0.05; }
function bizDays(n) {
  const d = new Date(); let i = 0;
  while (i < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) i++; }
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
const setText = (sel, v) => { const e = $(sel); if (e) e.textContent = v; };
function toast(t) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = t; el.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200);
}
function initSlider(){const hs=$('#hs');if(!hs||hs.dataset.on)return;hs.dataset.on=1;
  const vs=$$('.hs-screen video',hs),ts=$$('.hs-t',hs),segs=$$('.seg',hs),ths=$$('.hs-th',hs),bgs=$$('.hs-bg img',hs),DUR=7500;let i=0,timer=0,paused=still,left=DUR,t0=0;
  hs.style.setProperty('--dur',DUR+'ms');
  const show=n=>{i=(n+vs.length)%vs.length;
    vs.forEach((v,k)=>{v.classList.toggle('on',k===i);if(k===i&&!still)v.play().catch(()=>{});else v.pause()});
    ts.forEach((t,k)=>{t.classList.toggle('on',k===i);t.setAttribute('aria-hidden',k!==i)});ths.forEach((t,k)=>t.classList.toggle('on',k===i));
    segs.forEach((s,k)=>{s.classList.remove('on','done');if(k<i)s.classList.add('done');if(k===i){void s.offsetWidth;s.classList.add('on')}});
    bgs.forEach(b=>b.classList.remove('on'));const p=vs[i].dataset.p;if(p){const b=bgs[i%2];b.src=A(p);b.classList.add('on')}
    $('#hsCount').textContent='0'+(i+1)+' / 0'+vs.length;$('#hsMat').textContent=vs[i].dataset.mat;left=DUR;arm()};
  const arm=()=>{clearTimeout(timer);if(paused)return;t0=performance.now();timer=setTimeout(()=>show(i+1),left)};
  const setPause=p=>{if(p&&!paused){left=Math.max(600,left-(performance.now()-t0));clearTimeout(timer)}paused=p;hs.classList.toggle('paused',p);$('[data-pause]',hs).textContent=(p&&hs.dataset.user)?'Play':'Pause';if(!p)arm()};
  $('[data-prev]',hs).onclick=()=>show(i-1);$('[data-next]',hs).onclick=()=>show(i+1);$('[data-pause]',hs).onclick=()=>{const u=!hs.dataset.user;hs.dataset.user=u?'1':'';paused=!u;setPause(u)};
  segs.forEach((s,k)=>s.onclick=()=>show(k));ths.forEach((s,k)=>s.onclick=()=>show(k));
  hs.addEventListener('mouseenter',()=>{if(!hs.dataset.user)setPause(true)});hs.addEventListener('mouseleave',()=>{if(!hs.dataset.user&&!still)setPause(false)});
  hs.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')show(i-1);if(e.key==='ArrowRight')show(i+1)});
  let sx=null;hs.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});hs.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>48)show(i+(dx<0?1:-1));sx=null});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(timer);else if(!paused)arm()});
  if(still){hs.classList.add('paused');$('[data-pause]',hs).textContent='Play'}
  show(0)}

function initSeen(){const s=$('#seen');if(!s||s.dataset.on)return;s.dataset.on=1;const v=$('video',s);
  if(!v)return;  // the section renders its controls even with no clip set
  const on=(sel,fn)=>{const el=$(sel,s);if(el)el.onclick=fn};
  on('[data-play-inline]',()=>{s.classList.add('playing');v.play().catch(()=>{})});
  on('[data-sp]',e=>{if(v.paused){v.play();e.target.textContent='Pause'}else{v.pause();e.target.textContent='Play'}});
  on('[data-sm]',e=>{v.muted=!v.muted;e.target.textContent=v.muted?'Sound off':'Sound on'});
  on('[data-sf]',()=>(v.requestFullscreen||v.webkitRequestFullscreen||(()=>{})).call(v));
  const stop=()=>{v.pause();v.currentTime=0;s.classList.remove('playing')};on('[data-sx]',stop);v.onended=stop}

function initPlayer(root){if(!root||root.dataset.on)return;root.dataset.on=1;const v=$('video',root),bar=$('.pl-seek i',root),tm=$('.pl-time',root),pp=$('[data-pp]',root),mu=$('[data-mute]',root);
  const f=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'),toggle=()=>v.paused?v.play().catch(()=>{}):v.pause();
  $('.pl-big',root).onclick=toggle;pp.onclick=toggle;v.onclick=toggle;
  v.onplay=()=>{root.classList.add('playing');pp.textContent='Pause'};v.onpause=()=>{root.classList.remove('playing');pp.textContent='Play'};v.onended=()=>{v.currentTime=0};
  const seek=$('.pl-seek',root);
  v.ontimeupdate=v.onloadedmetadata=()=>{const d=v.duration||0,pc=d?v.currentTime/d*100:0;bar.style.width=pc+'%';
    if(seek)seek.setAttribute('aria-valuenow',Math.round(pc));tm.textContent=f(v.currentTime)+' / '+f(d)};
  if(seek){seek.onclick=e=>{const r=e.currentTarget.getBoundingClientRect();if(v.duration)v.currentTime=(e.clientX-r.left)/r.width*v.duration};
    // role="slider" has to be operable by keyboard, not just clickable.
    seek.onkeydown=e=>{if(!v.duration)return;const step=e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0;
      if(step){e.preventDefault();v.currentTime=Math.min(v.duration,Math.max(0,v.currentTime+step))}
      else if(e.key==='Home'){e.preventDefault();v.currentTime=0}
      else if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle()}}}
  mu.onclick=()=>{v.muted=!v.muted;mu.textContent=v.muted?'Sound off':'Sound on'};
  $('[data-fs]',root).onclick=()=>{const el=root;(el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el)}}

function cvs(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makePlate(w,h,tone='black'){
  const c=cvs(w,h),g=c.getContext('2d'),T={black:['#17191b','#0c0d0e','#050505'],white:['#f3f3f1','#e3e3e0','#c8c8c4'],olive:['#3c3f33','#2b2d24','#1b1c16'],ti:['#31204f','#123f57','#4a2a16']}[tone],lite=tone==='white';
  const b=g.createLinearGradient(0,0,tone==='ti'?w:0,h);b.addColorStop(0,T[0]);b.addColorStop(.5,T[1]);b.addColorStop(1,T[2]);g.fillStyle=b;g.fillRect(0,0,w,h);
  for(let y=0;y<h;y++){g.fillStyle=`rgba(${lite?'0,0,0':'255,255,255'},${Math.random()*(lite?.03:.05)})`;g.fillRect(0,y,w,1)}
  const s=g.createLinearGradient(0,0,w,h*.9);s.addColorStop(.18,'rgba(255,255,255,0)');s.addColorStop(.34,`rgba(255,255,255,${lite?.45:.07})`);s.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=s;g.fillRect(0,0,w,h);return c}

/* ---------- work gallery lightbox: reads items straight from the DOM ---------- */
let wi = 0;
function lbItems() { return $$('.wk'); }
function openLb(i) {
  const items = lbItems(); if (!items.length) return;
  wi = (i + items.length) % items.length;
  const b = items[wi], src = b.dataset.src, label = b.dataset.label || '', isVid = b.dataset.type === 'video';
  $('#lbM').innerHTML = isVid
    ? `<video src="${src}" ${b.dataset.poster ? `poster="${b.dataset.poster}"` : ''} autoplay muted loop playsinline></video>`
    : `<img src="${src}" alt="${label}">`;
  $('#lbC').textContent = `${label}   ${wi + 1} / ${items.length}`;
  const d = $('#lb'); if (d && !d.open) d.showModal();
}

const BL={lid:{l:'Can lid',tone:'black',ink:[226,229,231]},tumbler:{l:'Tumbler',tone:'white',ink:[98,102,106]},can:{l:'Ammo can',tone:'olive',ink:[214,207,170]},knife:{l:'Folder',tone:'ti',ink:[236,238,240]}};
const LT={blank:'lid',logo:null,x:450,y:450,inv:false,k:1,tex:{}};
function blankPath(g){const b=LT.blank;g.beginPath();if(b==='lid')g.arc(450,450,380,0,7);if(b==='tumbler'){g.moveTo(240,80);g.lineTo(660,80);g.lineTo(606,840);g.lineTo(294,840);g.closePath()}if(b==='can')g.rect(100,240,700,450);if(b==='knife'){g.moveTo(70,470);g.quadraticCurveTo(300,335,830,402);g.lineTo(840,518);g.quadraticCurveTo(400,556,70,470);g.closePath()}}
function drawTool(){const cv=$('#cv');if(!cv)return;const g=cv.getContext('2d'),b=BL[LT.blank];g.globalCompositeOperation='source-over';
  const bg=g.createRadialGradient(450,300,40,450,450,720);bg.addColorStop(0,'#1e2022');bg.addColorStop(.58,'#0d0e0f');bg.addColorStop(1,'#060606');g.fillStyle=bg;g.fillRect(0,0,900,900);
  g.save();g.shadowColor='rgba(0,0,0,.9)';g.shadowBlur=70;g.shadowOffsetY=40;blankPath(g);g.fillStyle='#000';g.fill();g.restore();
  g.save();blankPath(g);g.clip();g.drawImage(LT.tex[b.tone]||(LT.tex[b.tone]=makePlate(900,900,b.tone)),0,0);
  if(LT.blank==='lid'){g.strokeStyle='rgba(255,255,255,.09)';g.lineWidth=3;g.beginPath();g.arc(450,450,310,0,7);g.stroke();g.strokeStyle='rgba(0,0,0,.7)';g.beginPath();g.arc(450,450,314,0,7);g.stroke()}
  if(LT.blank==='tumbler'){const s=g.createLinearGradient(0,80,0,136);s.addColorStop(0,'#9a9ea2');s.addColorStop(1,'#d9dcde');g.fillStyle=s;g.fillRect(200,80,500,56)}
  if(LT.blank==='can'){g.fillStyle='rgba(0,0,0,.35)';g.fillRect(100,240,700,44)}
  const s=+$('#logoSize').value/100*900,rot=+$('#logoRot').value*Math.PI/180,[R,G,B]=b.ink;let o;
  if(LT.logo){const im=LT.logo,w=im.width>=im.height?s:s*im.width/im.height,h=im.height>im.width?s:s*im.height/im.width;o=cvs(Math.max(1,w|0),Math.max(1,h|0));const og=o.getContext('2d');og.drawImage(im,0,0,o.width,o.height);const d=og.getImageData(0,0,o.width,o.height),px=d.data;let al=false;for(let i=3;i<px.length;i+=4)if(px[i]<250){al=true;break}
    for(let i=0;i<px.length;i+=4){const lum=(px[i]*.3+px[i+1]*.59+px[i+2]*.11)/255;let m=al?px[i+3]/255:1-lum;if(LT.inv)m=al?(px[i+3]/255)*lum:lum;const n=.84+Math.random()*.16;px[i]=R*n;px[i+1]=G*n;px[i+2]=B*n;px[i+3]=Math.round(Math.min(1,m*1.15)*240)}og.putImageData(d,0,0)}
  else{o=cvs(s|0,(s*.3)|0);const og=o.getContext('2d');og.font=`800 ${s*.15}px ${HD}`;try{og.fontStretch='expanded'}catch(e){}og.textAlign='center';og.textBaseline='middle';og.fillStyle=`rgb(${R},${G},${B})`;og.fillText('YOUR LOGO',o.width/2,o.height/2)}
  g.translate(LT.x,LT.y);g.rotate(rot);const rw=o.width*LT.k;g.shadowColor='rgba(0,0,0,.8)';g.shadowOffsetY=-1.5;g.drawImage(o,0,0,rw,o.height,-o.width/2,-o.height/2,rw,o.height);g.restore()}
function wipeLogo(){if(still){LT.k=1;return drawTool()}const t0=performance.now(),f=n=>{const k=Math.min(1,(n-t0)/900);LT.k=1-Math.pow(1-k,3);drawTool();if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)}
const CFG=[{l:'Can lid',p:28,b:'lid'},{l:'Folder',p:38,b:'knife'},{l:'Tumbler',p:34,b:'tumbler'},{l:'Genuine YETI',p:62,b:'tumbler'},{l:'Ammo can',p:68,b:'can'}];
function initCfg(q={}){if(!$('#cv'))return;let it=+q.item||0,n=+q.qty||48;const R=$('#cfgQty');
  const up=()=>{const base=CFG[it].p,d=tier(n),each=base*(1-d),setup=n>=50?0:35;R.style.setProperty('--f',((n-12)/488*100)+'%');setText('#cfgN',n);setText('#cfgEach',money(+each.toFixed(2)));setText('#cfgSave',Math.round(d*100)+'% off');setText('#cfgTotal',money(Math.round(each*n+setup)));
    setText('#cfgNote',`${setup?'Includes $35 artwork setup. ':'Artwork setup waived. '}Approve your proof this week and it ships around ${bizDays(12)}.`);setText('#cfgSum',`${n} x ${CFG[it].l}, ${money(Math.round(each*n+setup))} estimated`)};
  $('#cfgPiece').innerHTML=CFG.map((c,i)=>`<button class="opt" aria-pressed="${i===it}" data-i="${i}" type="button">${c.l}</button>`).join('');
  $$('#cfgPiece .opt').forEach(b=>b.onclick=()=>{it=+b.dataset.i;$$('#cfgPiece .opt').forEach(o=>o.setAttribute('aria-pressed',o===b));const nb=CFG[it].b;if(nb!==LT.blank){LT.blank=nb;LT.x=450;LT.y=nb==='knife'?455:450;wipeLogo()}up()});
  R.value=n;R.oninput=()=>{n=+R.value;up()};LT.blank=CFG[it].b;
  if(!LT.bound){LT.bound=1;const cv=$('#cv');let drag=false,ox=0,oy=0;const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*900,(e.clientY-r.top)/r.height*900]};
   cv.onpointerdown=e=>{drag=true;cv.setPointerCapture(e.pointerId);const[x,y]=pt(e);ox=LT.x-x;oy=LT.y-y};cv.onpointermove=e=>{if(!drag)return;const[x,y]=pt(e);LT.x=x+ox;LT.y=y+oy;drawTool()};cv.onpointerup=()=>drag=false;
   ['logoSize','logoRot'].forEach(id=>{const r=$('#'+id),f=()=>{r.style.setProperty('--f',((r.value-r.min)/(r.max-r.min)*100)+'%');drawTool()};r.oninput=f;r.style.setProperty('--f',((r.value-r.min)/(r.max-r.min)*100)+'%')});
   if($('#logoInv'))$('#logoInv').onclick=e=>{LT.inv=!LT.inv;e.target.setAttribute('aria-pressed',LT.inv);drawTool()};
   if($('#logoDl'))$('#logoDl').onclick=()=>cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='conflict-mockup.png';a.click()});
   if($('#logoFile'))$('#logoFile').onchange=e=>{const f=e.target.files[0];if(!f)return;setText('#uplName',f.name);const im=new Image();im.onload=()=>{LT.logo=im;wipeLogo()};im.src=URL.createObjectURL(f)};
   // Progressive enhancement: markup ships with the form open and the reveal
   // button hidden, so it works without JS. With JS, collapse it behind the button.
   const go=$('#cfgGo'),form=$('#cfgForm');
   if(go&&form&&!form.querySelector('[data-posted]')){form.hidden=true;go.hidden=false;
     go.onclick=()=>{form.hidden=false;go.hidden=true;const first=form.querySelector('input:not([type=hidden]),textarea');if(first)first.focus()}}
   // Submit through Shopify's own {% form 'contact' %} POST. The quote summary
   // rides along in a hidden field; Shopify's contact form cannot carry file
   // uploads, so the mockup is downloaded rather than attached.
   if($('#cfgForm'))$('#cfgForm').onsubmit=()=>{
     const fld=$('#cfgOrderField'),sum=$('#cfgSum');
     if(fld&&sum)fld.value=sum.textContent.replace(/\s+/g,' ').trim();
     setText('#quoteMsg','Sending...');
     return true}}
  up();drawTool()}

/* ---------- mobile nav ---------- */
function initNav() {
  const b = $('#menuBtn'), n = $('#nav');
  if (!b || !n) return;
  b.onclick = () => {
    const open = n.classList.toggle('open');
    b.setAttribute('aria-expanded', open);
    document.body.classList.toggle('nav-open', open);
  };
}

/* ---------- sticky header ---------- */
function initHead() {
  const h = $('#head'); if (!h) return;
  const f = () => h.classList.toggle('solid', scrollY > 12);
  f(); addEventListener('scroll', f, { passive: true });
}

/* ---------- reveal on scroll ---------- */
function initReveal() {
  const els = $$('.rv'); if (!els.length) return;
  const show = e => e.classList.add('in');
  if (still || !('IntersectionObserver' in window)) { els.forEach(show); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8%' });
  els.forEach(e => io.observe(e));
  // Failsafe. .rv starts at opacity 0, so anything the observer misses stays
  // invisible for good. Sweep on scroll, and once on load for a restored
  // scroll position, so content is never hidden by a missed callback.
  const sweep = () => els.forEach(e => {
    if (!e.classList.contains('in') && e.getBoundingClientRect().top < innerHeight) { show(e); io.unobserve(e); }
  });
  addEventListener('scroll', sweep, { passive: true });
  addEventListener('resize', sweep, { passive: true });
  sweep();
}

/* ---------- collection sort ---------- */
function initSort() {
  const f = $('#sortForm'), sel = $('#sort');
  if (!f || !sel) return;
  // Submitting reloads with ?sort_by=, which is how Shopify sorts a collection.
  sel.addEventListener('change', () => f.submit());
}

/* ---------- lazy video ---------- */
function initVideo() {
  const vs = $$('video:not(.manual)'); if (!vs.length) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.play().catch(() => {}); } else { e.target.pause(); }
  }), { rootMargin: '150px' });
  vs.forEach(v => { if (!still) io.observe(v); });
}

/* ---------- product: the $5 name option ---------- */
// Ticking "Add a name" has to add the £5 engraving line as well, or the page
// promises a charge the cart never makes. Both lines carry the name, so the
// pair reads correctly on the order.
function submitWithAddon(form, box, input) {
  const vid = box.dataset.addonVariant;
  if (!box.checked || !vid) return true;          // let the form post normally
  const name = (input && input.value || '').trim();
  const fd = new FormData(form);
  const main = { id: fd.get('id'), quantity: Number(fd.get('quantity') || 1), properties: {} };
  if (name) main.properties['Name to engrave'] = name;
  const addon = { id: vid, quantity: main.quantity, properties: name ? { 'Engraving for': name } : {} };
  fetch('/cart/add.js', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [main, addon] })
  }).then(r => r.ok ? (window.location.href = '/cart')
                    : form.submit());            // fall back to the native post
  return false;
}

function initNameOption() {
  const box = $('#addName'), input = $('#nameIn'), out = $('#pPrice');
  if (!box) return;
  const base = parseFloat(box.dataset.base || '0'), add = parseFloat(box.dataset.add || '5');
  const form = box.closest('form');
  if (form) form.addEventListener('submit', e => { if (!submitWithAddon(form, box, input)) e.preventDefault(); });
  const upd = () => {
    if (out) out.textContent = money(base + (box.checked ? add : 0));
    if (input) input.disabled = !box.checked;
    const w = $('#nameWrap'); if (w) w.hidden = !box.checked;
  };
  box.onchange = upd; upd();
}

/* ---------- work gallery filter ---------- */
function initWorkFilter() {
  const bar = $('#workChips'); if (!bar) return;
  const groups = $$('[data-group]');
  $$('.chip', bar).forEach(c => c.onclick = () => {
    const cat = c.dataset.cat;
    $$('.chip', bar).forEach(o => { o.classList.toggle('on', o === c); o.setAttribute('aria-pressed', o === c); });
    groups.forEach(g => { g.hidden = cat !== 'all' && g.dataset.group !== cat; });
  });
}

/* ---------- product: option buttons drive the real variant select ---------- */
function initVariants() {
  const sel = $('#variantSelect'); if (!sel) return;
  const groups = $$('[data-opt]');
  if (!groups.length) return;
  const pick = () => {
    const chosen = [];
    $$('.field .opts').forEach(g => {
      const on = $('[aria-pressed="true"]', g);
      if (on) chosen.push(on.dataset.val);
    });
    const want = chosen.join(' / ');
    [...sel.options].forEach(o => { if (o.textContent.split(' — ')[0].trim() === want) sel.value = o.value; });
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };
  groups.forEach(b => b.onclick = () => {
    $$(`[data-opt="${b.dataset.opt}"]`).forEach(o => o.setAttribute('aria-pressed', o === b));
    pick();
  });
}

/* ---------- product gallery ---------- */
function initGallery() {
  const img = $('#pImg'); if (!img) return;
  $$('.thumbs button').forEach(b => b.onclick = () => { img.src = b.dataset.src; });
}

/* ---------- boot ---------- */
function boot() {
  // Each module is isolated: one section throwing must not take down the rest
  // of the page (the nav, the cart count, the variant picker).
  const run = (name, fn) => { try { fn(); } catch (err) { console.error('[theme] ' + name + ' failed:', err); } };
  run('nav', initNav); run('head', initHead); run('reveal', initReveal); run('video', initVideo);
  run('nameOption', initNameOption); run('workFilter', initWorkFilter); run('variants', initVariants);
  run('gallery', initGallery); run('sort', initSort);
  if ($('#hs')) run('slider', initSlider);
  if ($('#seen')) run('seen', initSeen);
  if ($('#showPlayer')) run('player', () => initPlayer($('#showPlayer')));
  if ($('#cv')) run('configurator', () => initCfg({}));
  const lb = $('#lb');
  if (lb) {
    $$('.wk').forEach((b, i) => b.onclick = () => openLb(i));
    const p = $('[data-lb-prev]'), n = $('[data-lb-next]'), x = $('[data-lb-close]');
    if (p) p.onclick = () => openLb(wi - 1);
    if (n) n.onclick = () => openLb(wi + 1);
    if (x) x.onclick = () => lb.close();
    lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') openLb(wi - 1); if (e.key === 'ArrowRight') openLb(wi + 1); });
    lb.addEventListener('close', () => { $('#lbM').innerHTML = ''; });
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
