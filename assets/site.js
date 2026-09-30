/* Counter Culture Conflict — storefront script (no dependencies). Works as separate pages, or as one bundled preview when window.__SPA is set. */
const SPA=!!window.__SPA;
const A=n=>(window.__A&&window.__A[n])||'assets/'+n;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>'$'+(Number.isInteger(n)?n.toLocaleString():n.toFixed(2));
const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HD='"Mona Sans","Mona L","Helvetica Neue",Arial,sans-serif';
function U(page,q={},hash){const p=new URLSearchParams(q);if(SPA){if(hash)p.set('to',hash);const s=p.toString();return '#/'+(page==='index'?'':page)+(s?'?'+s:'')}const s=p.toString();return page+'.html'+(s?'?'+s:'')+(hash?'#'+hash:'')}

/* ---------- catalogue: placeholder products built from Murphyy's photos ---------- */
const CATS={lids:'Can lids',knives:'Knives',drinkware:'Tumblers',duty:'Duty gear',apparel:'Apparel'};
const P=[
 {h:'lid-folder-set',n:'Lid and folder set',p:62,c:'lids',mat:'Anodized aluminum, titanium finish',cut:['c-set.webp','wide'],ph:['lid-knife-set.jpg','lid-copville.jpg','knife-oilslick-copville.jpg'],v:'v-knife-oilslick',tag:'Ships free',d:'The Copville script lid and the oil slick folder, sold together. The set clears the free shipping threshold on its own.'},
 {h:'copville-script-lid',n:'Copville script can lid',p:28,c:'lids',mat:'Anodized aluminum',cut:['c-lid-copville.webp',''],ph:['lid-copville.jpg','lid-knife-set.jpg'],v:'v-lid',d:'Black anodized aluminum lid. The Copville script is engraved deep through the anodizing into bare metal, so it will not wear off. Fits standard cans.'},
 {h:'tumbler-30',n:'30 oz tumbler',p:34,c:'drinkware',mat:'Powder coat on stainless',cut:['c-tumbler.webp',''],ph:['tumbler-yeti.jpg'],v:'v-tumbler',opt:{label:'Blank',vals:[['Aftermarket',34],['Genuine YETI',62]]},d:'Powder coated 30 oz tumbler, engraved deep through the coating into the stainless underneath. Choose a genuine YETI or a quality aftermarket blank.'},
 {h:'ammo-can',n:'Engraved ammo can',p:68,c:'duty',mat:'Painted steel',cut:['c-ammo-can.webp','wide'],ph:['ammo-can-fire.jpg','ammo-can-police.jpg'],v:'v-ammo-can',d:'Steel .50 cal can engraved with a crest and a name. Made for retirements, graduations and awards.'},
 {h:'oil-slick-folder',n:'Oil slick folder',p:38,c:'knives',mat:'Titanium finish steel',cut:['c-folder.webp','wide'],ph:['knife-name.jpg','knife-oilslick-copville.jpg'],v:'v-knife-oilslick',d:'Folding knife in a rainbow titanium finish. The laser cuts through the coating into the steel, leaving a bright silver engraving against the colour.'},
 {h:'color-lids',n:'Copville lid, anodized colours',p:30,c:'lids',mat:'Anodized aluminum',cut:['c-lid-colors.webp',''],ph:['lid-colors.jpg'],opt:{label:'Colour',vals:[['Black',30],['Red',30],['Blue',30],['Pink',30]]},d:'The Copville script lid in four anodized colours.'},
 {h:'bear-lid',n:'Bear in area can lid',p:28,c:'lids',mat:'Anodized aluminum',cut:['c-lid-bear.webp',''],ph:['lid-bear.jpg'],d:'Caution sign artwork engraved into black anodized aluminum.'},
 {h:'truck-lid',n:'A.I.G. truck can lid',p:28,c:'lids',mat:'Anodized aluminum',cut:['c-lid-aig.webp',''],ph:['lid-aig.jpg'],d:'Square body truck in the pines. Fine line work, engraved deep into bare metal.'},
 {h:'antihero-squadron-lid',n:'Antihero Squadron can lid',p:28,c:'lids',mat:'Anodized aluminum',cut:['c-lid-antihero.webp','bleed'],ph:['lid-antihero.jpg'],v:'v-lid',d:'The Antihero Squadron pilot, engraved into black anodized aluminum.'},
 {h:'field-knife',n:'Field knife, fixed blade',p:54,c:'knives',mat:'Coated carbon steel',ph:['knife-fixed.jpg'],v:'v-knife-fixed',d:'Black fixed blade with a polymer handle. Script engraved on the flat of the blade.'},
 {h:'name-cuffs',n:'Name engraved cuffs',p:58,c:'duty',mat:'Nickel plated steel',ph:['cuffs.jpg'],d:'Chain handcuffs engraved with your name and number on both bows.'},
 {h:'conflict-tee',n:'Conflict tee',p:32,c:'apparel',mat:'Heavyweight black cotton',ph:['tee-front.jpg','tee-back.jpg','art-globe.jpg'],d:'The 99% spade on the chest, the Conflict globe across the back, flag on the sleeve. Printed to order on a heavyweight black tee.'},
 {h:'conflict-cap',n:'Conflict cap',p:30,c:'apparel',mat:'Black structured cap',ph:['cap-mock.jpg','art-spade.jpg'],d:'The 99% spade lockup, front and centre on a black structured cap. Made to order.'},
 {h:'conflict-work-shirt',n:'Conflict button up',p:48,c:'apparel',mat:'Black button up work shirt',ph:['shirt-buttonup.jpg','art-globe.jpg'],d:'Black button up work shirt. Spade on the chest, the Conflict globe across the back. Made to order.'},
];
const WORK=[['work-flag-skull.jpg','Flag and skull, magwell','firearms'],['work-scorpion.jpg','Scorpion, magwell','firearms'],['v-slide','Slide, mid engrave','firearms'],['work-staytrue.jpg','Stay True, lower receiver','firearms'],
 ['work-shark.jpg','Mou Sphyrna, lower receiver','firearms'],['work-shield.jpg','In Extremis shield','firearms'],['work-saathoff.jpg','Law firm handguard','firearms'],['v-slide2','Slide lettering','firearms'],
 ['lid-jay.jpg','Mascot lid','carry'],['lid-colors.jpg','Anodized lids','carry'],['lid-aig.jpg','Truck lid','carry'],['lid-bear.jpg','Bear lid','carry'],
 ['lid-antihero.jpg','Antihero Squadron lid','carry'],['knife-name.jpg','Named folder','carry'],['knife-oilslick-copville.jpg','Oil slick folder','carry'],['knife-fixed.jpg','Field knife','carry'],
 ['ammo-can-police.jpg','Retirement can','gifts'],['ammo-can-fire.jpg','Fire department can','gifts'],['v-ammo-can','Ammo can, mid engrave','gifts'],['cuffs.jpg','Named cuffs','gifts'],
 ['v-plaque','Department plaque','gifts'],['tumbler-yeti.jpg','Team tumbler','gifts'],['v-tumbler','Tumbler, mid engrave','gifts'],['bottle-central.jpg','Foundation bottle','gifts'],
 ['work-skull.jpg','Omaha Tactical, on bone','oneoff'],['work-arcade.jpg','Arcade control panel','oneoff'],['disc-central.jpg','School disc','oneoff'],['tag-eagles.jpg','Cable tag','oneoff']];
const WCATS={firearms:'Firearms',carry:'Lids and knives',gifts:'Gifts and awards',oneoff:'One offs'};

/* ---------- media ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(still)return;e.isIntersecting?e.target.play().catch(()=>{}):e.target.pause()}),{threshold:.25});
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}}),{threshold:.1});
function hydrate(root=document){
  if(!hydrate.tex){hydrate.tex=1;document.documentElement.style.setProperty('--tex',`url("${new URL(A('tex-stage.jpg'),location.href).href}")`)}
  $$('[data-bg]',root).forEach(e=>{const s=e.dataset.stock;e.style.backgroundImage=(s?`url("${s}"), `:'')+`url(${A(e.dataset.bg)})`;e.removeAttribute('data-bg')});
  $$('img[data-a]',root).forEach(i=>{i.src=A(i.dataset.a);i.removeAttribute('data-a')});
  $$('video[data-a]',root).forEach(v=>{if(v.dataset.poster)v.poster=A(v.dataset.poster);
    if(v.classList.contains('hv')){const c=v.closest('.card'),go=()=>{if(!v.src){v.src=A(v.dataset.a);v.oncanplay=()=>v.classList.add('ready')}v.play().catch(()=>{})};c.addEventListener('mouseenter',go);c.addEventListener('mouseleave',()=>v.pause())}
    else{v.src=A(v.dataset.a);v.removeAttribute('data-a');if(!v.classList.contains('manual'))io.observe(v)}});
  $$('.rv',root).forEach(e=>ro.observe(e));
}
const stageInner=p=>p.cut?`<img class="cut ${p.cut[1]}" loading="lazy" data-a="${p.cut[0]}" alt="${p.n}">`:`<img class="ph" loading="lazy" data-a="${p.ph[0]}" alt="${p.n}">`;
const card=p=>`<a class="card" href="${U('product',{h:p.h})}"><div class="stage">${p.c==='apparel'?'<span class="lab flag"><i></i>Made to order</span>':p.tag?`<span class="lab flag"><i></i>${p.tag}</span>`:''}${stageInner(p)}${p.v?`<video class="hv" data-a="${p.v}.mp4" muted loop playsinline preload="none"></video>`:''}</div><div class="meta"><div><div class="n">${p.n}</div><div class="m">${p.mat}</div></div><div class="p">${p.opt&&p.opt.vals.some(v=>v[1]!==p.p)?'From ':''}${money(p.p)}</div></div></a>`;
function chips(el,map,cur,pick){el.innerHTML=[['all','All'],...Object.entries(map)].map(([k,l])=>`<button class="chip" aria-pressed="${k===cur}" data-k="${k}">${l}</button>`).join('');$$('button',el).forEach(b=>b.onclick=()=>pick(b.dataset.k))}

/* ---------- engraved plate preview (product page name option) ---------- */
function cvs(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makePlate(w,h,tone='black'){
  const c=cvs(w,h),g=c.getContext('2d'),T={black:['#17191b','#0c0d0e','#050505'],white:['#f3f3f1','#e3e3e0','#c8c8c4'],olive:['#3c3f33','#2b2d24','#1b1c16'],ti:['#31204f','#123f57','#4a2a16']}[tone],lite=tone==='white';
  const b=g.createLinearGradient(0,0,tone==='ti'?w:0,h);b.addColorStop(0,T[0]);b.addColorStop(.5,T[1]);b.addColorStop(1,T[2]);g.fillStyle=b;g.fillRect(0,0,w,h);
  for(let y=0;y<h;y++){g.fillStyle=`rgba(${lite?'0,0,0':'255,255,255'},${Math.random()*(lite?.03:.05)})`;g.fillRect(0,y,w,1)}
  const s=g.createLinearGradient(0,0,w,h*.9);s.addColorStop(.18,'rgba(255,255,255,0)');s.addColorStop(.34,`rgba(255,255,255,${lite?.45:.07})`);s.addColorStop(.5,'rgba(255,255,255,0)');g.fillStyle=s;g.fillRect(0,0,w,h);return c}
class Plate{
  constructor(cv){this.cv=cv;this.g=cv.getContext('2d');this.text='';new ResizeObserver(()=>this.draw(1)).observe(cv)}
  set(t){this.text=t;if(still)return this.draw(1);const t0=performance.now(),f=n=>{const k=Math.min(1,(n-t0)/520);this.draw(1-Math.pow(1-k,3));if(k<1)this.raf=requestAnimationFrame(f)};cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(f)}
  draw(k){const d=Math.min(2,devicePixelRatio||1),W=this.cv.clientWidth,H=this.cv.clientHeight;if(!W)return;const w=Math.round(W*d),h=Math.round(H*d);
    if(this.cv.width!==w||this.cv.height!==h||!this.bg){this.cv.width=w;this.cv.height=h;this.bg=makePlate(w,h)}
    const g=this.g,t=(this.text||'Your name').toUpperCase();g.drawImage(this.bg,0,0);let size=h*.36;g.font=`800 ${size}px ${HD}`;try{g.fontStretch='expanded';g.letterSpacing=(size*.02)+'px'}catch(e){}
    const mw=g.measureText(t).width;if(mw>w*.86){size*=w*.86/mw;g.font=`800 ${size}px ${HD}`;try{g.letterSpacing=(size*.02)+'px'}catch(e){}}
    const tw=g.measureText(t).width,x=(w-tw)/2,y=h/2;g.textBaseline='middle';g.save();g.beginPath();g.rect(0,0,x+tw*k,h);g.clip();
    g.fillStyle='rgba(0,0,0,.9)';g.fillText(t,x,y-1.5*d);g.fillStyle='rgba(255,255,255,.14)';g.fillText(t,x,y+1.5*d);
    const gr=g.createLinearGradient(0,y-size/2,0,y+size/2);gr.addColorStop(0,'#f1f3f4');gr.addColorStop(.5,'#aab0b5');gr.addColorStop(1,'#d9dcde');g.fillStyle=gr;g.globalAlpha=this.text?1:.35;g.fillText(t,x,y);g.restore()}
}


/* ---------- hero slider ---------- */
function initSlider(){const hs=$('#hs');if(!hs||hs.dataset.on)return;hs.dataset.on=1;
  const vs=$$('.hs-screen video',hs),ts=$$('.hs-t',hs),segs=$$('.seg',hs),ths=$$('.hs-th',hs),bgs=$$('.hs-bg img',hs),DUR=7500;let i=0,timer=0,paused=still,left=DUR,t0=0;
  hs.style.setProperty('--dur',DUR+'ms');
  const show=n=>{i=(n+vs.length)%vs.length;
    vs.forEach((v,k)=>{v.classList.toggle('on',k===i);if(k===i&&!still)v.play().catch(()=>{});else v.pause()});
    ts.forEach((t,k)=>{t.classList.toggle('on',k===i);t.setAttribute('aria-hidden',k!==i)});ths.forEach((t,k)=>t.classList.toggle('on',k===i));
    segs.forEach((s,k)=>{s.classList.remove('on','done');if(k<i)s.classList.add('done');if(k===i){void s.offsetWidth;s.classList.add('on')}});
    bgs.forEach(b=>b.classList.remove('on'));const b=bgs[i%2];b.src=A(vs[i].dataset.p);b.classList.add('on');
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
/* inline title sequence in the As seen on band */
function initSeen(){const s=$('#seen');if(!s||s.dataset.on)return;s.dataset.on=1;const v=$('video',s);
  $('[data-play-inline]',s).onclick=()=>{s.classList.add('playing');v.play().catch(()=>{})};
  $('[data-sp]',s).onclick=e=>{if(v.paused){v.play();e.target.textContent='Pause'}else{v.pause();e.target.textContent='Play'}};
  $('[data-sm]',s).onclick=e=>{v.muted=!v.muted;e.target.textContent=v.muted?'Sound off':'Sound on'};
  $('[data-sf]',s).onclick=()=>(v.requestFullscreen||v.webkitRequestFullscreen||(()=>{})).call(v);
  const stop=()=>{v.pause();v.currentTime=0;s.classList.remove('playing')};$('[data-sx]',s).onclick=stop;v.onended=stop}

/* ---------- video player ---------- */
function initPlayer(root){if(!root||root.dataset.on)return;root.dataset.on=1;const v=$('video',root),bar=$('.pl-seek i',root),tm=$('.pl-time',root),pp=$('[data-pp]',root),mu=$('[data-mute]',root);
  const f=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'),toggle=()=>v.paused?v.play().catch(()=>{}):v.pause();
  $('.pl-big',root).onclick=toggle;pp.onclick=toggle;v.onclick=toggle;
  v.onplay=()=>{root.classList.add('playing');pp.textContent='Pause'};v.onpause=()=>{root.classList.remove('playing');pp.textContent='Play'};v.onended=()=>{v.currentTime=0};
  v.ontimeupdate=v.onloadedmetadata=()=>{const d=v.duration||0;bar.style.width=(d?v.currentTime/d*100:0)+'%';tm.textContent=f(v.currentTime)+' / '+f(d)};
  $('.pl-seek',root).onclick=e=>{const r=e.currentTarget.getBoundingClientRect();if(v.duration)v.currentTime=(e.clientX-r.left)/r.width*v.duration};
  mu.onclick=()=>{v.muted=!v.muted;mu.textContent=v.muted?'Sound off':'Sound on'};
  $('[data-fs]',root).onclick=()=>{const el=root;(el.requestFullscreen||el.webkitRequestFullscreen||(()=>{})).call(el)}}
function initModal(){const d=$('#vm');if(!d)return;$$('[data-play]').forEach(b=>b.onclick=()=>{initPlayer($('#vmPlayer'));d.showModal();$('video',d).play().catch(()=>{})});
  const close=()=>{$('video',d).pause();d.close()};$('#vmX').onclick=close;d.addEventListener('close',()=>$('video',d).pause());d.addEventListener('click',e=>{if(e.target===d)close()})}


/* ---------- hosting helpers ---------- */
const HOSTED=!SPA&&/^https?:$/.test(location.protocol);
async function sendForm(fd,multipart){ if(!HOSTED)return true; try{const r=await fetch('/',multipart?{method:'POST',body:fd}:{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fd).toString()});return r.ok}catch(e){return false} }
/* Antihero schedule: Mon to Fri, 1PM Eastern */
const ET='America/New_York';
function tzOff(d){const s=new Intl.DateTimeFormat('en-US',{timeZone:ET,timeZoneName:'shortOffset'}).formatToParts(d).find(p=>p.type==='timeZoneName')?.value||'GMT-5';const m=/GMT([+-]\d+)/.exec(s);return m?+m[1]*60:-300}
function nextShow(from=new Date()){for(let i=0;i<8;i++){const d=new Date(from.getTime()+i*864e5),p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:ET,weekday:'short',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(d).map(x=>[x.type,x.value]));if(p.weekday==='Sat'||p.weekday==='Sun')continue;const utc=new Date(Date.UTC(+p.year,+p.month-1,+p.day,13,0)-tzOff(d)*6e4);if(utc>from)return utc}return null}
let LIVE=null;
function tickStrip(){const el=$('#strip');if(!el)return;const t=$('[data-live-text]',el),lb=$('#stripLive'),nt=$('[data-net-text]',el);
  if(YT&&YT.conflict&&YT.conflict[0])t.textContent='Counter Culture Conflict. Latest: '+YT.conflict[0].title;
  if(lb){const on=!!(YT&&YT.live&&YT.live.network);lb.classList.toggle('live',on);if(nt)nt.textContent=on?'Live now on Counter Culture Inc':'Counter Culture Inc live';if(on)lb.href=YT.live.network.url}}
const rel=iso=>{if(!iso)return'';const s=(Date.now()-new Date(iso))/1e3,d=Math.floor(s/86400);return s<86400?'today':d===1?'yesterday':d<7?d+' days ago':new Date(iso).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})};
const kv=n=>!n?'':n>=1e6?(n/1e6).toFixed(1)+'M views':n>=1e3?Math.round(n/1e3)+'K views':n+' views';
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const epCard=(e,short)=>`<button class="ep${short?' sh':''}" type="button" data-yt="${esc(e.id)}" data-url="${esc(e.url)}"><div class="th"><img src="${esc(e.thumb)}" ${e.thumb2?`onerror="this.onerror=null;this.src='${esc(e.thumb2)}'"`:''} alt="" loading="lazy"><span class="pb"><svg class="ic" viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>${e.dur?`<span class="du">${esc(e.dur)}</span>`:''}</div><div class="t">${esc(e.title.replace(/\s*\|\s*(Counter Culture Conflict|CC Conflict)\s*$/i,''))}</div><div class="m">${[rel(e.published),kv(e.views)].filter(Boolean).join('  /  ')}</div></button>`;
let YT=null;
async function loadYT(){if(YT)return YT;if(!HOSTED)return null;try{const d=await (await fetch('/api/youtube',{cache:'no-store'})).json();if(d&&d.ok){YT=d;tickStrip()}return YT}catch(e){return null}}
function fillEpisodes(){loadYT().then(d=>{if(!d)return;[['#epsConflict',d.conflict,8,0],['#epsShorts',d.conflictShorts,6,1],['#epsNetwork',d.network,4,0],['#epsHome',d.conflict,4,0]].forEach(([sel,list,n,short])=>{const el=$(sel);if(!el||!list||!list.length)return;el.innerHTML=list.slice(0,n).map(e=>epCard(e,short)).join('');const w=el.closest('[data-eps]');if(w)w.hidden=false;
   $$('.ep',el).forEach(b=>b.onclick=()=>{const pl=$('#showPlayer');if(pl&&sel==='#epsConflict'){pl.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0" title="Episode" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;pl.scrollIntoView({block:'center'})}else window.open(b.dataset.url,'_blank','noopener')})})})}

/* ---------- pages ---------- */
const appCards=()=>P.filter(p=>p.c==='apparel').map(card).join('');
const INIT={
 index(){ $('#featured').innerHTML=P.filter(p=>p.cut&&p.cut[1]!=='bleed').slice(0,8).map(card).join(''); $('#homeApparel').innerHTML=appCards(); hydrate($('#featured'));hydrate($('#homeApparel')); initSlider(); initSeen(); fillEpisodes() },
 shop(q){ let cur=q.c||'all';const so=$('#sort');if(so)so.onchange=()=>draw(cur);const draw=c=>{cur=c;chips($('#chips'),CATS,c,draw);let l=P.filter(p=>c==='all'||p.c===c);const s=so?so.value:'';if(s==='lo')l=[...l].sort((a,b)=>a.p-b.p);if(s==='hi')l=[...l].sort((a,b)=>b.p-a.p);if(s==='az')l=[...l].sort((a,b)=>a.n.localeCompare(b.n));const rem=l.length%4,span=rem?4-rem:4;$('#shopGrid').innerHTML=l.map(card).join('')+`<a class="promo" style="grid-column:span ${span}" href="${U('bulk')}"><div class="bgrow"><img data-a="tumbler-yeti.jpg" alt=""><img data-a="disc-central.jpg" alt=""><img data-a="lid-jay.jpg" alt=""></div><div class="stack-s"><span class="lab"><i></i>Twelve pieces or more</span><span class="h2">Your logo on any of it</span><span class="ul" style="margin-top:12px">Custom and bulk</span></div></a>`;$('#shopCount').textContent=l.length+(l.length===1?' piece':' pieces');hydrate($('#shopGrid'))};draw(q.c||'all') },
 apparel(){ $('#appGrid').innerHTML=appCards(); hydrate($('#appGrid')) },
 product(q){ renderPDP(q.h) },
 bulk(q){ initCfg(q); const to=q.to||location.hash.slice(1); if(to&&document.getElementById(to))setTimeout(()=>document.getElementById(to).scrollIntoView(),60) },
 show(){ $('#showApparel').innerHTML=appCards(); hydrate($('#showApparel')); initPlayer($('#showPlayer')); fillEpisodes() },
 work(){ const draw=c=>{chips($('#workChips'),WCATS,c,draw);wlist=[];let html='';Object.entries(WCATS).forEach(([k,l])=>{if(c!=='all'&&c!==k)return;const items=WORK.filter(w=>w[2]===k);if(!items.length)return;const rem=items.length%4;
    html+=`<div class="ghead"><h2 class="h2">${l}</h2><span class="lab">${items.length} pieces</span></div><div class="wgroup">`+items.map(([f,t])=>{const i=wlist.push([f,t])-1;return `<button class="wk" data-i="${i}" aria-label="Open ${t}">${f.startsWith('v-')?`<video data-a="${f}.mp4" data-poster="${f}.jpg" muted loop playsinline></video>`:`<img loading="lazy" data-a="${f}" alt="">`}<span class="lab">${t}</span></button>`}).join('')+'</div>'});
   $('#workGroups').innerHTML=html;hydrate($('#workGroups'));$$('#workGroups .wk').forEach(b=>b.onclick=()=>openLb(+b.dataset.i))};draw('all') },
 murphy(){ const el=$('#mCycle');if(!el||el.dataset.on)return;el.dataset.on=1;const vs=$$('video',el);let i=0;const am=$$('#mAmb img');const show=n=>{i=n%vs.length;vs.forEach((v,k)=>{v.classList.toggle('on',k===i);if(k===i&&!still)v.play().catch(()=>{});else v.pause()});$('#mCount').textContent='0'+(i+1)+' / 0'+vs.length;if(am.length){am.forEach(x=>x.classList.remove('on'));const b=am[i%2];b.src=A(vs[i].dataset.amb);b.classList.add('on')}};show(0);if(!still)setInterval(()=>show(i+1),6000) },
 allies(){}, '404'(){}

};

/* lightbox */
let wlist=[],wi=0;
function openLb(i){wi=(i+wlist.length)%wlist.length;const[f,l]=wlist[wi];const ff=f.replace(/^g-/,'');$('#lbM').innerHTML=f.startsWith('v-')?`<video src="${A(f+'.mp4')}" poster="${A(f+'.jpg')}" autoplay muted loop playsinline></video>`:`<img src="${A(ff)}" alt="${l}">`;$('#lbC').textContent=`${l}   ${wi+1} / ${wlist.length}`;if(!$('#lb').open)$('#lb').showModal()}

/* product page */
function renderPDP(h){
  const p=P.find(x=>x.h===h)||P[0];let price=p.p,optVal=p.opt?p.opt.vals[0][0]:null,plate=null;
  const media=[...(p.cut?[{t:'cut'}]:[]),...(p.v?[{t:'vid',f:p.v}]:[]),...p.ph.map(f=>({t:'ph',f}))];
  $('#pdp').innerHTML=`<div class="wrap"><div class="pdp">
   <div><div class="stage" id="pStage"></div><div class="thumbs" id="pThumbs">${media.length>1?media.map((m,i)=>`<button class="thumb" aria-pressed="${i===0}" data-i="${i}" aria-label="View ${i+1}"><img data-a="${m.t==='cut'?p.cut[0]:m.t==='vid'?m.f+'.jpg':m.f}" alt="" style="${m.t==='cut'?'object-fit:contain;padding:10px':''}"></button>`).join(''):''}</div>
     <dl class="spec"><div><dt class="lab">Material</dt><dd>${p.mat}</dd></div><div><dt class="lab">Engraving</dt><dd>${p.c==='apparel'?'Printed to order':'Industrial fiber laser. Deep and permanent'}</dd></div><div><dt class="lab">Made in</dt><dd>Omaha, Nebraska</dd></div><div><dt class="lab">Shipping time</dt><dd>${p.c==='apparel'?'Made to order. Allow 5 to 8 days':'About 3 days. About a week with a name'}</dd></div></dl></div>
   <div class="buy stack">
    <div class="crumbs"><a href="${U('shop')}">Shop</a> &nbsp;/&nbsp; <a href="${U('shop',{c:p.c})}">${CATS[p.c]}</a></div>
    <div class="stack-s"><h1 class="h2">${p.n}</h1><div class="lab">${p.mat}</div></div>
    <div class="price" id="pPrice">${money(price)}</div>
    <p class="copy">${p.d}</p>
    ${p.opt?`<div class="field"><span class="lab">${p.opt.label}</span><div class="opts" id="pOpts">${p.opt.vals.map((v,i)=>`<button class="opt" aria-pressed="${i===0}" data-v="${v[0]}" data-p="${v[1]}">${v[0]}${v[1]!==p.p?' &nbsp;'+money(v[1]):''}</button>`).join('')}</div></div>`:''}
    ${p.c==='apparel'?`<div class="field"><span class="lab">Size</span><div class="opts" id="pSize">${['S','M','L','XL','2XL','3XL'].map((s,i)=>`<button class="opt" aria-pressed="${i===2}">${s}</button>`).join('')}</div></div>`:''}
    ${p.c==='apparel'?'':`<div class="acc"><label class="acc-h"><span class="ink">Add a name <span class="mut">&nbsp;+ $5</span></span><input type="checkbox" id="addName"></label>
      <div class="acc-b" id="nameBox" hidden><input class="inp" id="nameIn" maxlength="20" placeholder="Name, call sign or number" aria-label="Name to engrave"><canvas class="plate" id="namePlate" aria-hidden="true"></canvas><span class="note">Preview of the engraving. Named pieces ship in about a week.</span></div></div>`}
    ${p.soon?`<button class="btn solid full" id="notify">Notify me</button><p class="note" id="notifyMsg" role="status"></p>`:`<button class="btn solid full" id="add">Add to cart</button>`}
    <p class="note">${p.c==='apparel'?'Made to order, allow 5 to 8 days.':'Ships in about 3 days.'} $8 flat in the US, free over $60. Canada $15.</p>
    <a class="aside" href="${U('bulk')}"><span><span class="ink">Need this with your logo?</span><br><span class="note">Twelve pieces or more. Preview and price it.</span></span><span class="ul">Bulk orders</span></a>
   </div></div></div>
   <div class="plate-bg rel" style="margin-top:var(--gap)"><div class="wrap sec-s"><div class="trio"><div><span class="lab"><i></i>Shipping</span><b>$8 flat, free over $60</b>US and territories. Canada is $15. In stock pieces leave in about 3 days.</div><div><span class="lab"><i></i>Names</span><b>$5 on any piece</b>A name, a call sign or a number, engraved to match. Allow about a week.</div><div><span class="lab"><i></i>Twelve or more</span><b>Your logo, bulk pricing</b>Preview it, price it and approve a proof first. <a class="ul" style="margin-left:6px" href="${U('bulk')}">Start</a></div></div></div></div>
   <div class="wrap sec"><div class="sh"><h2 class="h2">More in stock</h2><a class="ul" href="${U('shop')}">View all</a></div><div class="grid">${P.filter(x=>x.h!==p.h&&!x.soon&&x.cut&&x.cut[1]!=='bleed').slice(0,4).map(card).join('')}</div></div>`;
  const show=i=>{const m=media[i];$('#pStage').innerHTML=m.t==='cut'?`<img class="cut ${p.cut[1]}" src="${A(p.cut[0])}" alt="${p.n}">`:m.t==='vid'?`<video class="ph" src="${A(m.f+'.mp4')}" poster="${A(m.f+'.jpg')}" autoplay muted loop playsinline></video>`:`<img class="ph" src="${A(m.f)}" alt="${p.n}">`;$$('#pThumbs .thumb').forEach((b,j)=>b.setAttribute('aria-pressed',i===j))};
  show(0);$$('#pThumbs .thumb').forEach(b=>b.onclick=()=>show(+b.dataset.i));hydrate($('#pdp'));
  const nameOn=()=>$('#addName')&&$('#addName').checked;const upd=()=>$('#pPrice').textContent=money(price+(nameOn()?5:0));
  $$('#pOpts .opt').forEach(b=>b.onclick=()=>{$$('#pOpts .opt').forEach(o=>o.setAttribute('aria-pressed',o===b));price=+b.dataset.p;optVal=b.dataset.v;upd()});
  $$('#pSize .opt').forEach(b=>b.onclick=()=>$$('#pSize .opt').forEach(o=>o.setAttribute('aria-pressed',o===b)));
  let t;if($('#addName'))$('#addName').onchange=e=>{$('#nameBox').hidden=!e.target.checked;upd();if(e.target.checked){plate=plate||new Plate($('#namePlate'));plate.set($('#nameIn').value.trim());$('#nameIn').focus()}};
  if($('#nameIn'))$('#nameIn').oninput=e=>{clearTimeout(t);t=setTimeout(()=>plate&&plate.set(e.target.value.trim()),260)};
  if($('#add'))$('#add').onclick=()=>{const on=nameOn(),nm=on?$('#nameIn').value.trim():'';addToCart({n:p.n,p,price:price+(on?5:0),note:[optVal,on&&('Name: '+(nm||'to confirm'))].filter(Boolean).join(' / ')})};
  if($('#notify'))$('#notify').onclick=()=>$('#notifyMsg').textContent='Noted. We will email you when it is available.';
}

/* cart */
let cart=[];try{cart=(JSON.parse(localStorage.getItem('ccc-cart'))||[]).map(l=>({...l,p:P.find(x=>x.h===l.h)})).filter(l=>l.p)}catch(e){}
const saveCart=()=>{try{localStorage.setItem('ccc-cart',JSON.stringify(cart.map(({n,price,note,p})=>({n,price,note,h:p.h}))))}catch(e){}};
function toast(t){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('on'),2200)}
function addToCart(l){cart.push(l);saveCart();drawCart();openCart(true)}
function drawCart(){const sub=cart.reduce((s,l)=>s+l.price,0),left=Math.max(0,60-sub);$('#cartCount').textContent=cart.length;
  $('#lines').innerHTML=cart.length?cart.map((l,i)=>`<div class="ln"><div class="stage">${l.p.cut?`<img class="cut" src="${A(l.p.cut[0])}" alt="">`:`<img class="ph" src="${A(l.p.ph[0])}" alt="">`}</div><div><div class="ink" style="font-weight:500">${l.n}</div>${l.note?`<div class="note">${l.note}</div>`:''}<button class="rm" data-rm="${i}">Remove</button></div><div class="ink">${money(l.price)}</div></div>`).join(''):'<p class="mut" style="padding:32px 0">Your cart is empty.</p>';
  $$('[data-rm]').forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.rm,1);saveCart();drawCart()});$('#subtotal').textContent=money(sub);
  $('#shipMsg').textContent=!cart.length?'Free US shipping on orders over $60':left?money(left)+' away from free US shipping':'Free US shipping applied';$('#meter').style.width=Math.min(100,sub/60*100)+'%'}
function openCart(o){document.body.classList.toggle('open',o);$('#drawer').setAttribute('aria-hidden',!o);if(o)$('#closeCart').focus()}

/* bulk estimator (placeholder rates) */
const ITEMS=[['Can lid',28],['Oil slick folder',38],['Tumbler, aftermarket',34],['Tumbler, genuine YETI',62],['Ammo can',68]];
const tier=q=>q>=100?.25:q>=50?.2:q>=25?.15:.1;
function bizDays(n){const d=new Date();while(n>0){d.setDate(d.getDate()+1);if(d.getDay()%6)n--}return d.toLocaleDateString('en-US',{month:'long',day:'numeric'})}
/* logo preview (target experience for the personalizer app block) */
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
  const up=()=>{const base=CFG[it].p,d=tier(n),each=base*(1-d),setup=n>=50?0:35;R.style.setProperty('--f',((n-12)/488*100)+'%');$('#cfgN').textContent=n;$('#cfgEach').textContent=money(+each.toFixed(2));$('#cfgSave').textContent=Math.round(d*100)+'% off';$('#cfgTotal').textContent=money(Math.round(each*n+setup));
    $('#cfgNote').textContent=`${setup?'Includes $35 artwork setup. ':'Artwork setup waived. '}Approve your proof this week and it ships around ${bizDays(12)}.`;$('#cfgSum').textContent=`${n} x ${CFG[it].l}, ${money(Math.round(each*n+setup))} estimated`};
  $('#cfgPiece').innerHTML=CFG.map((c,i)=>`<button class="opt" aria-pressed="${i===it}" data-i="${i}" type="button">${c.l}</button>`).join('');
  $$('#cfgPiece .opt').forEach(b=>b.onclick=()=>{it=+b.dataset.i;$$('#cfgPiece .opt').forEach(o=>o.setAttribute('aria-pressed',o===b));const nb=CFG[it].b;if(nb!==LT.blank){LT.blank=nb;LT.x=450;LT.y=nb==='knife'?455:450;wipeLogo()}up()});
  R.value=n;R.oninput=()=>{n=+R.value;up()};LT.blank=CFG[it].b;
  if(!LT.bound){LT.bound=1;const cv=$('#cv');let drag=false,ox=0,oy=0;const pt=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*900,(e.clientY-r.top)/r.height*900]};
   cv.onpointerdown=e=>{drag=true;cv.setPointerCapture(e.pointerId);const[x,y]=pt(e);ox=LT.x-x;oy=LT.y-y};cv.onpointermove=e=>{if(!drag)return;const[x,y]=pt(e);LT.x=x+ox;LT.y=y+oy;drawTool()};cv.onpointerup=()=>drag=false;
   ['logoSize','logoRot'].forEach(id=>{const r=$('#'+id),f=()=>{r.style.setProperty('--f',((r.value-r.min)/(r.max-r.min)*100)+'%');drawTool()};r.oninput=f;r.style.setProperty('--f',((r.value-r.min)/(r.max-r.min)*100)+'%')});
   $('#logoInv').onclick=e=>{LT.inv=!LT.inv;e.target.setAttribute('aria-pressed',LT.inv);drawTool()};
   $('#logoDl').onclick=()=>cv.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='conflict-mockup.png';a.click()});
   $('#logoFile').onchange=e=>{const f=e.target.files[0];if(!f)return;$('#uplName').textContent=f.name;const im=new Image();im.onload=()=>{LT.logo=im;wipeLogo()};im.src=URL.createObjectURL(f)};
   $('#cfgGo').onclick=()=>{$('#cfgForm').hidden=false;$('#cfgGo').hidden=true;$('#q1').focus()};
   $('#cfgForm').onsubmit=async e=>{e.preventDefault();const f=e.target,msg=$('#quoteMsg');msg.textContent='Sending...';const fd=new FormData(f);fd.set('summary',$('#cfgSum').textContent);
     const lf=$('#logoFile').files[0];if(lf)fd.set('logo',lf,lf.name);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(blob)fd.set('mockup',blob,'mockup.png');
     const ok=await sendForm(fd,true);msg.textContent=ok?'Request sent with your mockup. Murphy replies within 2 business days.':'That did not send. Please try again, or email the shop directly.'}}
  up();drawTool()}

/* ---------- shell ---------- */
function shell(){
  hydrate();drawCart();
  $('#cartBtn').onclick=()=>openCart(true);$('#closeCart').onclick=$('#scrim').onclick=()=>openCart(false);
  addEventListener('keydown',e=>{if(e.key==='Escape')openCart(false)});
  $('#menuBtn').onclick=()=>{const on=$('#nav').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',on)};
  $('#signup').onsubmit=async e=>{e.preventDefault();const ok=await sendForm(new FormData(e.target),false);$('#signupMsg').textContent=ok?'Thanks. You are on the list.':'That did not send. Please try again.';if(ok)e.target.reset()};
  if($('#lb')){$('#lbX').onclick=()=>$('#lb').close();$('#lbP').onclick=()=>openLb(wi-1);$('#lbN').onclick=()=>openLb(wi+1);$('#lb').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')openLb(wi-1);if(e.key==='ArrowRight')openLb(wi+1)});$('#lb').addEventListener('click',e=>{if(e.target.classList.contains('lb-in'))$('#lb').close()})}
  addEventListener('scroll',solid,{passive:true});
  tickStrip();loadYT();
}
let PAGE='index';
const solid=()=>$('#head').classList.toggle('solid',scrollY>40||PAGE!=='index');
function go(page,q){PAGE=INIT[page]?page:'index';
  if(SPA)$$('.view').forEach(v=>v.classList.toggle('on',v.dataset.view===PAGE));
  $$('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.nav===PAGE));$('#nav').classList.remove('open');
  INIT[PAGE](q||{});if(SPA&&!(q&&q.to))scrollTo(0,0);solid()}
function boot(){shell();
  if(SPA){const route=()=>{const raw=location.hash.replace(/^#\/?/,''),[path,qs='']=raw.split('?');go(path||'index',Object.fromEntries(new URLSearchParams(qs)))};addEventListener('hashchange',route);route()}
  else go(document.body.dataset.page,Object.fromEntries(new URLSearchParams(location.search)))}
(document.fonts&&document.fonts.load?Promise.all([document.fonts.load('600 40px "Sofia Sans Extra Condensed"'),document.fonts.load('600 40px "Sofia L"')]).catch(()=>{}):Promise.resolve()).then(boot);

document.addEventListener('click',e=>{const b=e.target.closest('[data-scroll]');if(b){const t=document.getElementById(b.dataset.scroll);if(t)t.scrollIntoView()}});