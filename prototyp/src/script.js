<script>
"use strict";
const NS='http://www.w3.org/2000/svg';
const FONTDATA={SgXB:'__XB__',SgMD:'__MD__',SgFR:'__FR__'};
const CAP={SgXB:0.7275,SgMD:0.7275,SgFR:0.684};
const SWATCH=['#262c3a','#000000','#ffffff','#a6a6a6','#c62828','#1f6f43','#b07d2b','#2f5fa8'];
const CLS={gruen:'Grünflächen',haus:'Häuser',haupt:'Hauptstraßen',neben:'Nebenstraßen',weg:'Feldwege',wasser:'Gewässer',bahn:'Bahn'};
const CLS1={gruen:'Grünfläche',haus:'Haus',haupt:'Hauptstraße',neben:'Nebenstraße',weg:'Feldweg',wasser:'Gewässer',bahn:'Bahn'};
const ORDER=['gruen','wasser','weg','neben','bahn','haus','haupt'];
const MW=1004;
const $=id=>document.getElementById(id);
function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function hex(c){if(!c||c==='none')return '#000000';if(/^#[0-9a-f]{6}$/i.test(c))return c.toLowerCase();if(/^#[0-9a-f]{3}$/i.test(c))return '#'+[...c.slice(1)].map(x=>x+x).join('').toLowerCase();return '#000000'}

/* ---------- Stil-Vorlagen ---------- */
const NAVY='#262c3a';
const PRESETS={
 umriss:{name:'Umriss (Siegritz)',chip:'linear-gradient(90deg,#fff 0 70%,#262c3a 70%)',
  cls:{haus:{s:NAVY,f:'none',w:2.2},haupt:{s:NAVY,f:'none',w:6.4},neben:{s:'#a6a6a6',f:'none',w:2},weg:{s:'#a6a6a6',f:'none',w:2},wasser:{s:'#a6a6a6',f:'none',w:1.5},bahn:{s:'#a6a6a6',f:'none',w:2},gruen:{s:'#d9e2cf',f:'#eef2e8',w:0,h:true}},
  bg:'none',frame:{color:NAVY,w:16,r:48,pad:14},bar:{color:NAVY,on:true},text:'#ffffff'},
 dunkel:{name:'Nachtblau (New York)',chip:'#272c39',
  cls:{haus:{s:'#ffffff',f:'none',w:1.4},haupt:{s:'#ffffff',f:'none',w:5},neben:{s:'#ffffff',f:'none',w:2},weg:{s:'#ffffff',f:'none',w:1.1},wasser:{s:'#ffffff',f:'none',w:1.2},bahn:{s:'#ffffff',f:'none',w:1.5},gruen:{s:'#323949',f:'#2e3442',w:0,h:true}},
  bg:'#272c39',frame:{color:'#ffffff',w:4,r:0,pad:10},bar:{color:'#272c39',on:true},text:'#ffffff'},
 minimal:{name:'Minimal schwarz',chip:'linear-gradient(90deg,#fff 0 55%,#000 55%)',
  cls:{haus:{s:'#000000',f:'#000000',w:0.6},haupt:{s:'#000000',f:'none',w:5},neben:{s:'#000000',f:'none',w:2},weg:{s:'#000000',f:'none',w:0.9},wasser:{s:'#000000',f:'none',w:1},bahn:{s:'#000000',f:'none',w:1.5},gruen:{s:'#000000',f:'none',w:0,h:true}},
  bg:'none',frame:{color:'#000000',w:6,r:0,pad:14},bar:{color:'#000000',on:true},text:'#ffffff'},
 strassen:{name:'Nur Straßen',chip:'repeating-linear-gradient(45deg,#fff 0 6px,#262c3a 6px 8px)',
  cls:{haus:{s:NAVY,f:'none',w:2,h:true},haupt:{s:NAVY,f:'none',w:6},neben:{s:NAVY,f:'none',w:2.6},weg:{s:NAVY,f:'none',w:1.2},wasser:{s:NAVY,f:'none',w:1.2},bahn:{s:NAVY,f:'none',w:1.5},gruen:{s:NAVY,f:'none',w:0,h:true}},
  bg:'none',frame:{color:NAVY,w:10,r:0,pad:14},bar:{color:NAVY,on:true},text:'#ffffff'},
};
function TH(name,desc,c,w){w=w||{};const L=(x,ww)=>({s:x,f:'none',w:ww});
  return {name,desc,dots:[c.bg,c.haupt,c.haus[1]!=='none'?c.haus[1]:c.haus[0],c.neben],
   cls:{haus:{s:c.haus[0],f:c.haus[1],w:w.haus??1.2},haupt:L(c.haupt,w.haupt??4.6),neben:L(c.neben,w.neben??2),weg:L(c.weg,w.weg??1),
     wasser:{s:c.wasser[0],f:c.wasser[1],w:w.wasser??1},bahn:L(c.bahn||c.neben,1.4),gruen:{s:c.gruen?c.gruen[0]:c.bg,f:c.gruen?c.gruen[1]:'none',w:0,h:!c.gruen}},
   bg:c.bg,frame:{color:c.frame,w:w.frame??8,r:w.r??0,pad:12},bar:{color:c.bar,on:true},text:c.text}}
Object.assign(PRESETS.umriss,{desc:'Klare Linien, leere Häuser, Rahmen und Balken in Navy – das Siegritz-Design.'});
Object.assign(PRESETS.dunkel,{desc:'Weiße Linien auf Nachtblau, wie die klassischen Stadtposter.'});
Object.assign(PRESETS.minimal,{desc:'Schwarz auf Weiß, gefüllte Häuser – maximal reduziert.'});
Object.assign(PRESETS.strassen,{desc:'Nur das Straßennetz, ohne Häuser.'});
Object.assign(PRESETS,{
 cyber:TH('Cyber Noir','Neonpink und Cyan auf fast schwarzem Grund.',{bg:'#0b0b12',haus:['#34344d','#16161f'],haupt:'#ff2bd6',neben:'#00e5ff',weg:'#24606e',wasser:['#13284a','#13284a'],gruen:['#111a1c','#111a1c'],frame:'#ff2bd6',bar:'#0b0b12',text:'#ffffff'},{haus:0.9,frame:6}),
 mittelmeer:TH('Mittelmeer-Sonne','Warmes Creme, Terrakotta und Meeresblau.',{bg:'#f6efe3',haus:['#8b3a12','#ead7bf'],haupt:'#5b3a29',neben:'#9a6446',weg:'#c9ad8f',wasser:['#6a9ab5','#8fb6cc'],gruen:['#d6dab3','#dfe2c2'],frame:'#5b3a29',bar:'#5b3a29',text:'#f6efe3'},{r:24}),
 solar:TH('Solar Flare','Glühendes Orange auf tiefem Schwarz.',{bg:'#0e0b0a',haus:['#f26a1b','#2a1d18'],haupt:'#ff9a3c',neben:'#d9601c',weg:'#6b3a1f',wasser:['#1f1714','#1f1714'],gruen:['#18120f','#18120f'],frame:'#f26a1b',bar:'#0e0b0a',text:'#ff9a3c'},{haus:0.9}),
 vulkan:TH('Vulkanglas','Ultradunkles Glas mit kühlen blaugrauen Reflexen.',{bg:'#0d0f12',haus:['#8f99ad','#1b1f26'],haupt:'#c5cbd6',neben:'#8f99ad',weg:'#4a5160',wasser:['#232a35','#232a35'],gruen:['#151a1f','#151a1f'],frame:'#8f99ad',bar:'#0d0f12',text:'#c5cbd6'},{haus:0.8,frame:4}),
 blaupause:TH('Blaupause','Weiße Konstruktionslinien auf Blaupausen-Blau.',{bg:'#1d4e89',haus:['#ffffff','none'],haupt:'#ffffff',neben:'#dbe7f6',weg:'#9dbbe0',wasser:['#9cc3ef','#2a5d99'],frame:'#ffffff',bar:'#1d4e89',text:'#ffffff'},{haus:1,frame:4}),
 vintage:TH('Vintage-Papier','Alte Landkarte: Sepia, Papier und blasses Wasser.',{bg:'#efe4cc',haus:['#4a3a2a','#d9c7a3'],haupt:'#4a3a2a',neben:'#6e5a44',weg:'#a8916f',wasser:['#7f9fa6','#a9c3c8'],gruen:['#c9cba0','#d3d4ad'],frame:'#4a3a2a',bar:'#4a3a2a',text:'#efe4cc'},{frame:10}),
 wald:TH('Waldgrün','Tannengrün, Moos und Nebel.',{bg:'#eef0e6',haus:['#2f4a36','#c7d1bb'],haupt:'#1f3a2b',neben:'#4f6b55',weg:'#8ea18f',wasser:['#7fa8ae','#9fc4c9'],gruen:['#b7cba0','#b7cba0'],frame:'#1f3a2b',bar:'#1f3a2b',text:'#eef0e6'},{r:20}),
 tusche:TH('Tusche & Rot','Japanische Tuschezeichnung mit rotem Akzent.',{bg:'#f4f1ea',haus:['#1a1a1a','none'],haupt:'#c0392b',neben:'#1a1a1a',weg:'#9a958c',wasser:['#b9b4aa','#dcd8cf'],frame:'#1a1a1a',bar:'#1a1a1a',text:'#f4f1ea'},{haus:1}),
 pastell:TH('Pastell','Sanftes Rosa, Flieder und Himmelblau.',{bg:'#fdf6f0',haus:['#e8a0b4','#fbe1e8'],haupt:'#7fb7d9',neben:'#b8a6d9',weg:'#d8cde8',wasser:['#a9d3e8','#cfe8f3'],gruen:['#dcefd6','#dcefd6'],frame:'#b8a6d9',bar:'#b8a6d9',text:'#ffffff'},{r:36,frame:8}),
});
['umriss','dunkel','minimal','strassen'].forEach(k=>{const p=PRESETS[k];p.dots=[p.bg==='none'?'#ffffff':p.bg,p.cls.haupt.s,p.cls.haus.f!=='none'?p.cls.haus.f:p.cls.haus.s,p.frame.color]});
/* Standard-Kartenstile (gerenderte Karte) */
const BASES={
 liberty:{name:'Klassisch',dots:['#f8f4f0','#ffffff','#fcd6a4','#a0c8f0'],style:'https://tiles.openfreemap.org/styles/liberty'},
 positron:{name:'Hell',dots:['#fafaf8','#e2e2e2','#d4dadc','#9a9a9a'],style:'https://tiles.openfreemap.org/styles/positron'},
 bright:{name:'Bunt',dots:['#f8f4f0','#fc8a5a','#fccd5a','#7fbfe8'],style:'https://tiles.openfreemap.org/styles/bright'},
 dark:{name:'Dunkel',dots:['#0e0e0e','#2a2a2a','#3d3d3d','#6a6a6a'],style:'https://tiles.openfreemap.org/styles/dark'},
 fiord:{name:'Fjord',dots:['#45516e','#38435c','#5a6a8a','#a5b3cc'],style:'https://tiles.openfreemap.org/styles/fiord'},
 satellit:{name:'Satellit',dots:['#3d4a2c','#6b7a4a','#a39a7a','#2c3a4a'],style:'https://tiles.openfreemap.org/styles/liberty',sat:true},
};

/* ---------- Zustand ---------- */
let DATA=null; // {feats:[{id,k,d,closed}], MH, place, region, center:[lon,lat]}
let S=null, undoS=[], redoS=[], pending=null, sel=new Set(), selCls=null;
function newState(presetKey,keep){
  const p=PRESETS[presetKey];
  const st={preset:presetKey,cls:JSON.parse(JSON.stringify(p.cls)),ov:{},scale:1,bg:p.bg,
   frame:{...p.frame},bar:{color:p.bar.color,on:p.bar.on,h:150,auto:true,gap:20},
   title:{text:DATA?DATA.place.toUpperCase():'TITEL',font:'SgXB',size:72,ls:14,color:p.text,on:true},
   sub:{text:DATA?DATA.region:'',font:'SgFR',size:38,ls:1,color:p.text,on:true},
   attr:{on:true},view:defView(),mode:'art',base:'liberty',labels:true};
  Object.keys(CLS).forEach(k=>{if(st.cls[k].h===undefined)st.cls[k].h=false});
  if(keep){st.view={...keep.view};st.title={...keep.title,color:p.text};st.sub={...keep.sub,color:p.text};st.attr={...keep.attr};st.bar.gap=keep.bar.gap;st.bar.auto=keep.bar.auto;st.bar.h=keep.bar.h;st.mode=keep.mode;st.base=keep.base;st.labels=keep.labels}
  return st;
}
function defView(){const a=DATA?DATA.MH0/MW:0.8805;return {cx:MW/2,cy:(DATA?DATA.MH0:MW*a)/2,z:1,a}}
function vLimits(v){const e=DATA.ext,MH=MW*v.a;const zmin=Math.max(MW/(e.x1-e.x0),MH/(e.y1-e.y0))*1.0001;return {zmin,zmax:8,MH}}
function clampView(v){const L=vLimits(v);v.z=Math.min(L.zmax,Math.max(L.zmin,v.z));const hw=MW/2/v.z,hh=L.MH/2/v.z,e=DATA.ext;
  v.cx=Math.min(e.x1-hw,Math.max(e.x0+hw,v.cx));v.cy=Math.min(e.y1-hh,Math.max(e.y0+hh,v.cy));return v}
function vT(g){const v=S.view;return `translate(${g.mx.toFixed(2)},${g.my.toFixed(2)}) translate(${MW/2},${(g.MH/2).toFixed(2)}) scale(${v.z.toFixed(5)}) translate(${(-v.cx).toFixed(2)},${(-v.cy).toFixed(2)})`}
function visRect(){const v=S.view,MH=MW*v.a,hw=MW/2/v.z,hh=MH/2/v.z;return [v.cx-hw,v.cy-hh,v.cx+hw,v.cy+hh]}
function snap(){return JSON.stringify(S)}
function begin(){if(pending===null)pending=snap()}
function commit(){if(pending!==null){if(pending!==snap()){undoS.push(pending);if(undoS.length>150)undoS.shift();redoS=[]}pending=null}updUndo()}
function change(fn){begin();fn();commit();render()}
function updUndo(){if(S&&S.mode==='std'&&DATA&&!RASTER.has(rasterKey()))setTimeout(ensureRaster,0);$('undo').disabled=!undoS.length;$('redo').disabled=!redoS.length}
function eff(f){const c=S.cls[f.k],o=S.ov[f.id]||{};return {s:o.s??c.s,f:o.f??c.f,w:(o.w??c.w),h:o.h??c.h}}

/* ---------- Schritt 1: Karte & Suche ---------- */
let map=null;
function initMap(){
  try{
    if(!window.maplibregl)throw new Error('maplibre');
    map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/positron',center:[11.2111,49.8514],zoom:15.3,attributionControl:{compact:false}});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
    map.on('move',sizeInfo);map.on('load',()=>{placeFrame();sizeInfo()});
    map.on('error',e=>{});
  }catch(e){$('maperr').style.display='flex'}
  window.addEventListener('resize',()=>{placeFrame();sizeInfo()});
  placeFrame();
}
function fitTo(b){if(!b||!map||!map.fitBounds)return;const ov=$('frameov'),wrap=$('mapwrap');try{map.resize();map.fitBounds([[b.w,b.s],[b.e,b.n]],{padding:{left:ov.offsetLeft,top:ov.offsetTop,right:Math.max(0,wrap.clientWidth-ov.offsetLeft-ov.offsetWidth),bottom:Math.max(0,wrap.clientHeight-ov.offsetTop-ov.offsetHeight)},duration:0})}catch(e){}}
let mapInit=false;
function openPicker(focusSearch){$('picker').classList.remove('hidden');setGen('');
  if(!mapInit){mapInit=true;initMap()}
  setTimeout(()=>{if(map)map.resize();placeFrame();if(lastB)fitTo(lastB);sizeInfo();if(focusSearch)$('q').focus()},40)}
function closePicker(){$('picker').classList.add('hidden');$('results').classList.add('hidden')}
$('pClose').onclick=closePicker;$('pCancel').onclick=closePicker;
['openPicker2','openPicker3'].forEach(id=>$(id).onclick=()=>openPicker(true));
document.querySelectorAll('#fmt1 button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#fmt1 button').forEach(x=>x.classList.toggle('on',x===b));$('aspect').value=b.dataset.a;placeFrame();sizeInfo()});
function placeFrame(){
  const wrap=$('mapwrap'),W=wrap.clientWidth,H=wrap.clientHeight,a=+$('aspect').value;
  let w=W*0.62,h=w*a;if(h>H*0.82){h=H*0.82;w=h/a}
  const ov=$('frameov');ov.style.width=w+'px';ov.style.height=h+'px';ov.style.left=(W-w)/2+'px';ov.style.top=(H-h)/2+'px';
}
function frameBounds(){
  const wrap=$('mapwrap'),ov=$('frameov');const x0=ov.offsetLeft,y0=ov.offsetTop,x1=x0+ov.offsetWidth,y1=y0+ov.offsetHeight;
  const nw=map.unproject([x0,y0]),se=map.unproject([x1,y1]);
  return {w:nw.lng,n:nw.lat,e:se.lng,s:se.lat};
}
function meters(b){const R=6371000,lat=(b.n+b.s)/2*Math.PI/180;return {w:(b.e-b.w)*Math.PI/180*R*Math.cos(lat),h:(b.n-b.s)*Math.PI/180*R}}
function sizeInfo(){if(!map)return;try{const m=meters(frameBounds());$('sizeinfo').textContent=`Rahmen: ca. ${Math.round(m.w)} × ${Math.round(m.h)} m.`+(m.w>3500?' Sehr groß – die Karte wird sehr dicht.':'')}catch(e){}}
function attachSearch(inp,btn,box,onPick){
  async function run(){const q=$(inp).value.trim();if(!q)return;const R=$(box);R.classList.remove('hidden');R.innerHTML='<div class="info">Suche …</div>';
    try{const r=await fetch('https://photon.komoot.io/api/?lang=de&limit=6&q='+encodeURIComponent(q));const j=await r.json();R.innerHTML='';
      if(!j.features||!j.features.length){R.innerHTML='<div class="info">Nichts gefunden. Versuche Ort und Gemeinde, z. B. „Siegritz Heiligenstadt“.</div>';return}
      j.features.forEach(f=>{const p=f.properties;const b=document.createElement('button');
        const sub=[p.city&&p.city!==p.name?p.city:'',p.county,p.state,p.country].filter(Boolean).join(', ');
        b.innerHTML=`<b>${esc(p.name||'(ohne Namen)')}</b><small>${esc(sub)}</small>`;
        b.onclick=()=>{R.classList.add('hidden');onPick(f,q)};R.appendChild(b)});
    }catch(e){R.innerHTML='<div class="info" style="color:var(--err)">Keine Verbindung zum Suchdienst. Ist das Internet da? Falls du die Datei in einer App-Vorschau geöffnet hast: Die blockiert Internetzugriffe – öffne sie im Browser (Chrome, Safari, Edge).</div>'}}
  $(btn).onclick=run;$(inp).addEventListener('keydown',e=>{if(e.key==='Enter')run();if(e.key==='Escape')$(box).classList.add('hidden')});
  document.addEventListener('pointerdown',e=>{if(!$(box).contains(e.target)&&e.target!==$(inp)&&e.target!==$(btn))$(box).classList.add('hidden')});
  return run;
}
function pickPlace(f,q){const p=f.properties;const [lon,lat]=f.geometry.coordinates;window._place={name:p.name||q,region:p.county||p.state||'',lon,lat};
  $('q').value=p.name||q;
  const small=/^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm|house|street)$/.test(p.osm_value||p.type||'');
  const go=()=>{if(!map)return;if(p.extent&&!small){const e=p.extent;map.fitBounds([[e[0],e[3]],[e[2],e[1]]],{padding:90,maxZoom:16.2,minZoom:13,duration:0})}else map.jumpTo({center:[lon,lat],zoom:15.4});setTimeout(sizeInfo,50)};
  if($('picker').classList.contains('hidden')){openPicker(false);setTimeout(go,80)}else go()}
attachSearch('q','go','results',pickPlace);
const landingRun=attachSearch('lq','lgo','lresults',pickPlace);
document.querySelectorAll('.examples .chip').forEach(c=>c.onclick=()=>{$('lq').value=c.dataset.q;landingRun()});

/* ---------- OSM laden ---------- */
const OVERPASS=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const CACHE=[]; // {bb:{w,e,n,s}, osm}
function inside(b,c){return b.w>=c.w&&b.e<=c.e&&b.s>=c.s&&b.n<=c.n}
function expand(b,f){const dx=(b.e-b.w)*f,dy=(b.n-b.s)*f;return {w:b.w-dx,e:b.e+dx,s:b.s-dy,n:b.n+dy}}
function qOne(url,q,signal){return fetch(url,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'},signal})
  .then(async r=>{if(!r.ok)throw new Error(r.status===429?'ausgelastet':r.status===504?'Zeitüberschreitung':'HTTP '+r.status);const j=await r.json();
    if(j&&j.remark&&/runtime error|timed out|out of memory/i.test(j.remark)&&!(j.elements||[]).length)throw new Error('Zeitüberschreitung');return j})}
async function fetchOSM(b){
  const hit=CACHE.find(c=>inside(b,c.bb));if(hit)return hit;
  const mw=meters(b).w;const big=expand(b,mw<1500?0.3:mw<3000?0.2:0.1);
  const bb=`${big.s.toFixed(6)},${big.w.toFixed(6)},${big.n.toFixed(6)},${big.e.toFixed(6)}`;
  const q=`[out:json][timeout:90][maxsize:134217728][bbox:${bb}];(way["building"];relation["building"];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|residential|unclassified|living_street|service|road|pedestrian|track|path|footway|cycleway|bridleway|steps)$"];way["waterway"];way["natural"="water"];relation["natural"="water"];way["railway"~"^(rail|light_rail|narrow_gauge)$"];way["leisure"="park"];way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"];way["natural"~"^(wood|scrub|grassland)$"];relation["landuse"="forest"];relation["natural"="wood"];);out geom qt;`;
  const ctrls=[],errs=[];let done=false;
  try{
    const osm=await new Promise((resolve,reject)=>{
      let started=0,failed=0;const timers=[];
      const start=()=>{if(done||started>=OVERPASS.length)return;const i=started++;const c=new AbortController();ctrls.push(c);
        const to=setTimeout(()=>c.abort(),150000);
        qOne(OVERPASS[i],q,c.signal).then(j=>{clearTimeout(to);if(!done){done=true;resolve(j)}})
          .catch(e=>{clearTimeout(to);errs.push(OVERPASS[i].split('/')[2]+': '+(e.name==='AbortError'?'keine Antwort nach 2,5 Minuten':e.message==='Failed to fetch'?'nicht erreichbar':e.message));failed++;
            if(!done){if(failed>=OVERPASS.length){done=true;reject(new Error(errs.join(' · ')))}else start()}})};
      start();
      timers.push(setTimeout(start,8000),setTimeout(start,16000));
    });
    ctrls.forEach(c=>{try{c.abort()}catch(e){}});
    const res={bb:big,osm};CACHE.unshift(res);if(CACHE.length>6)CACHE.pop();
    return res;
  }finally{done=true}
}
function classify(t){
  if(!t)return null;
  if(t.building)return 'haus';
  const h=t.highway;
  if(h){if(/^(motorway|trunk|primary|secondary|tertiary)(_link)?$/.test(h))return 'haupt';
    if(/^(residential|unclassified|living_street|service|road|pedestrian)$/.test(h))return 'neben';
    if(/^(track|path|footway|cycleway|bridleway|steps)$/.test(h))return 'weg';return null}
  if(t.waterway||t.natural==='water')return 'wasser';
  if(t.railway)return 'bahn';
  if(t.leisure==='park'||/^(forest|grass|meadow|recreation_ground|village_green)$/.test(t.landuse||'')||/^(wood|scrub|grassland)$/.test(t.natural||''))return 'gruen';
  return null;
}
function merc(lon,lat){const x=(lon+180)/360;const s=Math.sin(lat*Math.PI/180);const y=0.5-Math.log((1+s)/(1-s))/(4*Math.PI);return [x,y]}
/* ---------- Vektorkacheln (OpenFreeMap, OpenMapTiles-Schema) ---------- */
function PB(buf){this.b=buf;this.p=0;this.e=buf.length}
PB.prototype.v=function(){let r=0,s=0,c;do{c=this.b[this.p++];if(s<28)r|=(c&0x7f)<<s;else r+=(c&0x7f)*Math.pow(2,s);s+=7}while(c&0x80);return r>>>0===r?r:r};
PB.prototype.vb=function(){let r=0,m=1,c;do{c=this.b[this.p++];r+=(c&0x7f)*m;m*=128}while(c&0x80);return r};
PB.prototype.bytes=function(){const n=this.vb();const o=this.b.subarray(this.p,this.p+n);this.p+=n;return o};
PB.prototype.skip=function(t){if(t===0)this.vb();else if(t===1)this.p+=8;else if(t===2){const n=this.vb();this.p+=n}else if(t===5)this.p+=4};
const TD=new TextDecoder();
function packed(u8){const p=new PB(u8),a=[];while(p.p<p.e)a.push(p.vb());return a}
function decodeValue(u8){const p=new PB(u8);let v=null;while(p.p<p.e){const k=p.vb(),f=k>>3,t=k&7;
  if(f===1)v=TD.decode(p.bytes());else if(f===2){v=new DataView(p.b.buffer,p.b.byteOffset+p.p,4).getFloat32(0,true);p.p+=4}
  else if(f===3){v=new DataView(p.b.buffer,p.b.byteOffset+p.p,8).getFloat64(0,true);p.p+=8}
  else if(f===4||f===5)v=p.vb();else if(f===6){const n=p.vb();v=(n%2?-(n+1)/2:n/2)}else if(f===7)v=!!p.vb();else p.skip(t)}return v}
function decodeTile(buf,want){const p=new PB(new Uint8Array(buf)),layers={};
  while(p.p<p.e){const k=p.vb();if((k>>3)===3&&(k&7)===2){const L=new PB(p.bytes());let name='',ext=4096;const feats=[],keys=[],vals=[];
      while(L.p<L.e){const kk=L.vb(),f=kk>>3,t=kk&7;
        if(f===1)name=TD.decode(L.bytes());else if(f===2)feats.push(L.bytes());else if(f===3)keys.push(TD.decode(L.bytes()));else if(f===4)vals.push(decodeValue(L.bytes()));else if(f===5)ext=L.vb();else L.skip(t)}
      if(!want.includes(name))continue;
      layers[name]={ext,features:feats.map(fb=>{const F=new PB(fb);let id=null,tags=[],type=0,geom=[];
        while(F.p<F.e){const kk=F.vb(),f=kk>>3,t=kk&7;if(f===1)id=F.vb();else if(f===2)tags=packed(F.bytes());else if(f===3)type=F.vb();else if(f===4)geom=packed(F.bytes());else F.skip(t)}
        const props={};for(let i=0;i+1<tags.length;i+=2)props[keys[tags[i]]]=vals[tags[i+1]];
        const rings=[];let x=0,y=0,cur=null,i=0;
        while(i<geom.length){const c=geom[i++],cmd=c&7,n=c>>3;
          if(cmd===1||cmd===2){for(let j=0;j<n;j++){const dx=geom[i++],dy=geom[i++];x+=(dx>>>1)^(-(dx&1));y+=(dy>>>1)^(-(dy&1));if(cmd===1){cur=[];rings.push(cur)}cur.push(x,y)}}
          else if(cmd===7){if(cur)cur.closed=true}}
        return {id,type,props,rings}})};
    }else p.skip(k&7)}
  return layers}
let TILEURL=null;const TILECACHE=new Map();
async function tileTemplate(){if(TILEURL)return TILEURL;const r=await fetch('https://tiles.openfreemap.org/planet');if(!r.ok)throw new Error('TileJSON HTTP '+r.status);const j=await r.json();TILEURL={url:j.tiles[0],maxz:Math.min(14,j.maxzoom||14)};return TILEURL}
function lon2t(lon,z){return Math.floor((lon+180)/360*Math.pow(2,z))}
function lat2t(lat,z){const s=Math.sin(lat*Math.PI/180);return Math.floor((0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*Math.pow(2,z))}
async function fetchTiles(big){
  const T=await tileTemplate();const z=T.maxz;
  const x0=lon2t(big.w,z),x1=lon2t(big.e,z),y0=lat2t(big.n,z),y1=lat2t(big.s,z);
  const list=[];for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)list.push({z,x,y});
  if(list.length>160)throw new Error('Ausschnitt zu groß');
  const want=['building','transportation','water','waterway','park','landcover'];
  let idx=0;const out=[];
  async function worker(){while(idx<list.length){const t=list[idx++];const key=t.z+'/'+t.x+'/'+t.y;
    if(!TILECACHE.has(key)){const r=await fetch(T.url.replace('{z}',t.z).replace('{x}',t.x).replace('{y}',t.y));
      if(r.status===204||r.status===404){TILECACHE.set(key,{});}else{if(!r.ok)throw new Error('Kachel HTTP '+r.status);TILECACHE.set(key,decodeTile(await r.arrayBuffer(),want))}}
    out.push({...t,layers:TILECACHE.get(key)})}}
  await Promise.all(Array.from({length:Math.min(8,list.length)},worker));
  return out;
}
function classifyTile(layer,p,type){
  if(layer==='building')return type===3?'haus':null;
  if(layer==='transportation'){if(type!==2||p.brunnel==='tunnel')return null;const c=p.class;
    if(/^(motorway|trunk|primary|secondary|tertiary)$/.test(c))return 'haupt';
    if(/^(minor|service|raceway|busway)$/.test(c))return 'neben';
    if(/^(track|path)$/.test(c))return 'weg';
    if(/^(rail|transit)$/.test(c))return 'bahn';return null}
  if(layer==='water')return type===3?'wasser':null;
  if(layer==='waterway')return type===2&&p.brunnel!=='tunnel'?'wasser':null;
  if(layer==='park')return type===3?'gruen':null;
  if(layer==='landcover')return type===3&&/^(wood|grass|wetland)$/.test(p.class)?'gruen':null;
  return null}
function buildDataTiles(tiles,b,big,place){
  const [x0,y0]=merc(b.w,b.n),[x1,y1]=merc(b.e,b.s);const sc=MW/(x1-x0);const MH=(y1-y0)*sc;
  const [ex0,ey0]=merc(big.w,big.n),[ex1,ey1]=merc(big.e,big.s);
  const feats=[],tileRects=[];let n=0;
  tiles.forEach((t,ti)=>{const Z=Math.pow(2,t.z);
    tileRects.push([((t.x/Z)-x0)*sc,((t.y/Z)-y0)*sc,sc/Z]);
    Object.entries(t.layers||{}).forEach(([lname,L])=>{const f=1/(L.ext*Z);
      L.features.forEach(ft=>{const k=classifyTile(lname,ft.props,ft.type);if(!k)return;
        let d='',pts=[],bx=[1e9,1e9,-1e9,-1e9];
        ft.rings.forEach(r=>{for(let i=0;i<r.length;i+=2){const X=((t.x+r[i]/L.ext)/Z-x0)*sc,Y=((t.y+r[i+1]/L.ext)/Z-y0)*sc;d+=(i?'L':'M')+X.toFixed(1)+' '+Y.toFixed(1);pts.push(X,Y);if(X<bx[0])bx[0]=X;if(Y<bx[1])bx[1]=Y;if(X>bx[2])bx[2]=X;if(Y>bx[3])bx[3]=Y}if(ft.type===3)d+='Z'});
        if(!d)return;const fid='f'+(n++);
        const gid=(lname==='building'&&ft.id!=null)?'b'+ft.id:fid;
        feats.push({id:gid,fid,k,a:ft.type===3,d,pts,bx,t:ti})})})});
  const E=[(ex0-x0)*sc,(ey0-y0)*sc,(ex1-x0)*sc,(ey1-y0)*sc];
  return {feats,tiles:tileRects,MH0:MH,ext:{x0:E[0],y0:E[1],x1:E[2],y1:E[3]},proj:{x0,y0,sc},place:place.name,region:place.region,center:place.center,src:'tiles'};
}
function buildData(osm,b,big,place){
  const [x0,y0]=merc(b.w,b.n),[x1,y1]=merc(b.e,b.s);const sc=MW/(x1-x0);const MH=(y1-y0)*sc;
  const Pn=(lon,lat)=>{const [x,y]=merc(lon,lat);return [(x-x0)*sc,(y-y0)*sc]};
  const [ex0,ey0]=Pn(big.w,big.n),[ex1,ey1]=Pn(big.e,big.s);
  const feats=[];
  const mk=(rings,closeAll)=>{let d='',pts=[],bx=[1e9,1e9,-1e9,-1e9];
    rings.forEach(g=>{g.forEach((p,i)=>{const [x,y]=Pn(p.lon,p.lat);d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);pts.push(x,y);if(x<bx[0])bx[0]=x;if(y<bx[1])bx[1]=y;if(x>bx[2])bx[2]=x;if(y>bx[3])bx[3]=y});if(closeAll)d+='Z'});
    return {d,pts,bx}};
  (osm.elements||[]).forEach(el=>{
    const k=classify(el.tags);if(!k)return;
    if(el.type==='way'&&el.geometry&&el.geometry.length>1){
      const g=el.geometry;const closed=g.length>3&&g[0].lat===g[g.length-1].lat&&g[0].lon===g[g.length-1].lon;
      const area=(k==='haus')||(k==='gruen')||(k==='wasser'&&el.tags.natural==='water');
      const r=mk([g],area&&closed);feats.push({id:'w'+el.id,fid:'w'+el.id,k,a:area,t:-1,...r})}
    else if(el.type==='relation'&&el.members){
      const rings=el.members.filter(m=>m.geometry&&m.geometry.length>1&&(m.role==='outer'||m.role==='inner'||m.role==='')).map(m=>m.geometry);
      if(rings.length){const r=mk(rings,true);feats.push({id:'r'+el.id,fid:'r'+el.id,k,a:true,t:-1,...r})}}
  });
  return {feats,tiles:[],MH0:MH,ext:{x0:ex0,y0:ey0,x1:ex1,y1:ey1},proj:{x0,y0,sc},place:place.name,region:place.region,center:place.center,src:'overpass'};
}
let lastB=null,genBusy=false;
const LOADMSG=['Wir rollen die Landkarte aus …','Häuser werden gezählt – bitte nicht wackeln …','Der Kartograf spitzt seinen Bleistift …','Straßen werden glatt gebügelt …','Kurze Kaffeepause für die Maschine – mit Milch, ohne Zucker.','Feldwege werden nachgemessen …','Noch ein Schluck Kaffee … und weiter geht’s.','Die Dächer werden einzeln aufgesetzt …','Fast geschafft – wir polieren noch die Ecken …'];
const LOADSUB=['Daten kommen frisch aus OpenStreetMap','Wir laden etwas mehr Umgebung mit – zum Feinjustieren','Die öffentlichen Kartenserver haben gerade viel zu tun – wir bleiben dran','Dauert heute etwas länger – der Kaffee ist schon nachgefüllt'];
let ldT=null,ldStart=0;
function startLoader(){const L=$('loader');L.style.display='block';$('loadBar').style.transition='none';$('loadBar').style.width='0';void $('loadBar').offsetWidth;$('loadBar').style.transition='width .6s ease';
  ldStart=Date.now();let i=0;$('loadText').textContent=LOADMSG[0];$('loadSub').textContent=LOADSUB[0];
  $('loadText').style.opacity=1;let n=0;
  clearInterval(ldT);ldT=setInterval(()=>{n++;const t=(Date.now()-ldStart)/1000;$('loadBar').style.width=(92*(1-Math.exp(-t/9))).toFixed(1)+'%';
    if(n%28===0){i=(i+1)%LOADMSG.length;const el=$('loadText');el.style.opacity=0;setTimeout(()=>{el.textContent=LOADMSG[i];el.style.opacity=1},300);
      $('loadSub').textContent=t>45?LOADSUB[3]:t>18?LOADSUB[2]:t>6?LOADSUB[1]:LOADSUB[0]}},100)}
function stopLoader(ok){clearInterval(ldT);if(ok){$('loadBar').style.width='100%';$('loadText').textContent='Fertig – viel Spaß beim Gestalten!';setTimeout(()=>{$('loader').style.display='none'},450)}else $('loader').style.display='none'}
function setGen(t,c){const m=$('pStatus');m.textContent=t;m.className=c||''}
function boundsChanged(){if(!map||!lastB)return !!map;const b=frameBounds();const tol=(lastB.e-lastB.w)*0.01;return ['w','e','n','s'].some(k=>Math.abs(b[k]-lastB[k])>tol)}
async function generate(){
  if(genBusy)return false;
  if(!map){setGen('Die Vorschaukarte ist nicht geladen.','err');return false}
  const b=frameBounds();const m=meters(b);
  if(m.w>6000){setGen('Der Ausschnitt ist zu groß (über 6 km breit). Bitte näher heranzoomen.','err');return false}
  genBusy=true;$('gen').disabled=true;setGen('');let ldTimer=setTimeout(startLoader,350);const cached=false;
  try{let data=null;const c0=map.getCenter();const pl0=window._place||{name:'',region:''};
    const place0={name:pl0.name||'Mein Ort',region:pl0.region||'',center:[c0.lng,c0.lat]};
    try{const mw=meters(b).w;const big=expand(b,mw<1500?0.5:mw<3000?0.35:0.2);const tiles=await fetchTiles(big);data=buildDataTiles(tiles,b,big,place0);if(!data.feats.length)data=null}catch(e){console.warn('Kacheln fehlgeschlagen, nutze Overpass',e);data=null}
    if(!data){if(!$('loader').style.display||$('loader').style.display==='none'){clearTimeout(ldTimer);startLoader()}
      const res=await fetchOSM(b);
    const c=map.getCenter();const pl=window._place||{name:'',region:''};
    const place={name:pl.name||'Mein Ort',region:pl.region||'',center:[c.lng,c.lat]};
    data=buildData(res.osm,b,res.bb,place);}
    clearTimeout(ldTimer);
    if(!data.feats.length)throw new Error('In diesem Ausschnitt wurden keine Kartenelemente gefunden');
    const wasShown=$('loader').style.display==='block';stopLoader(true);if(wasShown)await new Promise(r=>setTimeout(r,350));
    lastB=b;closePicker();loadData(data);setGen('');
    genBusy=false;$('gen').disabled=false;return true;
  }catch(e){clearTimeout(ldTimer);stopLoader(false);setGen('Das hat leider nicht geklappt: '+(e&&e.message||'Fehler')+'. Die Kartenserver sind gerade überlastet – bitte gleich noch einmal auf „Ausschnitt übernehmen“ klicken.','err')}
  genBusy=false;$('gen').disabled=false;return false;
}
$('gen').onclick=generate;
function loadData(data){
  const prev=DATA,prevS=S;
  DATA=data;FMAP.clear();
  if(prevS){
    S=JSON.parse(JSON.stringify(prevS));
    const ids=new Set(DATA.feats.map(f=>f.id));Object.keys(S.ov).forEach(id=>{if(!ids.has(id))delete S.ov[id]});
    if(prev&&S.title.text===String(prev.place||'').toUpperCase())S.title.text=String(DATA.place).toUpperCase();
    if(prev&&S.sub.text===prev.region&&DATA.region)S.sub.text=DATA.region;
    S.view=defView();undoS=[];redoS=[];
  }else{S=newState('umriss');undoS=[];redoS=[]}
  sel.clear();selCls=null;
  const btns=$('grpbtns');btns.innerHTML='';
  Object.keys(CLS).forEach(k=>{const n=new Set(DATA.feats.filter(f=>f.k===k).map(f=>f.id)).size;if(!n)return;const b=document.createElement('button');b.className='chip';b.dataset.k=k;b.innerHTML=`${CLS[k]} <span style="color:var(--soft)">${n}</span>`;b.onclick=()=>{sel.clear();selCls=k;drawSel();panel()};btns.appendChild(b)});
  $('landing').classList.add('hidden');$('side').classList.remove('nodata');$('hdrEdit').classList.remove('hidden');
  $('placeName').textContent=DATA.place||'Mein Ort';$('placeInfo').textContent=[DATA.region,`${new Set(DATA.feats.map(f=>f.id)).size} Kartenelemente`].filter(Boolean).join(' · ');
  updUndo();render();renderThumbs();
}
function renderThumbs(){if(!DATA)return;const v=defView(),MH=MW*v.a;
  document.querySelectorAll('#styles button[data-p]').forEach(b=>{const p=PRESETS[b.dataset.p];let o=`<svg viewBox="${MW*0.18} ${MH*0.18} ${MW*0.64} ${MW*0.64}" preserveAspectRatio="xMidYMid slice">`;
    o+=`<rect x="-2000" y="-2000" width="6000" height="6000" fill="${p.bg!=='none'?p.bg:'#ffffff'}"/>`;
    ORDER.forEach(k=>{const c=p.cls[k];if(c.h)return;DATA.feats.forEach(f=>{if(f.k!==k)return;const bx=f.bx;if(bx[2]<0||bx[0]>MW||bx[3]<0||bx[1]>MH)return;
      o+=`<path d="${f.d}" fill="${f.a?c.f:'none'}" stroke="${c.s}" stroke-width="${c.w*1.6}" stroke-linecap="round" stroke-linejoin="round"/>`})});
    o+=`<rect x="-2000" y="-2000" width="6000" height="6000" fill="none"/>`;
    b.querySelector('.th').innerHTML=o+'</svg>'})}

/* ---------- Poster-Geometrie & SVG ---------- */
function geo(){
  const sw=S.frame.w,p=S.frame.pad,MH=MW*S.view.a;
  const W=MW+2*p+2*sw,mx=sw+p,my=sw+p;
  const t=S.title,u=S.sub;
  const capT=t.on&&t.text?t.size*CAP[t.font]:0,capS=u.on&&u.text?u.size*CAP[u.font]:0;
  const gap=(capT&&capS)?S.bar.gap:0,block=capT+gap+capS;
  let barH=0;if(S.bar.on||block>0)barH=S.bar.auto?Math.round(block+60+sw/2):S.bar.h;
  const barTop=my+MH+p,H=barTop+(barH>0?barH:sw);
  const top=barTop+(barH-sw/2-block)/2;
  return {W,H,sw,p,mx,my,MH,barTop,barH,yT:top+capT,yS:top+capT+gap+capS};
}
function buildSVG(forExport){
  const g=geo(),f=S.frame,R=Math.max(0,f.r),ri=Math.max(0,R-f.w/2);
  let o=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.W.toFixed(1)} ${g.H.toFixed(1)}" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}">`;
  const fonts=new Set();[S.title,S.sub].forEach(t=>{if(t.on&&t.text)fonts.add(t.font)});if(S.attr.on)fonts.add('SgMD');
  o+='<defs>';
  if(forExport&&fonts.size){o+='<style>';fonts.forEach(n=>{o+=`@font-face{font-family:'${n}';src:url(data:font/woff;base64,${FONTDATA[n]}) format('woff');}`});o+='</style>'}
  o+=`<clipPath id="cMap"><rect x="0" y="0" width="${MW}" height="${g.MH.toFixed(1)}"/></clipPath>`;
  o+=`<clipPath id="cIn"><rect x="${f.w}" y="${f.w}" width="${(g.W-2*f.w).toFixed(1)}" height="${(g.H-2*f.w).toFixed(1)}" rx="${ri}" ry="${ri}"/></clipPath>`;
  (DATA.tiles||[]).forEach((r,i)=>{o+=`<clipPath id="tc${i}"><rect x="${r[0].toFixed(2)}" y="${r[1].toFixed(2)}" width="${r[2].toFixed(2)}" height="${r[2].toFixed(2)}"/></clipPath>`});
  o+=`<clipPath id="cOut"><rect x="0" y="0" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" rx="${R+f.w/2}" ry="${R+f.w/2}"/></clipPath></defs>`;
  if(S.bg!=='none')o+=`<rect id="kartenhintergrund" x="${f.w/2}" y="${f.w/2}" width="${(g.W-f.w).toFixed(1)}" height="${(g.H-f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${S.bg}"/>`;
  o+=`<g id="karte" clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g transform="${vT(g).replace(/^translate\([^)]*\) /,'')}">`;
  const sc=S.scale/S.view.z,vr=visRect();
  if(S.mode==='std'){const E=DATA.ext,R0=RASTER.get(rasterKey());
    o+=R0?`<image href="${R0.url}" x="${E.x0.toFixed(2)}" y="${E.y0.toFixed(2)}" width="${(E.x1-E.x0).toFixed(2)}" height="${(E.y1-E.y0).toFixed(2)}" preserveAspectRatio="none"/>`
      :`<rect x="${E.x0}" y="${E.y0}" width="${E.x1-E.x0}" height="${E.y1-E.y0}" fill="#e9e7e2"/>`}
  else ORDER.forEach(k=>{const groups=new Map();
    DATA.feats.forEach(ft=>{if(ft.k!==k)return;const e=eff(ft);if(e.h)return;const bx=ft.bx;if(bx[2]<vr[0]||bx[0]>vr[2]||bx[3]<vr[1]||bx[1]>vr[3])return;
      const lc=k==='haus'?'stroke-linejoin="miter"':'stroke-linecap="round" stroke-linejoin="round"';
      const fill=ft.a?e.f:'none';
      const p=`<path id="${ft.fid}" d="${ft.d}" fill="${fill}" fill-rule="evenodd" stroke="${e.s}" stroke-width="${+(e.w*sc).toFixed(3)}" ${lc}${forExport?'':' data-k="'+k+'" data-g="'+ft.id+'"'}/>`;
      const t=ft.t??-1;if(!groups.has(t))groups.set(t,[]);groups.get(t).push(p)});
    groups.forEach((arr,t)=>{o+=t>=0?`<g clip-path="url(#tc${t})">${arr.join('')}</g>`:arr.join('')})});
  o+='</g></g></g></g>';
  if(S.bar.on&&g.barH>0)o+=`<rect id="balken" x="${f.w/2}" y="${g.barTop.toFixed(1)}" width="${(g.W-f.w).toFixed(1)}" height="${(g.H-g.barTop).toFixed(1)}" fill="${S.bar.color}" clip-path="url(#cOut)"/>`;
  if(f.w>0)o+=`<rect id="rahmen" x="${f.w/2}" y="${f.w/2}" width="${(g.W-f.w).toFixed(1)}" height="${(g.H-f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="none" stroke="${f.color}" stroke-width="${f.w}"/>`;
  [['title',g.yT],['sub',g.yS]].forEach(([k,y])=>{const t=S[k];if(!t.on||!t.text)return;
    o+=`<text id="${k==='title'?'titel':'untertitel'}" x="${(g.W/2+t.ls/2).toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="${t.font}" font-size="${t.size}" letter-spacing="${t.ls}" fill="${t.color}">${esc(t.text)}</text>`});
  if(S.attr.on){const inBar=S.bar.on&&g.barH>0;const col=inBar?S.title.color:(S.mode==='std'?(BASES[S.base].sat||S.base==='dark'||S.base==='fiord'?'#ffffff':'#333333'):S.cls.haupt.s);const x=g.W-g.sw-g.p-4;const y=inBar?g.H-g.sw-8:g.my+g.MH-6;
    const at=S.mode==='std'?(BASES[S.base].sat?'© Esri, Maxar, Earthstar Geographics · © OpenMapTiles · © OpenStreetMap-Mitwirkende':'© OpenMapTiles · © OpenStreetMap-Mitwirkende'):'© OpenStreetMap-Mitwirkende';
    o+=`<text id="quelle" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" font-family="SgMD" font-size="11" fill="${col}" fill-opacity="0.75">${at}</text>`}
  return o+'</svg>';
}
const poster=$('poster');
function render(){
  if(!DATA)return;
  const svg=buildSVG(false);
  const tmp=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement;
  poster.setAttribute('viewBox',tmp.getAttribute('viewBox'));poster.innerHTML=tmp.innerHTML;
  const g=geo();
  const hits=document.createElementNS(NS,'g');hits.setAttribute('transform',vT(g));const hw=(12/S.view.z).toFixed(2);
  poster.querySelectorAll('path[data-k]').forEach(p=>{
    if(p.getAttribute('fill')!=='none'||p.dataset.k==='haus'){p.setAttribute('pointer-events','all');p.style.cursor='pointer';if(p.dataset.k==='haus')return}
    const h=document.createElementNS(NS,'path');h.setAttribute('d',p.getAttribute('d'));h.setAttribute('fill','none');h.setAttribute('stroke','transparent');h.setAttribute('stroke-width',hw);h.setAttribute('stroke-linecap','round');h.dataset.ref=p.dataset.g;hits.appendChild(h)});
  const hg=document.createElementNS(NS,'g');hg.setAttribute('clip-path','url(#cIn)');const hg2=document.createElementNS(NS,'g');hg2.setAttribute('clip-path','url(#cMapHit)');
  const cm=document.createElementNS(NS,'clipPath');cm.id='cMapHit';const cr=document.createElementNS(NS,'rect');cr.setAttribute('x',g.mx);cr.setAttribute('y',g.my);cr.setAttribute('width',MW);cr.setAttribute('height',g.MH);cm.appendChild(cr);poster.querySelector('defs').appendChild(cm);
  hg2.appendChild(hits);hg.appendChild(hg2);
  poster.insertBefore(hg,poster.querySelector('#balken')||poster.querySelector('#rahmen')||null);
  const fr=poster.querySelector('#rahmen');if(fr){fr.setAttribute('pointer-events','stroke');fr.style.cursor='pointer'}
  ['#balken','#titel','#untertitel'].forEach(q=>{const e=poster.querySelector(q);if(e)e.style.cursor='pointer'});
  drawSel();panel();zoom();syncTools();
}
const FMAP=new Map();
function frags(id){if(!FMAP.size&&DATA)DATA.feats.forEach(f=>{if(!FMAP.has(f.id))FMAP.set(f.id,[]);FMAP.get(f.id).push(f)});return FMAP.get(id)}
function feat(id){const a=frags(id);return a?a[0]:undefined}
function drawSel(){
  poster.querySelectorAll('.selov').forEach(e=>e.remove());
  const ov=document.createElementNS(NS,'g');ov.setAttribute('class','selov');ov.setAttribute('pointer-events','none');
  const g=geo();
  const ids=selCls?[...new Set(DATA.feats.filter(f=>f.k===selCls&&!eff(f).h).map(f=>f.id))]:[...sel];
  ids.forEach(id=>{const fr=frags(id);
    if(fr){fr.forEach(f=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',f.d);if(f.t>=0)p.setAttribute('clip-path',`url(#tc${f.t})`);p.setAttribute('transform',vT(g));p.setAttribute('fill',f.a&&eff(f).f!=='none'?'rgba(47,111,228,.25)':'none');p.setAttribute('stroke','#2f6fe4');p.setAttribute('stroke-width',(Math.max(3,eff(f).w*S.scale+3)/S.view.z).toFixed(2));p.setAttribute('stroke-opacity','.7');p.setAttribute('stroke-linejoin','round');p.setAttribute('stroke-linecap','round');ov.appendChild(p)});return}
    const m={frame:'#rahmen',bar:'#balken',title:'#titel',sub:'#untertitel',bgmap:'#kartenhintergrund'};const el=poster.querySelector(m[id]);if(!el)return;
    let b;try{b=el.getBBox()}catch(e){return}
    const r=document.createElementNS(NS,'rect');r.setAttribute('x',b.x-4);r.setAttribute('y',b.y-4);r.setAttribute('width',b.width+8);r.setAttribute('height',b.height+8);r.setAttribute('fill','none');r.setAttribute('stroke','#2f6fe4');r.setAttribute('stroke-width','3');r.setAttribute('stroke-dasharray','10 6');ov.appendChild(r)});
  const ovc=document.createElementNS(NS,'g');ovc.setAttribute('clip-path','url(#cMapHit)');
  [...ov.childNodes].forEach(n=>{if(n.tagName==='path')ovc.appendChild(n)});ov.appendChild(ovc);
  poster.appendChild(ov);
  let txt='Nichts ausgewählt';
  if(selCls)txt=`Alle ${CLS[selCls]} (Vorlage für die ganze Gruppe)`;
  else if(sel.size){const c={};[...sel].forEach(id=>{const f=feat(id);const k=f?CLS1[f.k]:{frame:'Rahmen',bar:'Balken',title:'Titel',sub:'Untertitel',bgmap:'Kartenhintergrund'}[id];c[k]=(c[k]||0)+1});txt=Object.entries(c).map(([k,v])=>v>1?`${v}× ${k}`:k).join(', ')}
  $('selinfo').textContent=txt;
}
/* ---------- Zeigerbedienung: Klick, Rahmen aufziehen, Verschieben, Zoomen ---------- */
let tool='sel',drag=null;
function idOf(t){if(!t||!t.dataset)return null;if(t.dataset.ref)return t.dataset.ref;if(t.dataset.k)return t.dataset.g;
  return {rahmen:'frame',balken:'bar',titel:'title',untertitel:'sub',kartenhintergrund:'bgmap'}[t.id]||null}
function toSvg(cx,cy){const m=poster.getScreenCTM();if(!m)return {x:0,y:0};const p=new DOMPoint(cx,cy).matrixTransform(m.inverse());return {x:p.x,y:p.y}}
function svgToMap(p){const g=geo(),v=S.view;return {x:(p.x-g.mx-MW/2)/v.z+v.cx,y:(p.y-g.my-g.MH/2)/v.z+v.cy}}
const cv=$('canvas');
cv.addEventListener('pointerdown',ev=>{if(!DATA||ev.button!==0)return;
  drag={x:ev.clientX,y:ev.clientY,t:ev.target,moved:false,multi:ev.shiftKey||ev.ctrlKey||ev.metaKey,v0:{...S.view}};
  try{cv.setPointerCapture(ev.pointerId)}catch(e){}
  if(tool==='move'){begin();cv.classList.add('dragging')}
  ev.preventDefault()});
cv.addEventListener('pointermove',ev=>{if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>4)drag.moved=true;if(!drag.moved)return;
  if(tool==='move'){const a=toSvg(drag.x,drag.y),b=toSvg(ev.clientX,ev.clientY);S.view={...drag.v0,cx:drag.v0.cx-(b.x-a.x)/drag.v0.z,cy:drag.v0.cy-(b.y-a.y)/drag.v0.z};clampView(S.view);render();return}
  const m=$('marq');m.style.display='block';m.style.left=Math.min(ev.clientX,drag.x)+'px';m.style.top=Math.min(ev.clientY,drag.y)+'px';m.style.width=Math.abs(dx)+'px';m.style.height=Math.abs(dy)+'px'});
function endDrag(ev){if(!drag)return;const d=drag;drag=null;cv.classList.remove('dragging');$('marq').style.display='none';
  if(tool==='move'){commit();return}
  if(!d.moved){const id=idOf(d.t);selCls=null;
    if(!id){if(!d.multi)sel.clear()}else if(d.multi){sel.has(id)?sel.delete(id):sel.add(id)}else{sel.clear();sel.add(id)}
    if(id){if(id==='title'||id==='sub'){curText=id;openSec('text')}else if(['frame','bar','bgmap'].includes(id))openSec('rahmen');else openSec('elemente')}
    drawSel();panel();return}
  const a=svgToMap(toSvg(Math.min(d.x,ev.clientX),Math.min(d.y,ev.clientY))),b=svgToMap(toSvg(Math.max(d.x,ev.clientX),Math.max(d.y,ev.clientY)));
  const vr=visRect();const r=[Math.max(a.x,vr[0]),Math.max(a.y,vr[1]),Math.min(b.x,vr[2]),Math.min(b.y,vr[3])];
  if(!d.multi)sel.clear();selCls=null;
  if(S.mode!=='std'&&r[2]>r[0]&&r[3]>r[1])DATA.feats.forEach(f=>{if(eff(f).h)return;const bx=f.bx;if(bx[2]<r[0]||bx[0]>r[2]||bx[3]<r[1]||bx[1]>r[3])return;
    const P=f.pts;let hit=false;for(let i=0;i<P.length;i+=2){if(P[i]>=r[0]&&P[i]<=r[2]&&P[i+1]>=r[1]&&P[i+1]<=r[3]){hit=true;break}}
    if(!hit&&f.a&&bx[0]<=r[0]&&bx[2]>=r[2]&&bx[1]<=r[1]&&bx[3]>=r[3])hit=true;
    if(hit)sel.add(f.id)});
  if(sel.size)openSec('elemente');drawSel();panel();
  if(sel.size)msg(`${sel.size} Elemente markiert`,'ok');}
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('wheel',ev=>{if(!DATA||tool!=='move'&&!ev.ctrlKey)return;ev.preventDefault();
  const p=svgToMap(toSvg(ev.clientX,ev.clientY));const v=S.view;const f=Math.exp(-ev.deltaY*0.0015);begin();
  const nz=v.z*f;const L=vLimits(v);const z=Math.min(L.zmax,Math.max(L.zmin,nz));
  S.view={...v,z,cx:p.x-(p.x-v.cx)*v.z/z,cy:p.y-(p.y-v.cy)*v.z/z};clampView(S.view);render();clearTimeout(cv._wt);cv._wt=setTimeout(commit,350)},{passive:false});
function setTool(t){tool=t;$('toolSel').classList.toggle('on',t==='sel');$('toolMove').classList.toggle('on',t==='move');cv.classList.toggle('tool-move',t==='move');
  $('toolHint').textContent=t==='sel'?'Klicken oder Rahmen aufziehen zum Auswählen · Klick daneben hebt auf':'Karte ziehen zum Verschieben · Mausrad zum Zoomen'}
$('toolSel').onclick=()=>setTool('sel');$('toolMove').onclick=()=>setTool('move');
function zToSlider(v){const L=vLimits(v);return Math.round(100*Math.log(v.z/L.zmin)/Math.log(L.zmax/L.zmin))}
function sliderToZ(val,v){const L=vLimits(v);return L.zmin*Math.pow(L.zmax/L.zmin,val/100)}
function syncTools(){if(!S)return;$('vZoom').value=zToSlider(S.view);const o=[...$('aspect2').options].find(o=>Math.abs(+o.value-S.view.a)<0.01);if(o)$('aspect2').value=o.value}
$('vZoom').addEventListener('input',e=>{begin();S.view.z=sliderToZ(+e.target.value,S.view);clampView(S.view);render()});$('vZoom').addEventListener('change',()=>commit());
const zStep=f=>change(()=>{S.view.z*=f;clampView(S.view)});$('zIn').onclick=()=>zStep(1.2);$('zOut').onclick=()=>zStep(1/1.2);
$('aspect2').addEventListener('change',e=>change(()=>{S.view.a=+e.target.value;clampView(S.view)}));
$('vReset').onclick=()=>change(()=>{S.view=defView();clampView(S.view)});
$('desel').onclick=()=>{sel.clear();selCls=null;drawSel();panel()};

/* ---------- Eigenschaften ---------- */
function mapSel(){return [...sel].filter(id=>feat(id))}
function setVal(id,v){const e=$(id);e.value=v;const o=$(id+'v');if(o)o.textContent=(+v).toFixed(e.step&&+e.step<1?(+e.step<0.1?2:1):0)}
let curText='title';
function panel(){
  if(!S)return;
  const m=mapSel();const showMap=selCls||m.length;
  $('pMap').classList.toggle('hidden',!showMap);$('selhint').classList.toggle('hidden',!!showMap);
  if(showMap){const e=selCls?S.cls[selCls]:eff(feat(m[0]));
    $('mStroke').value=hex(e.s);$('mFillOn').checked=e.f!=='none';$('mFill').value=e.f!=='none'?hex(e.f):hex(e.s);setVal('mW',e.w)}
  document.querySelectorAll('#grpbtns .chip').forEach(c=>c.classList.toggle('on',c.dataset.k===selCls));
  $('bgOn').checked=S.bg!=='none';$('bgColor').value=S.bg!=='none'?hex(S.bg):'#ffffff';
  $('fColor').value=hex(S.frame.color);setVal('fW',S.frame.w);setVal('fR',S.frame.r);setVal('fP',S.frame.pad);
  $('bColor').value=hex(S.bar.color);setVal('bH',geo().barH);$('bAuto').checked=S.bar.auto;setVal('bGap',S.bar.gap);$('bOn').checked=S.bar.on;
  const t=S[curText];$('tabTitle').classList.toggle('on',curText==='title');$('tabSub').classList.toggle('on',curText==='sub');
  if(document.activeElement!==$('tText'))$('tText').value=t.text;$('tFont').value=t.font;setVal('tSize',t.size);setVal('tLs',t.ls);$('tColor').value=hex(t.color);$('tOn').checked=t.on;
  setVal('gScale',S.scale);$('attrOn').checked=S.attr.on;
  const std=S.mode==='std';
  document.querySelectorAll('#modeTabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.mode));
  $('artBox').classList.toggle('hidden',std);$('stdBox').classList.toggle('hidden',!std);
  document.querySelectorAll('#styles button').forEach(b=>b.classList.toggle('on',!std&&b.dataset.p===S.preset));
  document.querySelectorAll('#bases button').forEach(b=>b.classList.toggle('on',std&&b.dataset.b===S.base));
  $('themeDesc').textContent=PRESETS[S.preset].desc||'';$('labelsOn').checked=S.labels;
  CUST.forEach(([id,get])=>{if(document.activeElement!==$(id))$(id).value=hex(get()==='none'?'#ffffff':get())});
  $('elArt').classList.toggle('hidden',std);$('elStd').classList.toggle('hidden',!std);
  document.querySelectorAll('#fmt2 button').forEach(b=>b.classList.toggle('on',Math.abs(+b.dataset.a-S.view.a)<0.01));
  // Zusammenfassungen
  $('sumA').textContent=(([...document.querySelectorAll('#fmt2 button')].find(b=>Math.abs(+b.dataset.a-S.view.a)<0.01)||{}).textContent||'')+(S.view.z>1.01?` · ${S.view.z.toFixed(1)}×`:'');
  $('sumS').textContent=std?'Standard · '+BASES[S.base].name:PRESETS[S.preset].name;
  $('sumE').textContent=selCls?`Alle ${CLS[selCls]}`:m.length?`${m.length} ausgewählt`:'';
  $('sumR').textContent=(S.frame.r>0?'abgerundet':'eckig')+(S.bar.on?' · mit Balken':'');
  $('sumT').textContent=S.title.on?S.title.text:'';
  fillReplace();
}
function textKey(){return curText}
function openSec(name){document.querySelectorAll('.sec').forEach(x=>x.classList.toggle('open',x.dataset.s===name))}
document.querySelectorAll('.sec>.sh').forEach(h=>h.onclick=()=>{const sec=h.parentElement;const was=sec.classList.contains('open');document.querySelectorAll('.sec').forEach(x=>x.classList.remove('open'));if(!was)sec.classList.add('open')});
$('tabTitle').onclick=()=>{curText='title';panel()};$('tabSub').onclick=()=>{curText='sub';panel()};
document.querySelectorAll('#fmt2 button').forEach(b=>b.onclick=()=>change(()=>{S.view.a=+b.dataset.a;clampView(S.view)}));
function setMap(prop,val){if(selCls){S.cls[selCls][prop]=val;DATA.feats.forEach(f=>{if(f.k===selCls&&S.ov[f.id])delete S.ov[f.id][prop]})}else mapSel().forEach(id=>{(S.ov[id]=S.ov[id]||{})[prop]=val})}
function live(id,fn){const e=$(id);e.addEventListener('input',()=>{begin();fn(e);render()});e.addEventListener('change',()=>commit())}
live('mStroke',e=>setMap('s',e.value));
live('mFill',e=>{$('mFillOn').checked=true;setMap('f',e.value)});
$('mFillOn').addEventListener('change',e=>change(()=>setMap('f',e.target.checked?$('mFill').value:'none')));
live('mW',e=>setMap('w',+e.value));
$('mHide').onclick=()=>change(()=>setMap('h',true));$('mShow').onclick=()=>change(()=>setMap('h',false));
$('bgOn').addEventListener('change',e=>change(()=>S.bg=e.target.checked?$('bgColor').value:'none'));
live('bgColor',e=>{$('bgOn').checked=true;S.bg=e.value});
live('fColor',e=>S.frame.color=e.value);live('fW',e=>S.frame.w=+e.value);live('fR',e=>S.frame.r=+e.value);live('fP',e=>S.frame.pad=+e.value);
live('bColor',e=>S.bar.color=e.value);live('bH',e=>{S.bar.auto=false;S.bar.h=+e.value});live('bGap',e=>S.bar.gap=+e.value);
$('bAuto').addEventListener('change',e=>change(()=>{S.bar.auto=e.target.checked;if(!S.bar.auto)S.bar.h=geo().barH}));
$('bOn').addEventListener('change',e=>change(()=>S.bar.on=e.target.checked));
live('tText',e=>{const k=textKey();if(k)S[k].text=e.value});
$('tFont').addEventListener('change',e=>change(()=>{const k=textKey();if(k)S[k].font=e.target.value}));
live('tSize',e=>{const k=textKey();if(k)S[k].size=+e.value});live('tLs',e=>{const k=textKey();if(k)S[k].ls=+e.value});
live('tColor',e=>{const k=textKey();if(k)S[k].color=e.value});
$('tOn').addEventListener('change',e=>change(()=>{const k=textKey();if(k)S[k].on=e.target.checked}));
function dms(v,pos,neg){const s=v<0?neg:pos;v=Math.abs(v);const d=Math.floor(v),m=Math.floor((v-d)*60),sec=Math.round(((v-d)*60-m)*60);return `${d}° ${String(m).padStart(2,'0')}′ ${String(sec).padStart(2,'0')}″ ${s}`}
function viewCenterLL(){const p=DATA.proj,v=S.view;const x=v.cx/p.sc+p.x0,y=v.cy/p.sc+p.y0;return [x*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y)))*180/Math.PI]}
$('tCoord').onclick=()=>{const k=textKey();if(!k||!DATA)return;const [lon,lat]=viewCenterLL();change(()=>{S[k].text=dms(lat,'N','S')+'\u2003\u2003'+dms(lon,'E','W');if(S[k].font==='SgFR'){S[k].font='SgMD';S[k].size=26;S[k].ls=2}})};
live('gScale',e=>S.scale=+e.value);
$('attrOn').addEventListener('change',e=>change(()=>S.attr.on=e.target.checked));
document.querySelectorAll('.sw').forEach(box=>{SWATCH.forEach(c=>{const s=document.createElement('span');s.style.background=c;s.title=c;s.onclick=()=>{const inp=$(box.dataset.for);inp.value=c;inp.dispatchEvent(new Event('input'));inp.dispatchEvent(new Event('change'))};box.appendChild(s)})});
const dotsHTML=d=>`<span class="dots">${d.map(c=>`<i style="background:${c}"></i>`).join('')}</span>`;
Object.entries(PRESETS).forEach(([k,p])=>{const b=document.createElement('button');b.dataset.p=k;b.title=p.desc||'';b.innerHTML=`<div class="th" style="background:${p.bg==='none'?'#fff':p.bg}"></div><span class="nm">${p.name}</span>`;b.onclick=()=>change(()=>{const keep=S;S=newState(k,keep);S.mode='art'});$('styles').appendChild(b)});
Object.entries(BASES).forEach(([k,p])=>{const b=document.createElement('button');b.dataset.b=k;b.innerHTML=`${dotsHTML(p.dots)}<span class="nm">${p.name}</span>`;b.onclick=()=>{change(()=>{S.mode='std';S.base=k});ensureRaster()};$('bases').appendChild(b)});
document.querySelectorAll('#modeTabs button').forEach(b=>b.onclick=()=>{change(()=>{S.mode=b.dataset.m});if(S.mode==='std')ensureRaster()});
$('labelsOn').addEventListener('change',e=>{change(()=>S.labels=e.target.checked);ensureRaster()});
const CUST=[['cBg',()=>S.bg,v=>{S.bg=v}],['cHaus',()=>S.cls.haus.f!=='none'?S.cls.haus.f:S.cls.haus.s,v=>{if(S.cls.haus.f!=='none')S.cls.haus.f=v;else S.cls.haus.s=v}],['cHausL',()=>S.cls.haus.s,v=>{S.cls.haus.s=v}],
 ['cHaupt',()=>S.cls.haupt.s,v=>{S.cls.haupt.s=v}],['cNeben',()=>S.cls.neben.s,v=>{S.cls.neben.s=v;S.cls.weg.s=v}],['cWasser',()=>S.cls.wasser.f!=='none'?S.cls.wasser.f:S.cls.wasser.s,v=>{S.cls.wasser.f=v;S.cls.wasser.s=v}],['cGruen',()=>S.cls.gruen.f!=='none'?S.cls.gruen.f:S.cls.gruen.s,v=>{S.cls.gruen.f=v;S.cls.gruen.s=v;S.cls.gruen.h=false}]];
CUST.forEach(([id,,set])=>live(id,e=>set(e.value)));
/* ---------- Standard-Karte als Bild rendern ---------- */
const RASTER=new Map();let rasterJob=null;
function rasterKey(){return S.base+'|'+(S.labels?1:0)+'|'+(DATA?DATA.ext.x0.toFixed(1)+DATA.proj.x0:'')}
function mercInv(x,y){return [x*360-180,Math.atan(Math.sinh(Math.PI*(1-2*y)))*180/Math.PI]}
async function ensureRaster(){
  if(!S||S.mode!=='std'||!DATA)return;const k=rasterKey();if(RASTER.has(k)){render();return}
  if(!window.maplibregl){msg('Standard-Stile brauchen eine Internetverbindung – hier sind nur die künstlerischen Stile verfügbar.','err');return}
  if(rasterJob===k)return;rasterJob=k;msg('Karte wird gezeichnet …','busy');
  const E=DATA.ext,P=DATA.proj,B=BASES[S.base];
  const mw=(E.x1-E.x0)/P.sc,mh=(E.y1-E.y0)/P.sc;
  const cssW=Math.round(Math.min(2600,1150*(E.x1-E.x0)/MW)),cssH=Math.round(cssW*mh/mw);
  const pr=Math.max(1,Math.min(2.5,4096/Math.max(cssW,cssH)));
  const zoom=Math.log2(cssW/(mw*512));const c=mercInv(P.x0+(E.x0+E.x1)/2/P.sc,P.y0+(E.y0+E.y1)/2/P.sc);
  const div=document.createElement('div');div.style.cssText=`position:fixed;left:-20000px;top:0;width:${cssW}px;height:${cssH}px;pointer-events:none`;document.body.appendChild(div);
  let m=null;
  try{
    const r=await fetch(B.style);if(!r.ok)throw new Error('Stil HTTP '+r.status);const st=await r.json();
    st.layers.forEach(l=>{if(l.type==='symbol'){l.layout=l.layout||{};l.layout.visibility=S.labels?'visible':'none'}
      else if(B.sat&&l.type!=='background'){l.layout=l.layout||{};l.layout.visibility='none'}});
    if(B.sat){st.sources.sat={type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19};
      const bi=st.layers.findIndex(l=>l.type==='background');st.layers.splice(bi+1,0,{id:'sat',type:'raster',source:'sat'});
      if(S.labels)st.layers.forEach(l=>{if(l.type==='symbol'&&l.paint){l.paint['text-color']='#ffffff';l.paint['text-halo-color']='rgba(0,0,0,.75)';l.paint['text-halo-width']=1.4}})}
    m=new maplibregl.Map({container:div,style:st,center:c,zoom,interactive:false,attributionControl:false,preserveDrawingBuffer:true,pixelRatio:pr,fadeDuration:0});
    await new Promise((res,rej)=>{const to=setTimeout(()=>rej(new Error('Zeitüberschreitung')),60000);m.once('idle',()=>{clearTimeout(to);res()})});
    const url=m.getCanvas().toDataURL('image/jpeg',0.9);
    RASTER.set(k,{url});msg('Karte fertig','ok');
  }catch(e){console.warn(e);msg('Die Karte konnte nicht gezeichnet werden ('+(e.message||e)+'). Bitte erneut versuchen.','err')}
  finally{try{m&&m.remove()}catch(e){}div.remove();if(rasterJob===k)rasterJob=null}
  if(S.mode==='std')render();
}
function usedColors(){const m=new Map();const add=c=>{if(!c||c==='none')return;c=hex(c);m.set(c,(m.get(c)||0)+1)};
  DATA.feats.forEach(f=>{const e=eff(f);if(!e.h){add(e.s);if(f.a)add(e.f)}});add(S.frame.color);if(S.bar.on)add(S.bar.color);add(S.title.color);add(S.sub.color);add(S.bg);return [...m.entries()].sort((a,b)=>b[1]-a[1])}
function fillReplace(){const s=$('rOld'),cur=s.value;s.innerHTML='';usedColors().forEach(([c,n])=>{const o=document.createElement('option');o.value=c;o.textContent=`${c} (${n}×)`;s.appendChild(o)});if([...s.options].some(o=>o.value===cur))s.value=cur}
$('rGo').onclick=()=>{const a=$('rOld').value,b=$('rNew').value;if(!a)return;change(()=>{
  Object.values(S.cls).forEach(c=>{if(hex(c.s)===a)c.s=b;if(c.f!=='none'&&hex(c.f)===a)c.f=b});
  Object.values(S.ov).forEach(o=>{if(o.s&&hex(o.s)===a)o.s=b;if(o.f&&o.f!=='none'&&hex(o.f)===a)o.f=b});
  if(hex(S.frame.color)===a)S.frame.color=b;if(hex(S.bar.color)===a)S.bar.color=b;['title','sub'].forEach(k=>{if(hex(S[k].color)===a)S[k].color=b});if(S.bg!=='none'&&hex(S.bg)===a)S.bg=b});msg(`${a} wurde durch ${b} ersetzt.`,'ok')};
$('undo').onclick=()=>{if(!undoS.length)return;redoS.push(snap());S=JSON.parse(undoS.pop());updUndo();render()};
$('redo').onclick=()=>{if(!redoS.length)return;undoS.push(snap());S=JSON.parse(redoS.pop());updUndo();render()};
document.addEventListener('keydown',e=>{if(!DATA||!$('picker').classList.contains('hidden'))return;if(e.target.tagName==='INPUT'&&e.target.type==='text'||e.target.tagName==='SELECT')return;
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='v'){setTool('sel');return}if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='h'){setTool('move');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?$('redo').click():$('undo').click()}
  else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();$('redo').click()}
  else if(e.key==='Escape'){sel.clear();selCls=null;drawSel();panel()}
  else if((e.key==='Delete'||e.key==='Backspace')&&(mapSel().length||selCls)){e.preventDefault();$('mHide').click()}});
document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>{const c=$('canvas');document.querySelectorAll('[data-bg]').forEach(x=>x.classList.toggle('on',x===b));if(b.dataset.bg==='checker'){c.classList.add('checker');poster.style.background=''}else{c.classList.remove('checker');poster.style.background=b.dataset.bg}});
function zoom(){if(!DATA)return;const z=+$('zoom').value/100;const g=geo(),c=$('canvas');const base=Math.max(240,Math.min(c.clientWidth-80,(c.clientHeight-136)*g.W/g.H));poster.style.width=(base*z)+'px'}
window.addEventListener('resize',zoom);
$('zoom').addEventListener('input',zoom);
let msgT=null;function msg(t,c){const m=$('msg');m.textContent=t;m.className='toast'+(t?' show':'')+(c==='err'?' err':'');$('msg2').textContent=c==='err'?t:'';clearTimeout(msgT);if(t&&c!=='busy')msgT=setTimeout(()=>{m.className='toast'},2600)}

/* ---------- Export ---------- */
function fileBase(){return ('Karte_'+(DATA.place||'Ort')).replace(/[^\wäöüÄÖÜß-]+/g,'_')}
let DLCAP;const dlCapP=(window.claude&&window.claude.use)?window.claude.use('downloads').then(d=>DLCAP=d).catch(()=>DLCAP=null):Promise.resolve(DLCAP=null);
async function download(name,blob){await dlCapP;
  if(DLCAP){try{await DLCAP.save({filename:name,data:blob});return true}catch(e){if(e&&e.code==='declined')return false;msg('Download hier nicht möglich ('+(e&&e.code||e)+')','err');return false}}
  dlPlain(name,blob);return true}
function dlPlain(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
let dlF='png';
$('dlBtn').onclick=e=>{e.stopPropagation();$('dlPop').classList.toggle('hidden')};
document.addEventListener('pointerdown',e=>{if(!$('dlPop').contains(e.target)&&e.target!==$('dlBtn')&&!$('dlBtn').contains(e.target))$('dlPop').classList.add('hidden')});
document.querySelectorAll('#dlFmt button').forEach(b=>b.onclick=()=>{dlF=b.dataset.f;document.querySelectorAll('#dlFmt button').forEach(x=>x.classList.toggle('on',x===b));$('dlSizeRow').classList.toggle('hidden',dlF!=='png')});
$('dlGo').onclick=async()=>{if(dlF==='svg'){if(await download(fileBase()+'.svg',new Blob([buildSVG(true)],{type:'image/svg+xml'})))msg('SVG heruntergeladen','ok');$('dlPop').classList.add('hidden');return}
  $('dlGo').disabled=true;$('dlGo').textContent='Wird erstellt …';
  try{const cv=await renderPNG(+$('pngW').value);const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(await download(fileBase()+'.png',blob))msg('PNG heruntergeladen – transparenter Hintergrund','ok');$('dlPop').classList.add('hidden')}catch(e){msg('PNG konnte nicht erstellt werden','err')}
  $('dlGo').disabled=false;$('dlGo').textContent='Datei erstellen'};
async function renderPNG(W){
  const svg=buildSVG(true),g=geo(),H=Math.round(W*g.H/g.W);
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url});
  try{await img.decode()}catch(e){}await new Promise(r=>setTimeout(r,150));
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.getContext('2d').drawImage(img,0,0,W,H);URL.revokeObjectURL(url);
  return cv;
}

updUndo();setTool('sel');
/* ---------- Beispiel-Ausschnitt (funktioniert ohne Internet) ---------- */
const DEMO={"b":{"w":11.205,"e":11.217,"n":49.85480612687383,"s":49.84799363306074},"osm":{"elements":[{"type":"way","id":1000,"tags":{"highway":"track"},"geometry":[{"lat":49.8492537,"lon":11.2061426},{"lat":49.8488044,"lon":11.2062024},{"lat":49.847848,"lon":11.2062825},{"lat":49.8467983,"lon":11.2063817},{"lat":49.8460221,"lon":11.2064618},{"lat":49.8455944,"lon":11.2064904},{"lat":49.8454225,"lon":11.206494},{"lat":49.8452776,"lon":11.2065072},{"lat":49.8451674,"lon":11.2065287},{"lat":49.8450811,"lon":11.2065633},{"lat":49.845004,"lon":11.2066076},{"lat":49.8448961,"lon":11.2066912},{"lat":49.8446109,"lon":11.2069422},{"lat":49.8440937,"lon":11.2073952},{"lat":49.8433646,"lon":11.2080227},{"lat":49.8429808,"lon":11.2083394},{"lat":49.842832,"lon":11.2084685}]},{"type":"way","id":1001,"tags":{"highway":"track"},"geometry":[{"lat":49.848611,"lon":11.2122442},{"lat":49.8487582,"lon":11.2126817},{"lat":49.8490888,"lon":11.2136534},{"lat":49.8494256,"lon":11.2145845},{"lat":49.8495951,"lon":11.2149239},{"lat":49.8502024,"lon":11.2155239},{"lat":49.8503681,"lon":11.2155789}]},{"type":"way","id":1002,"tags":{"highway":"track"},"geometry":[{"lat":49.8499943,"lon":11.2111375},{"lat":49.8503958,"lon":11.2105948},{"lat":49.8505954,"lon":11.2104502},{"lat":49.850765,"lon":11.2103857},{"lat":49.8509368,"lon":11.210339},{"lat":49.8510817,"lon":11.2102231},{"lat":49.8514925,"lon":11.209855},{"lat":49.8518554,"lon":11.2094928}]},{"type":"way","id":1003,"tags":{"highway":"track"},"geometry":[{"lat":49.854081,"lon":11.2154713},{"lat":49.8532973,"lon":11.2159625},{"lat":49.8532333,"lon":11.2159972},{"lat":49.8531855,"lon":11.21599},{"lat":49.8531177,"lon":11.2159315},{"lat":49.8530075,"lon":11.2157259},{"lat":49.8527347,"lon":11.2153052}]},{"type":"way","id":1004,"tags":{"highway":"track"},"geometry":[{"lat":49.8508351,"lon":11.2077167},{"lat":49.8509823,"lon":11.207902},{"lat":49.8511973,"lon":11.2082773},{"lat":49.8518554,"lon":11.2094928},{"lat":49.8526523,"lon":11.2109462},{"lat":49.8532287,"lon":11.211992},{"lat":49.8534923,"lon":11.2124976},{"lat":49.8536094,"lon":11.2127199},{"lat":49.8536741,"lon":11.2128538},{"lat":49.8537126,"lon":11.2129363},{"lat":49.8537281,"lon":11.2129841}]},{"type":"way","id":1005,"tags":{"highway":"track"},"geometry":[{"lat":49.8531855,"lon":11.21599},{"lat":49.8531647,"lon":11.2161622},{"lat":49.8530908,"lon":11.2162817},{"lat":49.8529967,"lon":11.2163677},{"lat":49.8528943,"lon":11.216455},{"lat":49.8527532,"lon":11.2165231},{"lat":49.8526322,"lon":11.2165506},{"lat":49.8525197,"lon":11.216547},{"lat":49.8524758,"lon":11.216541},{"lat":49.8524365,"lon":11.2165076},{"lat":49.8523826,"lon":11.2164622},{"lat":49.852351,"lon":11.216339},{"lat":49.8523579,"lon":11.2161884},{"lat":49.8523687,"lon":11.2159757},{"lat":49.8523779,"lon":11.2157928}]},{"type":"way","id":1006,"tags":{"highway":"track"},"geometry":[{"lat":49.8546551,"lon":11.2041394},{"lat":49.8547191,"lon":11.2041048},{"lat":49.8547668,"lon":11.2040713},{"lat":49.8547822,"lon":11.2040546},{"lat":49.8548007,"lon":11.2040343},{"lat":49.8548239,"lon":11.2040092},{"lat":49.8548431,"lon":11.2039888},{"lat":49.8548662,"lon":11.2039602},{"lat":49.8549117,"lon":11.203904},{"lat":49.8549864,"lon":11.203806},{"lat":49.855099,"lon":11.2036446},{"lat":49.8552269,"lon":11.2034629},{"lat":49.8553024,"lon":11.2033363},{"lat":49.855324,"lon":11.2032968},{"lat":49.8553417,"lon":11.2032586},{"lat":49.8553609,"lon":11.2032227},{"lat":49.8553848,"lon":11.2031845},{"lat":49.8554349,"lon":11.2031175},{"lat":49.8555382,"lon":11.2029956},{"lat":49.8557146,"lon":11.2028367},{"lat":49.8559042,"lon":11.2026849},{"lat":49.8561531,"lon":11.2024841},{"lat":49.8561677,"lon":11.2024793},{"lat":49.8561801,"lon":11.2024793},{"lat":49.8561901,"lon":11.2024936},{"lat":49.8562001,"lon":11.2025235},{"lat":49.8562987,"lon":11.2029562},{"lat":49.856412,"lon":11.2034534},{"lat":49.8564667,"lon":11.2036757},{"lat":49.8564798,"lon":11.2037139},{"lat":49.8564929,"lon":11.2037331},{"lat":49.8565045,"lon":11.203739},{"lat":49.8565214,"lon":11.2037367},{"lat":49.8565453,"lon":11.2037235},{"lat":49.8567148,"lon":11.2036076},{"lat":49.8568281,"lon":11.2035131},{"lat":49.8569815,"lon":11.203347},{"lat":49.8571826,"lon":11.2031259},{"lat":49.8573606,"lon":11.2029359},{"lat":49.8575316,"lon":11.2027745},{"lat":49.8575517,"lon":11.202759},{"lat":49.8575709,"lon":11.2027482},{"lat":49.8575964,"lon":11.2027375},{"lat":49.857621,"lon":11.2027279},{"lat":49.8576457,"lon":11.2027219},{"lat":49.857668,"lon":11.2027231},{"lat":49.8576888,"lon":11.2027243},{"lat":49.8577158,"lon":11.2027303},{"lat":49.8577458,"lon":11.2027398},{"lat":49.8578121,"lon":11.2027673},{"lat":49.8578337,"lon":11.2027805},{"lat":49.8578514,"lon":11.2027912},{"lat":49.8578761,"lon":11.2028116},{"lat":49.857903,"lon":11.2028355},{"lat":49.8579315,"lon":11.2028701},{"lat":49.8579801,"lon":11.2029406},{"lat":49.8580279,"lon":11.2030351},{"lat":49.8580648,"lon":11.2031271},{"lat":49.8581034,"lon":11.203261},{"lat":49.8581296,"lon":11.2034092},{"lat":49.8581465,"lon":11.2035729},{"lat":49.8581527,"lon":11.2038024},{"lat":49.8581504,"lon":11.2039841},{"lat":49.8581419,"lon":11.2041227},{"lat":49.8581342,"lon":11.2044944},{"lat":49.8581365,"lon":11.2047454},{"lat":49.8581612,"lon":11.2052271},{"lat":49.8582428,"lon":11.2065335},{"lat":49.8583654,"lon":11.2086633},{"lat":49.8583777,"lon":11.2089657},{"lat":49.8584046,"lon":11.2095944},{"lat":49.8584455,"lon":11.2101538},{"lat":49.8584778,"lon":11.2105745},{"lat":49.8584948,"lon":11.2108422}]},{"type":"way","id":1007,"tags":{"building":"yes"},"geometry":[{"lat":49.8535986,"lon":11.2159231},{"lat":49.8533397,"lon":11.2160032},{"lat":49.8534514,"lon":11.2168721},{"lat":49.8537111,"lon":11.216792},{"lat":49.8535986,"lon":11.2159231}]},{"type":"way","id":1008,"tags":{"building":"yes"},"geometry":[{"lat":49.8511149,"lon":11.213302},{"lat":49.8509052,"lon":11.213712},{"lat":49.851054,"lon":11.2138948},{"lat":49.8511542,"lon":11.2136988},{"lat":49.851232,"lon":11.2137944},{"lat":49.8513414,"lon":11.2135817},{"lat":49.8511149,"lon":11.213302}]},{"type":"way","id":1009,"tags":{"building":"yes"},"geometry":[{"lat":49.8496884,"lon":11.2116633},{"lat":49.8494533,"lon":11.21171},{"lat":49.8494957,"lon":11.2122239},{"lat":49.8497238,"lon":11.2121785},{"lat":49.8496907,"lon":11.2117183},{"lat":49.8496884,"lon":11.2116633}]},{"type":"way","id":1010,"tags":{"building":"yes"},"geometry":[{"lat":49.8487651,"lon":11.2048518},{"lat":49.8485601,"lon":11.2048733},{"lat":49.8485801,"lon":11.2053191},{"lat":49.8486079,"lon":11.2053155},{"lat":49.8489115,"lon":11.2052833},{"lat":49.8489015,"lon":11.2050622},{"lat":49.8487751,"lon":11.2050753},{"lat":49.8487651,"lon":11.2048518}]},{"type":"way","id":1011,"tags":{"building":"yes"},"geometry":[{"lat":49.8500552,"lon":11.205796},{"lat":49.8500336,"lon":11.2062347},{"lat":49.8500567,"lon":11.2062382},{"lat":49.8503419,"lon":11.2062717},{"lat":49.8503519,"lon":11.2060733},{"lat":49.8502394,"lon":11.2060602},{"lat":49.8502517,"lon":11.2058199},{"lat":49.8500552,"lon":11.205796}]},{"type":"way","id":1012,"tags":{"building":"yes"},"geometry":[{"lat":49.8520566,"lon":11.2120147},{"lat":49.8518809,"lon":11.2121988},{"lat":49.8516874,"lon":11.2124092},{"lat":49.8517252,"lon":11.2125849},{"lat":49.8519564,"lon":11.2123518},{"lat":49.8519872,"lon":11.2124235},{"lat":49.8521568,"lon":11.2122466},{"lat":49.8520566,"lon":11.2120147}]},{"type":"way","id":1013,"tags":{"building":"yes"},"geometry":[{"lat":49.8491219,"lon":11.204639},{"lat":49.8490002,"lon":11.204657},{"lat":49.8490433,"lon":11.2053896},{"lat":49.8491659,"lon":11.2053717},{"lat":49.8491219,"lon":11.204639}]},{"type":"way","id":1014,"tags":{"building":"yes"},"geometry":[{"lat":49.8508906,"lon":11.211043},{"lat":49.8507465,"lon":11.21119},{"lat":49.8507249,"lon":11.2111398},{"lat":49.8506186,"lon":11.2112486},{"lat":49.8506663,"lon":11.2113586},{"lat":49.8507396,"lon":11.2115378},{"lat":49.8508112,"lon":11.2114625},{"lat":49.8508459,"lon":11.2114267},{"lat":49.850822,"lon":11.2113705},{"lat":49.8509669,"lon":11.2112235},{"lat":49.8508906,"lon":11.211043}]},{"type":"way","id":1015,"tags":{"building":"yes"},"geometry":[{"lat":49.8527332,"lon":11.2121964},{"lat":49.8524843,"lon":11.2123398},{"lat":49.8525059,"lon":11.2124331},{"lat":49.8525298,"lon":11.2125311},{"lat":49.852606,"lon":11.2124869},{"lat":49.8526384,"lon":11.2126207},{"lat":49.8527525,"lon":11.212555},{"lat":49.8528103,"lon":11.2125215},{"lat":49.8527332,"lon":11.2121964}]},{"type":"way","id":1016,"tags":{"building":"yes"},"geometry":[{"lat":49.8528133,"lon":11.214649},{"lat":49.8525945,"lon":11.2148785},{"lat":49.8527093,"lon":11.2151426},{"lat":49.852875,"lon":11.2149693},{"lat":49.8528496,"lon":11.2149108},{"lat":49.8529027,"lon":11.2148546},{"lat":49.8528133,"lon":11.214649}]},{"type":"way","id":1017,"tags":{"building":"yes"},"geometry":[{"lat":49.8530176,"lon":11.211906},{"lat":49.8528812,"lon":11.2120386},{"lat":49.8530484,"lon":11.2124522},{"lat":49.853184,"lon":11.2123195},{"lat":49.8530176,"lon":11.211906}]},{"type":"way","id":1018,"tags":{"building":"yes"},"geometry":[{"lat":49.8519294,"lon":11.2117231},{"lat":49.8517537,"lon":11.211906},{"lat":49.8518809,"lon":11.2121988},{"lat":49.8520566,"lon":11.2120147},{"lat":49.8519294,"lon":11.2117231}]},{"type":"way","id":1019,"tags":{"building":"yes"},"geometry":[{"lat":49.8530414,"lon":11.2139892},{"lat":49.8528812,"lon":11.2140478},{"lat":49.8529482,"lon":11.2144853},{"lat":49.8531085,"lon":11.2144267},{"lat":49.8530414,"lon":11.2139892}]},{"type":"way","id":1020,"tags":{"building":"yes"},"geometry":[{"lat":49.8491643,"lon":11.207712},{"lat":49.8489285,"lon":11.2077251},{"lat":49.8489323,"lon":11.2079199},{"lat":49.8489724,"lon":11.2079175},{"lat":49.848974,"lon":11.2079821},{"lat":49.8489763,"lon":11.2080861},{"lat":49.8491412,"lon":11.2080765},{"lat":49.8491381,"lon":11.2079139},{"lat":49.8491682,"lon":11.2079116},{"lat":49.8491643,"lon":11.207712}]},{"type":"way","id":1021,"tags":{"building":"yes"},"geometry":[{"lat":49.8512412,"lon":11.2119478},{"lat":49.8509654,"lon":11.2123064},{"lat":49.8510509,"lon":11.2124618},{"lat":49.8513252,"lon":11.2120984},{"lat":49.8512859,"lon":11.2120243},{"lat":49.8512412,"lon":11.2119478}]},{"type":"way","id":1022,"tags":{"building":"yes"},"geometry":[{"lat":49.8501854,"lon":11.2129721},{"lat":49.8500853,"lon":11.2129888},{"lat":49.8500244,"lon":11.2129984},{"lat":49.8500552,"lon":11.2134382},{"lat":49.8502155,"lon":11.213412},{"lat":49.8501854,"lon":11.2129721}]},{"type":"way","id":1023,"tags":{"building":"yes"},"geometry":[{"lat":49.8526823,"lon":11.2127582},{"lat":49.8525968,"lon":11.212806},{"lat":49.8524458,"lon":11.2128884},{"lat":49.8525136,"lon":11.2131849},{"lat":49.8526854,"lon":11.2130892},{"lat":49.85265,"lon":11.2129363},{"lat":49.8527147,"lon":11.2129004},{"lat":49.8526823,"lon":11.2127582}]},{"type":"way","id":1024,"tags":{"building":"yes"},"geometry":[{"lat":49.8518431,"lon":11.2138733},{"lat":49.8517252,"lon":11.2140024},{"lat":49.8518955,"lon":11.2143789},{"lat":49.8519903,"lon":11.2142749},{"lat":49.8520134,"lon":11.2142498},{"lat":49.8518431,"lon":11.2138733}]},{"type":"way","id":1025,"tags":{"building":"yes"},"geometry":[{"lat":49.8511673,"lon":11.2118104},{"lat":49.8510825,"lon":11.2119167},{"lat":49.8509738,"lon":11.2120661},{"lat":49.8508914,"lon":11.2121701},{"lat":49.8509654,"lon":11.2123064},{"lat":49.8512412,"lon":11.2119478},{"lat":49.8511673,"lon":11.2118104}]},{"type":"way","id":1026,"tags":{"building":"yes"},"geometry":[{"lat":49.8504105,"lon":11.2106701},{"lat":49.8501762,"lon":11.2109618},{"lat":49.8502625,"lon":11.2111291},{"lat":49.8504968,"lon":11.2108375},{"lat":49.8504105,"lon":11.2106701}]},{"type":"way","id":1027,"tags":{"building":"yes"},"geometry":[{"lat":49.8523124,"lon":11.2139163},{"lat":49.8522662,"lon":11.2139641},{"lat":49.8521853,"lon":11.214049},{"lat":49.8523356,"lon":11.2143956},{"lat":49.8524627,"lon":11.2142629},{"lat":49.8524165,"lon":11.2141566},{"lat":49.852371,"lon":11.2140514},{"lat":49.8523124,"lon":11.2139163}]},{"type":"way","id":1028,"tags":{"building":"yes"},"geometry":[{"lat":49.8534337,"lon":11.2145785},{"lat":49.8532279,"lon":11.2148068},{"lat":49.8533389,"lon":11.215047},{"lat":49.8534399,"lon":11.2149347},{"lat":49.8534044,"lon":11.214857},{"lat":49.8535092,"lon":11.2147422},{"lat":49.8534337,"lon":11.2145785}]},{"type":"way","id":1029,"tags":{"building":"yes"},"geometry":[{"lat":49.851222,"lon":11.2109211},{"lat":49.8509777,"lon":11.2112558},{"lat":49.8510363,"lon":11.2113586},{"lat":49.8511865,"lon":11.211153},{"lat":49.8512459,"lon":11.2112582},{"lat":49.8513399,"lon":11.2111291},{"lat":49.851222,"lon":11.2109211}]},{"type":"way","id":1030,"tags":{"building":"yes"},"geometry":[{"lat":49.8506794,"lon":11.2115976},{"lat":49.8505307,"lon":11.2117446},{"lat":49.8504683,"lon":11.2118116},{"lat":49.8505546,"lon":11.2120159},{"lat":49.8507658,"lon":11.211802},{"lat":49.8507403,"lon":11.2117422},{"lat":49.8506794,"lon":11.2115976}]},{"type":"way","id":1031,"tags":{"building":"yes"},"geometry":[{"lat":49.8505045,"lon":11.2121952},{"lat":49.8502995,"lon":11.2121964},{"lat":49.850301,"lon":11.2124928},{"lat":49.850506,"lon":11.2124916},{"lat":49.8505045,"lon":11.2121952}]},{"type":"way","id":1032,"tags":{"building":"yes"},"geometry":[{"lat":49.8502957,"lon":11.2064486},{"lat":49.8502641,"lon":11.2069733},{"lat":49.8503743,"lon":11.20699},{"lat":49.8504066,"lon":11.2064653},{"lat":49.8502957,"lon":11.2064486}]},{"type":"way","id":1033,"tags":{"building":"yes"},"geometry":[{"lat":49.8527825,"lon":11.2134263},{"lat":49.8526608,"lon":11.2134956},{"lat":49.8527347,"lon":11.21381},{"lat":49.8528742,"lon":11.2137311},{"lat":49.8528503,"lon":11.2136283},{"lat":49.8529027,"lon":11.2135996},{"lat":49.852875,"lon":11.2134825},{"lat":49.8528049,"lon":11.2135219},{"lat":49.8527825,"lon":11.2134263}]},{"type":"way","id":1034,"tags":{"building":"yes"},"geometry":[{"lat":49.8527386,"lon":11.2144769},{"lat":49.8526392,"lon":11.2145821},{"lat":49.8525652,"lon":11.2146586},{"lat":49.8525197,"lon":11.2147064},{"lat":49.8525945,"lon":11.2148785},{"lat":49.8528133,"lon":11.214649},{"lat":49.8527386,"lon":11.2144769}]},{"type":"way","id":1035,"tags":{"building":"yes"},"geometry":[{"lat":49.8494672,"lon":11.2094044},{"lat":49.8492406,"lon":11.2095239},{"lat":49.8492876,"lon":11.2097378},{"lat":49.8495142,"lon":11.2096183},{"lat":49.8494672,"lon":11.2094044}]},{"type":"way","id":1036,"tags":{"building":"yes"},"geometry":[{"lat":49.8499489,"lon":11.2064438},{"lat":49.8499327,"lon":11.2067857},{"lat":49.8500891,"lon":11.2068048},{"lat":49.8501053,"lon":11.2064618},{"lat":49.8500467,"lon":11.2064558},{"lat":49.8499489,"lon":11.2064438}]},{"type":"way","id":1037,"tags":{"building":"yes"},"geometry":[{"lat":49.8506663,"lon":11.2113586},{"lat":49.8504567,"lon":11.2115665},{"lat":49.8505307,"lon":11.2117446},{"lat":49.8506794,"lon":11.2115976},{"lat":49.8507396,"lon":11.2115378},{"lat":49.8506663,"lon":11.2113586}]},{"type":"way","id":1038,"tags":{"building":"yes"},"geometry":[{"lat":49.8516682,"lon":11.2123183},{"lat":49.8515141,"lon":11.2123972},{"lat":49.8515788,"lon":11.2127008},{"lat":49.8517329,"lon":11.2126219},{"lat":49.8517252,"lon":11.2125849},{"lat":49.8516874,"lon":11.2124092},{"lat":49.8516682,"lon":11.2123183}]},{"type":"way","id":1039,"tags":{"building":"yes"},"geometry":[{"lat":49.8497585,"lon":11.21119},{"lat":49.8495157,"lon":11.2112247},{"lat":49.8495566,"lon":11.2114434},{"lat":49.8497577,"lon":11.2114339},{"lat":49.8497485,"lon":11.2112892},{"lat":49.8497801,"lon":11.2112689},{"lat":49.8497585,"lon":11.21119}]},{"type":"way","id":1040,"tags":{"building":"yes"},"geometry":[{"lat":49.8486803,"lon":11.2055414},{"lat":49.8486187,"lon":11.2055474},{"lat":49.8485262,"lon":11.2055582},{"lat":49.8485416,"lon":11.2058928},{"lat":49.8486957,"lon":11.2058761},{"lat":49.8486803,"lon":11.2055414}]},{"type":"way","id":1041,"tags":{"building":"yes"},"geometry":[{"lat":49.8512875,"lon":11.214594},{"lat":49.8511981,"lon":11.2147052},{"lat":49.8512644,"lon":11.2148343},{"lat":49.8512212,"lon":11.214888},{"lat":49.8513129,"lon":11.2150673},{"lat":49.8514239,"lon":11.2149299},{"lat":49.8513368,"lon":11.2147614},{"lat":49.8513592,"lon":11.2147339},{"lat":49.8512875,"lon":11.214594}]},{"type":"way","id":1042,"tags":{"building":"yes"},"geometry":[{"lat":49.8524488,"lon":11.2122789},{"lat":49.8522115,"lon":11.2125239},{"lat":49.8522762,"lon":11.2126745},{"lat":49.8525059,"lon":11.2124331},{"lat":49.8524843,"lon":11.2123398},{"lat":49.8524488,"lon":11.2122789}]},{"type":"way","id":1043,"tags":{"building":"yes"},"geometry":[{"lat":49.8523147,"lon":11.2131143},{"lat":49.8520843,"lon":11.2133008},{"lat":49.8521306,"lon":11.2134371},{"lat":49.8522238,"lon":11.2133606},{"lat":49.8522454,"lon":11.2134263},{"lat":49.8523826,"lon":11.2133151},{"lat":49.8523147,"lon":11.2131143}]},{"type":"way","id":1044,"tags":{"building":"yes"},"geometry":[{"lat":49.8494595,"lon":11.2071801},{"lat":49.8494587,"lon":11.2073319},{"lat":49.8495042,"lon":11.2073331},{"lat":49.8495034,"lon":11.207504},{"lat":49.849636,"lon":11.2075076},{"lat":49.8496383,"lon":11.2071837},{"lat":49.8494595,"lon":11.2071801}]},{"type":"way","id":1045,"tags":{"building":"yes"},"geometry":[{"lat":49.8536348,"lon":11.2133486},{"lat":49.8535038,"lon":11.2133845},{"lat":49.8535346,"lon":11.2136558},{"lat":49.8537442,"lon":11.2135984},{"lat":49.853725,"lon":11.2134323},{"lat":49.8536464,"lon":11.2134538},{"lat":49.8536348,"lon":11.2133486}]},{"type":"way","id":1046,"tags":{"building":"yes"},"geometry":[{"lat":49.850523,"lon":11.2124845},{"lat":49.850506,"lon":11.2124916},{"lat":49.8503727,"lon":11.2125418},{"lat":49.8503935,"lon":11.2126721},{"lat":49.850422,"lon":11.2128538},{"lat":49.8504644,"lon":11.2128382},{"lat":49.8505723,"lon":11.2127964},{"lat":49.8505584,"lon":11.2127092},{"lat":49.850523,"lon":11.2124845}]},{"type":"way","id":1047,"tags":{"building":"yes"},"geometry":[{"lat":49.854222,"lon":11.2139211},{"lat":49.8540694,"lon":11.2139629},{"lat":49.8541057,"lon":11.2142785},{"lat":49.8542582,"lon":11.2142367},{"lat":49.854222,"lon":11.2139211}]},{"type":"way","id":1048,"tags":{"building":"yes"},"geometry":[{"lat":49.8489855,"lon":11.2114219},{"lat":49.8488314,"lon":11.2115187},{"lat":49.848903,"lon":11.2117924},{"lat":49.8490572,"lon":11.2116956},{"lat":49.8490202,"lon":11.2115522},{"lat":49.8489855,"lon":11.2114219}]},{"type":"way","id":1049,"tags":{"building":"yes"},"geometry":[{"lat":49.849841,"lon":11.2153685},{"lat":49.8497454,"lon":11.2156279},{"lat":49.8498864,"lon":11.2157522},{"lat":49.8499234,"lon":11.2156518},{"lat":49.849982,"lon":11.2154928},{"lat":49.849841,"lon":11.2153685}]},{"type":"way","id":1050,"tags":{"building":"yes"},"geometry":[{"lat":49.8519179,"lon":11.2149873},{"lat":49.8518462,"lon":11.2150721},{"lat":49.8517761,"lon":11.2151558},{"lat":49.8518801,"lon":11.2153661},{"lat":49.8520219,"lon":11.2151976},{"lat":49.8519179,"lon":11.2149873}]},{"type":"way","id":1051,"tags":{"building":"yes"},"geometry":[{"lat":49.8504613,"lon":11.2070068},{"lat":49.8504421,"lon":11.2072757},{"lat":49.8505978,"lon":11.2073032},{"lat":49.8506016,"lon":11.207247},{"lat":49.8506109,"lon":11.2071167},{"lat":49.8506663,"lon":11.2071263},{"lat":49.8506717,"lon":11.2070426},{"lat":49.8504613,"lon":11.2070068}]},{"type":"way","id":1052,"tags":{"building":"yes"},"geometry":[{"lat":49.8498564,"lon":11.2122299},{"lat":49.8497539,"lon":11.2122681},{"lat":49.8498202,"lon":11.212702},{"lat":49.8498595,"lon":11.2126876},{"lat":49.8499234,"lon":11.2126637},{"lat":49.8498895,"lon":11.2124486},{"lat":49.8498564,"lon":11.2122299}]},{"type":"way","id":1053,"tags":{"building":"yes"},"geometry":[{"lat":49.8491574,"lon":11.2084948},{"lat":49.849098,"lon":11.208502},{"lat":49.8490163,"lon":11.2085127},{"lat":49.8490333,"lon":11.2088426},{"lat":49.8491743,"lon":11.2088247},{"lat":49.8491574,"lon":11.2084948}]},{"type":"way","id":1054,"tags":{"building":"yes"},"geometry":[{"lat":49.8525906,"lon":11.2141291},{"lat":49.8525298,"lon":11.2141936},{"lat":49.8524627,"lon":11.2142629},{"lat":49.8525706,"lon":11.2145104},{"lat":49.852596,"lon":11.2144829},{"lat":49.8526985,"lon":11.2143765},{"lat":49.8525906,"lon":11.2141291}]},{"type":"way","id":1055,"tags":{"building":"yes"},"geometry":[{"lat":49.8491828,"lon":11.2127295},{"lat":49.8490379,"lon":11.2128514},{"lat":49.8491235,"lon":11.213094},{"lat":49.8491504,"lon":11.2130713},{"lat":49.8492676,"lon":11.2129733},{"lat":49.8491828,"lon":11.2127295}]},{"type":"way","id":1056,"tags":{"building":"yes"},"geometry":[{"lat":49.8502178,"lon":11.2140072},{"lat":49.8501454,"lon":11.2140131},{"lat":49.850056,"lon":11.2140203},{"lat":49.8500652,"lon":11.2142964},{"lat":49.8502278,"lon":11.2142833},{"lat":49.8502178,"lon":11.2140072}]},{"type":"way","id":1057,"tags":{"building":"yes"},"geometry":[{"lat":49.8521398,"lon":11.2141124},{"lat":49.8520134,"lon":11.2142498},{"lat":49.8519903,"lon":11.2142749},{"lat":49.8520812,"lon":11.2144745},{"lat":49.8522307,"lon":11.214312},{"lat":49.8521398,"lon":11.2141124}]},{"type":"way","id":1058,"tags":{"building":"yes"},"geometry":[{"lat":49.849982,"lon":11.2154928},{"lat":49.8499234,"lon":11.2156518},{"lat":49.8499966,"lon":11.2157163},{"lat":49.8499535,"lon":11.2158347},{"lat":49.8500329,"lon":11.2159052},{"lat":49.8501346,"lon":11.2156279},{"lat":49.849982,"lon":11.2154928}]},{"type":"way","id":1059,"tags":{"building":"yes"},"geometry":[{"lat":49.8521421,"lon":11.2145319},{"lat":49.8521182,"lon":11.2145582},{"lat":49.8520234,"lon":11.214661},{"lat":49.8521344,"lon":11.214912},{"lat":49.8522215,"lon":11.2148175},{"lat":49.8522546,"lon":11.2147817},{"lat":49.8521421,"lon":11.2145319}]},{"type":"way","id":1060,"tags":{"building":"yes"},"geometry":[{"lat":49.850701,"lon":11.2126542},{"lat":49.8505584,"lon":11.2127092},{"lat":49.8505723,"lon":11.2127964},{"lat":49.8506031,"lon":11.2130008},{"lat":49.8507473,"lon":11.2129446},{"lat":49.850701,"lon":11.2126542}]},{"type":"way","id":1061,"tags":{"building":"yes"},"geometry":[{"lat":49.8493855,"lon":11.2101849},{"lat":49.849266,"lon":11.2102482},{"lat":49.8493393,"lon":11.2105781},{"lat":49.8494587,"lon":11.2105147},{"lat":49.8493855,"lon":11.2101849}]},{"type":"way","id":1062,"tags":{"building":"yes"},"geometry":[{"lat":49.8485786,"lon":11.2126279},{"lat":49.8484291,"lon":11.2126279},{"lat":49.8484298,"lon":11.2129195},{"lat":49.8485794,"lon":11.2129195},{"lat":49.8485786,"lon":11.2126279}]},{"type":"way","id":1063,"tags":{"building":"yes"},"geometry":[{"lat":49.8510987,"lon":11.2128275},{"lat":49.8509962,"lon":11.2130271},{"lat":49.8511233,"lon":11.2131849},{"lat":49.8512258,"lon":11.2129853},{"lat":49.8510987,"lon":11.2128275}]},{"type":"way","id":1064,"tags":{"building":"yes"},"geometry":[{"lat":49.849135,"lon":11.2140382},{"lat":49.848977,"lon":11.2140526},{"lat":49.8489871,"lon":11.2143131},{"lat":49.849145,"lon":11.2142988},{"lat":49.849135,"lon":11.2140382}]},{"type":"way","id":1065,"tags":{"building":"yes"},"geometry":[{"lat":49.8512821,"lon":11.2116681},{"lat":49.8511673,"lon":11.2118104},{"lat":49.8512412,"lon":11.2119478},{"lat":49.8512859,"lon":11.2120243},{"lat":49.8513977,"lon":11.2118749},{"lat":49.8512821,"lon":11.2116681}]},{"type":"way","id":1066,"tags":{"building":"yes"},"geometry":[{"lat":49.8494572,"lon":11.214949},{"lat":49.8494078,"lon":11.2150853},{"lat":49.8494949,"lon":11.2151618},{"lat":49.8494495,"lon":11.2152861},{"lat":49.8495219,"lon":11.2153506},{"lat":49.8496175,"lon":11.2150888},{"lat":49.8494572,"lon":11.214949}]},{"type":"way","id":1067,"tags":{"building":"yes"},"geometry":[{"lat":49.8524434,"lon":11.2134394},{"lat":49.8523356,"lon":11.213553},{"lat":49.8524481,"lon":11.2138124},{"lat":49.8525382,"lon":11.2137179},{"lat":49.852556,"lon":11.2136988},{"lat":49.8524434,"lon":11.2134394}]},{"type":"way","id":1068,"tags":{"building":"yes"},"geometry":[{"lat":49.8519903,"lon":11.2142749},{"lat":49.8518955,"lon":11.2143789},{"lat":49.8520234,"lon":11.214661},{"lat":49.8521182,"lon":11.2145582},{"lat":49.8520812,"lon":11.2144745},{"lat":49.8519903,"lon":11.2142749}]},{"type":"way","id":1069,"tags":{"building":"yes"},"geometry":[{"lat":49.8507303,"lon":11.2149657},{"lat":49.850691,"lon":11.2149789},{"lat":49.850587,"lon":11.2150135},{"lat":49.8506232,"lon":11.2152801},{"lat":49.8507665,"lon":11.2152335},{"lat":49.8507303,"lon":11.2149657}]},{"type":"way","id":1070,"tags":{"building":"yes"},"geometry":[{"lat":49.8523356,"lon":11.213553},{"lat":49.8522292,"lon":11.2136641},{"lat":49.8523417,"lon":11.2139235},{"lat":49.8524481,"lon":11.2138124},{"lat":49.8523356,"lon":11.213553}]},{"type":"way","id":1071,"tags":{"building":"yes"},"geometry":[{"lat":49.850617,"lon":11.2108841},{"lat":49.8505099,"lon":11.2109928},{"lat":49.8506186,"lon":11.2112486},{"lat":49.8507249,"lon":11.2111398},{"lat":49.8506841,"lon":11.211043},{"lat":49.850617,"lon":11.2108841}]},{"type":"way","id":1072,"tags":{"building":"yes"},"geometry":[{"lat":49.8498286,"lon":11.2109187},{"lat":49.8497069,"lon":11.2109964},{"lat":49.8497585,"lon":11.21119},{"lat":49.8497801,"lon":11.2112689},{"lat":49.8498363,"lon":11.2112331},{"lat":49.8499018,"lon":11.2111912},{"lat":49.8498286,"lon":11.2109187}]},{"type":"way","id":1073,"tags":{"building":"yes"},"geometry":[{"lat":49.8502402,"lon":11.2102195},{"lat":49.8501307,"lon":11.2103092},{"lat":49.850224,"lon":11.2105853},{"lat":49.8503342,"lon":11.2104956},{"lat":49.8502402,"lon":11.2102195}]},{"type":"way","id":1074,"tags":{"building":"yes"},"geometry":[{"lat":49.8513437,"lon":11.2122896},{"lat":49.8512235,"lon":11.212457},{"lat":49.8513252,"lon":11.2126339},{"lat":49.8513453,"lon":11.2126064},{"lat":49.8514462,"lon":11.2124665},{"lat":49.8513961,"lon":11.2123793},{"lat":49.8513437,"lon":11.2122896}]},{"type":"way","id":1075,"tags":{"building":"yes"},"geometry":[{"lat":49.8502856,"lon":11.2075936},{"lat":49.8501361,"lon":11.2076032},{"lat":49.8501431,"lon":11.207859},{"lat":49.8502926,"lon":11.2078494},{"lat":49.850291,"lon":11.2077992},{"lat":49.8502856,"lon":11.2075936}]},{"type":"way","id":1076,"tags":{"building":"yes"},"geometry":[{"lat":49.8494256,"lon":11.2096912},{"lat":49.8492922,"lon":11.2097629},{"lat":49.8493485,"lon":11.2100175},{"lat":49.8494818,"lon":11.2099458},{"lat":49.8494256,"lon":11.2096912}]},{"type":"way","id":1077,"tags":{"building":"yes"},"geometry":[{"lat":49.853725,"lon":11.2137789},{"lat":49.8535801,"lon":11.2138183},{"lat":49.8536094,"lon":11.2140741},{"lat":49.8536772,"lon":11.2140562},{"lat":49.8537535,"lon":11.2140347},{"lat":49.853725,"lon":11.2137789}]},{"type":"way","id":1078,"tags":{"building":"yes"},"geometry":[{"lat":49.8517229,"lon":11.2127606},{"lat":49.8515426,"lon":11.2129279},{"lat":49.8516443,"lon":11.2130689},{"lat":49.8517915,"lon":11.2129207},{"lat":49.8517229,"lon":11.2127606}]},{"type":"way","id":1079,"tags":{"building":"yes"},"geometry":[{"lat":49.8497053,"lon":11.2105183},{"lat":49.8495543,"lon":11.2106092},{"lat":49.8495905,"lon":11.2107574},{"lat":49.8496082,"lon":11.2108267},{"lat":49.8496575,"lon":11.2107968},{"lat":49.8497207,"lon":11.2107586},{"lat":49.8497593,"lon":11.2107359},{"lat":49.8497053,"lon":11.2105183}]},{"type":"way","id":1080,"tags":{"building":"yes"},"geometry":[{"lat":49.8507257,"lon":11.2141052},{"lat":49.8506278,"lon":11.2142689},{"lat":49.8507511,"lon":11.2144458},{"lat":49.850849,"lon":11.2142821},{"lat":49.8507257,"lon":11.2141052}]},{"type":"way","id":1081,"tags":{"building":"yes"},"geometry":[{"lat":49.8506147,"lon":11.2105124},{"lat":49.8505022,"lon":11.210651},{"lat":49.8504721,"lon":11.2105924},{"lat":49.8504105,"lon":11.2106701},{"lat":49.8504968,"lon":11.2108375},{"lat":49.8506702,"lon":11.2106211},{"lat":49.8506147,"lon":11.2105124}]},{"type":"way","id":1082,"tags":{"building":"yes"},"geometry":[{"lat":49.852408,"lon":11.2146538},{"lat":49.8523178,"lon":11.2147458},{"lat":49.8524404,"lon":11.2150315},{"lat":49.8525298,"lon":11.2149382},{"lat":49.852408,"lon":11.2146538}]},{"type":"way","id":1083,"tags":{"building":"yes"},"geometry":[{"lat":49.8520196,"lon":11.2129506},{"lat":49.8519656,"lon":11.2131837},{"lat":49.8521067,"lon":11.2132542},{"lat":49.8521583,"lon":11.2130247},{"lat":49.8520196,"lon":11.2129506}]},{"type":"way","id":1084,"tags":{"building":"yes"},"geometry":[{"lat":49.8501824,"lon":11.2126673},{"lat":49.8500645,"lon":11.2126865},{"lat":49.8500853,"lon":11.2129888},{"lat":49.8501854,"lon":11.2129721},{"lat":49.8502032,"lon":11.2129697},{"lat":49.8501824,"lon":11.2126673}]},{"type":"way","id":1085,"tags":{"building":"yes"},"geometry":[{"lat":49.8515426,"lon":11.2110789},{"lat":49.8513314,"lon":11.2113227},{"lat":49.8513838,"lon":11.2114315},{"lat":49.851595,"lon":11.2111876},{"lat":49.8515426,"lon":11.2110789}]},{"type":"way","id":1086,"tags":{"building":"yes"},"geometry":[{"lat":49.8500344,"lon":11.2115307},{"lat":49.8498641,"lon":11.2115522},{"lat":49.8498718,"lon":11.211704},{"lat":49.8498741,"lon":11.2117554},{"lat":49.8500444,"lon":11.2117351},{"lat":49.8500344,"lon":11.2115307}]},{"type":"way","id":1087,"tags":{"building":"yes"},"geometry":[{"lat":49.8506887,"lon":11.2135494},{"lat":49.85057,"lon":11.2136474},{"lat":49.8506478,"lon":11.2138757},{"lat":49.8507665,"lon":11.2137777},{"lat":49.8506887,"lon":11.2135494}]},{"type":"way","id":1088,"tags":{"building":"yes"},"geometry":[{"lat":49.8512459,"lon":11.2112582},{"lat":49.851121,"lon":11.2114291},{"lat":49.8512089,"lon":11.2115833},{"lat":49.8513337,"lon":11.2114124},{"lat":49.8512459,"lon":11.2112582}]},{"type":"way","id":1089,"tags":{"building":"yes"},"geometry":[{"lat":49.8500999,"lon":11.2107203},{"lat":49.8500729,"lon":11.2107382},{"lat":49.8499396,"lon":11.2108255},{"lat":49.8499889,"lon":11.2110048},{"lat":49.8501492,"lon":11.2108996},{"lat":49.8501292,"lon":11.2108267},{"lat":49.8500999,"lon":11.2107203}]},{"type":"way","id":1090,"tags":{"building":"yes"},"geometry":[{"lat":49.8539993,"lon":11.2164825},{"lat":49.8538221,"lon":11.2165327},{"lat":49.8538444,"lon":11.2167179},{"lat":49.8540209,"lon":11.2166677},{"lat":49.8539993,"lon":11.2164825}]},{"type":"way","id":1091,"tags":{"building":"yes"},"geometry":[{"lat":49.8495065,"lon":11.2123339},{"lat":49.8493847,"lon":11.2124355},{"lat":49.8494587,"lon":11.2126458},{"lat":49.8495797,"lon":11.212543},{"lat":49.8495065,"lon":11.2123339}]},{"type":"way","id":1092,"tags":{"building":"yes"},"geometry":[{"lat":49.8532904,"lon":11.2126661},{"lat":49.8531462,"lon":11.2127307},{"lat":49.8531855,"lon":11.212941},{"lat":49.8533297,"lon":11.2128765},{"lat":49.8533104,"lon":11.2127737},{"lat":49.8532904,"lon":11.2126661}]},{"type":"way","id":1093,"tags":{"building":"yes"},"geometry":[{"lat":49.848974,"lon":11.2079821},{"lat":49.8487612,"lon":11.2080466},{"lat":49.8487797,"lon":11.2081984},{"lat":49.8489832,"lon":11.2081375},{"lat":49.8489763,"lon":11.2080861},{"lat":49.848974,"lon":11.2079821}]},{"type":"way","id":1094,"tags":{"building":"yes"},"geometry":[{"lat":49.8489185,"lon":11.2107538},{"lat":49.8487666,"lon":11.2108482},{"lat":49.8488136,"lon":11.2110299},{"lat":49.8489655,"lon":11.2109355},{"lat":49.8489185,"lon":11.2107538}]},{"type":"way","id":1095,"tags":{"building":"yes"},"geometry":[{"lat":49.8490464,"lon":11.2120434},{"lat":49.8489123,"lon":11.2121271},{"lat":49.8489377,"lon":11.2122275},{"lat":49.8488452,"lon":11.2122849},{"lat":49.8488707,"lon":11.2123841},{"lat":49.8489608,"lon":11.2123279},{"lat":49.848957,"lon":11.2122502},{"lat":49.8490803,"lon":11.2121737},{"lat":49.8490464,"lon":11.2120434}]},{"type":"way","id":1096,"tags":{"building":"yes"},"geometry":[{"lat":49.8510825,"lon":11.2099637},{"lat":49.8509261,"lon":11.2101084},{"lat":49.8509831,"lon":11.2102566},{"lat":49.8511395,"lon":11.210112},{"lat":49.8510825,"lon":11.2099637}]},{"type":"way","id":1097,"tags":{"building":"yes"},"geometry":[{"lat":49.8505723,"lon":11.2127964},{"lat":49.8504644,"lon":11.2128382},{"lat":49.8505084,"lon":11.2131131},{"lat":49.8506147,"lon":11.2130725},{"lat":49.8506031,"lon":11.2130008},{"lat":49.8505723,"lon":11.2127964}]},{"type":"way","id":1098,"tags":{"building":"yes"},"geometry":[{"lat":49.8497292,"lon":11.2074191},{"lat":49.8497284,"lon":11.2075088},{"lat":49.849636,"lon":11.2075076},{"lat":49.8496352,"lon":11.2076283},{"lat":49.8498217,"lon":11.2076319},{"lat":49.8498232,"lon":11.2074203},{"lat":49.8497292,"lon":11.2074191}]},{"type":"way","id":1099,"tags":{"building":"yes"},"geometry":[{"lat":49.849303,"lon":11.2110478},{"lat":49.8491712,"lon":11.2111351},{"lat":49.8492252,"lon":11.2113299},{"lat":49.849357,"lon":11.2112414},{"lat":49.849303,"lon":11.2110478}]},{"type":"way","id":1100,"tags":{"building":"yes"},"geometry":[{"lat":49.8489716,"lon":11.209512},{"lat":49.848883,"lon":11.2095131},{"lat":49.8488853,"lon":11.2098562},{"lat":49.8489732,"lon":11.209855},{"lat":49.8489716,"lon":11.209512}]},{"type":"way","id":1101,"tags":{"building":"yes"},"geometry":[{"lat":49.8522215,"lon":11.2148175},{"lat":49.8521344,"lon":11.214912},{"lat":49.8522415,"lon":11.2151414},{"lat":49.852324,"lon":11.2150494},{"lat":49.8522215,"lon":11.2148175}]},{"type":"way","id":1102,"tags":{"building":"yes"},"geometry":[{"lat":49.8515888,"lon":11.2119406},{"lat":49.8514139,"lon":11.212188},{"lat":49.8514678,"lon":11.2122789},{"lat":49.851642,"lon":11.2120303},{"lat":49.8515888,"lon":11.2119406}]},{"type":"way","id":1103,"tags":{"building":"yes"},"geometry":[{"lat":49.8515426,"lon":11.2129279},{"lat":49.8514516,"lon":11.2130857},{"lat":49.8515534,"lon":11.2132267},{"lat":49.8515911,"lon":11.213161},{"lat":49.8516443,"lon":11.2130689},{"lat":49.8515426,"lon":11.2129279}]},{"type":"way","id":1104,"tags":{"building":"yes"},"geometry":[{"lat":49.8527525,"lon":11.212555},{"lat":49.8526384,"lon":11.2126207},{"lat":49.8525629,"lon":11.2126602},{"lat":49.8525968,"lon":11.212806},{"lat":49.8526823,"lon":11.2127582},{"lat":49.8527486,"lon":11.2127211},{"lat":49.8527363,"lon":11.2126661},{"lat":49.8527733,"lon":11.2126458},{"lat":49.8527525,"lon":11.212555}]},{"type":"way","id":1105,"tags":{"building":"yes"},"geometry":[{"lat":49.8507496,"lon":11.2098239},{"lat":49.8506286,"lon":11.2098693},{"lat":49.8506625,"lon":11.2100928},{"lat":49.8507819,"lon":11.2100486},{"lat":49.8507496,"lon":11.2098239}]},{"type":"way","id":1106,"tags":{"building":"yes"},"geometry":[{"lat":49.8507819,"lon":11.2100486},{"lat":49.8506625,"lon":11.2100928},{"lat":49.8506972,"lon":11.2103175},{"lat":49.8508166,"lon":11.2102733},{"lat":49.8507819,"lon":11.2100486}]},{"type":"way","id":1107,"tags":{"building":"yes"},"geometry":[{"lat":49.8525382,"lon":11.2137179},{"lat":49.8524481,"lon":11.2138124},{"lat":49.8524951,"lon":11.2139223},{"lat":49.8525405,"lon":11.2140263},{"lat":49.8526315,"lon":11.2139319},{"lat":49.8525382,"lon":11.2137179}]},{"type":"way","id":1108,"tags":{"building":"yes"},"geometry":[{"lat":49.8521622,"lon":11.2137251},{"lat":49.8520812,"lon":11.21381},{"lat":49.8521853,"lon":11.214049},{"lat":49.8522662,"lon":11.2139641},{"lat":49.8521622,"lon":11.2137251}]},{"type":"way","id":1109,"tags":{"building":"yes"},"geometry":[{"lat":49.8519656,"lon":11.2131837},{"lat":49.851914,"lon":11.21321},{"lat":49.8518493,"lon":11.2132422},{"lat":49.8518948,"lon":11.2134598},{"lat":49.8520111,"lon":11.2134},{"lat":49.8519656,"lon":11.2131837}]},{"type":"way","id":1110,"tags":{"building":"yes"},"geometry":[{"lat":49.8522793,"lon":11.2153876},{"lat":49.8522107,"lon":11.2154259},{"lat":49.8522924,"lon":11.2157833},{"lat":49.8523618,"lon":11.215745},{"lat":49.8522793,"lon":11.2153876}]},{"type":"way","id":1111,"tags":{"building":"yes"},"geometry":[{"lat":49.8488838,"lon":11.2092406},{"lat":49.8488445,"lon":11.2092406},{"lat":49.8487697,"lon":11.2092418},{"lat":49.8487713,"lon":11.2094845},{"lat":49.8488853,"lon":11.2094821},{"lat":49.8488838,"lon":11.2092406}]},{"type":"way","id":1112,"tags":{"building":"yes"},"geometry":[{"lat":49.8508112,"lon":11.2114625},{"lat":49.8507396,"lon":11.2115378},{"lat":49.8506794,"lon":11.2115976},{"lat":49.8507403,"lon":11.2117422},{"lat":49.8508729,"lon":11.2116072},{"lat":49.8508112,"lon":11.2114625}]},{"type":"way","id":1113,"tags":{"building":"yes"},"geometry":[{"lat":49.8515903,"lon":11.2140526},{"lat":49.8514054,"lon":11.2141829},{"lat":49.8514408,"lon":11.2143048},{"lat":49.8516258,"lon":11.2141745},{"lat":49.8515903,"lon":11.2140526}]},{"type":"way","id":1114,"tags":{"building":"yes"},"geometry":[{"lat":49.8498641,"lon":11.2115522},{"lat":49.8496853,"lon":11.2115701},{"lat":49.8496884,"lon":11.2116633},{"lat":49.8496907,"lon":11.2117183},{"lat":49.8498718,"lon":11.211704},{"lat":49.8498641,"lon":11.2115522}]},{"type":"way","id":1115,"tags":{"building":"yes"},"geometry":[{"lat":49.8500097,"lon":11.2124044},{"lat":49.8499727,"lon":11.2124187},{"lat":49.8498895,"lon":11.2124486},{"lat":49.8499234,"lon":11.2126637},{"lat":49.8500429,"lon":11.2126195},{"lat":49.8500097,"lon":11.2124044}]},{"type":"way","id":1116,"tags":{"building":"yes"},"geometry":[{"lat":49.8495011,"lon":11.2078064},{"lat":49.8494988,"lon":11.2080394},{"lat":49.8496152,"lon":11.2080418},{"lat":49.8496167,"lon":11.2078088},{"lat":49.8495011,"lon":11.2078064}]},{"type":"way","id":1117,"tags":{"building":"yes"},"geometry":[{"lat":49.851773,"lon":11.2108124},{"lat":49.8516235,"lon":11.2109845},{"lat":49.8516759,"lon":11.2110932},{"lat":49.8518254,"lon":11.2109211},{"lat":49.851773,"lon":11.2108124}]},{"type":"way","id":1118,"tags":{"building":"yes"},"geometry":[{"lat":49.8538529,"lon":11.2123506},{"lat":49.8537373,"lon":11.2124259},{"lat":49.8537874,"lon":11.2126112},{"lat":49.853903,"lon":11.2125371},{"lat":49.8538529,"lon":11.2123506}]},{"type":"way","id":1119,"tags":{"building":"yes"},"geometry":[{"lat":49.8496252,"lon":11.2090231},{"lat":49.8495173,"lon":11.2090841},{"lat":49.8495651,"lon":11.2092896},{"lat":49.849673,"lon":11.2092287},{"lat":49.8496252,"lon":11.2090231}]},{"type":"way","id":1120,"tags":{"building":"yes"},"geometry":[{"lat":49.8503565,"lon":11.212659},{"lat":49.8502779,"lon":11.2126888},{"lat":49.8503257,"lon":11.2129853},{"lat":49.8504043,"lon":11.2129554},{"lat":49.8503565,"lon":11.212659}]},{"type":"way","id":1121,"tags":{"building":"yes"},"geometry":[{"lat":49.8492676,"lon":11.2129733},{"lat":49.8491504,"lon":11.2130713},{"lat":49.8492067,"lon":11.2132339},{"lat":49.8493246,"lon":11.2131347},{"lat":49.8492676,"lon":11.2129733}]},{"type":"way","id":1122,"tags":{"building":"yes"},"geometry":[{"lat":49.8532487,"lon":11.2125311},{"lat":49.8530977,"lon":11.2125992},{"lat":49.8531239,"lon":11.2127402},{"lat":49.8531462,"lon":11.2127307},{"lat":49.8532904,"lon":11.2126661},{"lat":49.8532487,"lon":11.2125311}]},{"type":"way","id":1123,"tags":{"building":"yes"},"geometry":[{"lat":49.8499805,"lon":11.2118952},{"lat":49.849888,"lon":11.2119072},{"lat":49.8499018,"lon":11.2121689},{"lat":49.8499334,"lon":11.2121629},{"lat":49.8499943,"lon":11.2121534},{"lat":49.8499905,"lon":11.2120817},{"lat":49.8499828,"lon":11.2119406},{"lat":49.8499805,"lon":11.2118952}]},{"type":"way","id":1124,"tags":{"building":"yes"},"geometry":[{"lat":49.8501747,"lon":11.2121211},{"lat":49.8500776,"lon":11.2121319},{"lat":49.8500883,"lon":11.2123769},{"lat":49.8501854,"lon":11.2123661},{"lat":49.8501747,"lon":11.2121211}]},{"type":"way","id":1125,"tags":{"building":"yes"},"geometry":[{"lat":49.8518277,"lon":11.212653},{"lat":49.8517229,"lon":11.2127606},{"lat":49.8517915,"lon":11.2129207},{"lat":49.8518955,"lon":11.2128131},{"lat":49.8518277,"lon":11.212653}]},{"type":"way","id":1126,"tags":{"building":"yes"},"geometry":[{"lat":49.8535161,"lon":11.2141339},{"lat":49.8533628,"lon":11.2141769},{"lat":49.8533805,"lon":11.2143263},{"lat":49.8535331,"lon":11.2142845},{"lat":49.8535161,"lon":11.2141339}]},{"type":"way","id":1127,"tags":{"building":"yes"},"geometry":[{"lat":49.8497022,"lon":11.2127594},{"lat":49.8495543,"lon":11.212959},{"lat":49.8496051,"lon":11.2130498},{"lat":49.8497531,"lon":11.2128502},{"lat":49.8497022,"lon":11.2127594}]},{"type":"way","id":1128,"tags":{"building":"yes"},"geometry":[{"lat":49.8504151,"lon":11.2131406},{"lat":49.8503126,"lon":11.2131837},{"lat":49.8503504,"lon":11.2133976},{"lat":49.8504529,"lon":11.2133546},{"lat":49.8504151,"lon":11.2131406}]},{"type":"way","id":1129,"tags":{"building":"yes"},"geometry":[{"lat":49.8500174,"lon":11.2105327},{"lat":49.8498887,"lon":11.2106175},{"lat":49.8499304,"lon":11.2107705},{"lat":49.8500591,"lon":11.2106857},{"lat":49.850039,"lon":11.2106116},{"lat":49.8500174,"lon":11.2105327}]},{"type":"way","id":1130,"tags":{"building":"yes"},"geometry":[{"lat":49.852324,"lon":11.2150494},{"lat":49.8522415,"lon":11.2151414},{"lat":49.8523271,"lon":11.2153267},{"lat":49.8523841,"lon":11.2152622},{"lat":49.8524095,"lon":11.2152347},{"lat":49.852324,"lon":11.2150494}]},{"type":"way","id":1131,"tags":{"building":"yes"},"geometry":[{"lat":49.8487327,"lon":11.2134048},{"lat":49.8487312,"lon":11.2135996},{"lat":49.8488499,"lon":11.2135972},{"lat":49.8488499,"lon":11.2134048},{"lat":49.8487327,"lon":11.2134048}]},{"type":"way","id":1132,"tags":{"building":"yes"},"geometry":[{"lat":49.8499334,"lon":11.2121629},{"lat":49.8499018,"lon":11.2121689},{"lat":49.8498502,"lon":11.212188},{"lat":49.8498564,"lon":11.2122299},{"lat":49.8498895,"lon":11.2124486},{"lat":49.8499727,"lon":11.2124187},{"lat":49.8499334,"lon":11.2121629}]},{"type":"way","id":1133,"tags":{"building":"yes"},"geometry":[{"lat":49.8510185,"lon":11.2118008},{"lat":49.8509083,"lon":11.2119454},{"lat":49.8509738,"lon":11.2120661},{"lat":49.8510825,"lon":11.2119167},{"lat":49.8510185,"lon":11.2118008}]},{"type":"way","id":1134,"tags":{"building":"yes"},"geometry":[{"lat":49.8493485,"lon":11.2100175},{"lat":49.849229,"lon":11.2100809},{"lat":49.849266,"lon":11.2102482},{"lat":49.8493855,"lon":11.2101849},{"lat":49.8493485,"lon":11.2100175}]},{"type":"way","id":1135,"tags":{"building":"yes"},"geometry":[{"lat":49.8520227,"lon":11.213394},{"lat":49.8520111,"lon":11.2134},{"lat":49.8518948,"lon":11.2134598},{"lat":49.8519287,"lon":11.2136139},{"lat":49.8520558,"lon":11.213547},{"lat":49.8520227,"lon":11.213394}]},{"type":"way","id":1136,"tags":{"building":"yes"},"geometry":[{"lat":49.8521113,"lon":11.2126554},{"lat":49.8519687,"lon":11.2127749},{"lat":49.8520088,"lon":11.212892},{"lat":49.8521521,"lon":11.2127725},{"lat":49.8521113,"lon":11.2126554}]},{"type":"way","id":1137,"tags":{"building":"yes"},"geometry":[{"lat":49.8508513,"lon":11.2095693},{"lat":49.8507049,"lon":11.2097223},{"lat":49.8507496,"lon":11.2098239},{"lat":49.850896,"lon":11.2096697},{"lat":49.8508513,"lon":11.2095693}]},{"type":"way","id":1138,"tags":{"building":"yes"},"geometry":[{"lat":49.8486079,"lon":11.2053155},{"lat":49.8485801,"lon":11.2053191},{"lat":49.8485162,"lon":11.2053251},{"lat":49.8485262,"lon":11.2055582},{"lat":49.8486187,"lon":11.2055474},{"lat":49.8486079,"lon":11.2053155}]},{"type":"way","id":1139,"tags":{"building":"yes"},"geometry":[{"lat":49.8497192,"lon":11.2132004},{"lat":49.8496028,"lon":11.213296},{"lat":49.8496521,"lon":11.2134394},{"lat":49.8497685,"lon":11.2133438},{"lat":49.8497192,"lon":11.2132004}]},{"type":"way","id":1140,"tags":{"building":"yes"},"geometry":[{"lat":49.8499596,"lon":11.2062263},{"lat":49.8499489,"lon":11.2064438},{"lat":49.8500467,"lon":11.2064558},{"lat":49.8500567,"lon":11.2062382},{"lat":49.8500336,"lon":11.2062347},{"lat":49.8499596,"lon":11.2062263}]},{"type":"way","id":1141,"tags":{"building":"yes"},"geometry":[{"lat":49.852623,"lon":11.2151199},{"lat":49.852549,"lon":11.2151904},{"lat":49.8526292,"lon":11.2153912},{"lat":49.8527031,"lon":11.2153207},{"lat":49.852623,"lon":11.2151199}]},{"type":"way","id":1142,"tags":{"building":"yes"},"geometry":[{"lat":49.8529266,"lon":11.2137263},{"lat":49.8529081,"lon":11.2138757},{"lat":49.8530407,"lon":11.2139163},{"lat":49.8530592,"lon":11.2137669},{"lat":49.8529266,"lon":11.2137263}]},{"type":"way","id":1143,"tags":{"building":"yes"},"geometry":[{"lat":49.8513453,"lon":11.2126064},{"lat":49.8513252,"lon":11.2126339},{"lat":49.8512875,"lon":11.2126865},{"lat":49.8514,"lon":11.2128825},{"lat":49.8514578,"lon":11.2128024},{"lat":49.8513453,"lon":11.2126064}]},{"type":"way","id":1144,"tags":{"building":"yes"},"geometry":[{"lat":49.8499481,"lon":11.2111614},{"lat":49.8499018,"lon":11.2111912},{"lat":49.8498363,"lon":11.2112331},{"lat":49.8498772,"lon":11.2113873},{"lat":49.8499889,"lon":11.2113155},{"lat":49.8499481,"lon":11.2111614}]},{"type":"way","id":1145,"tags":{"building":"yes"},"geometry":[{"lat":49.8491381,"lon":11.2114781},{"lat":49.8490202,"lon":11.2115522},{"lat":49.8490572,"lon":11.2116956},{"lat":49.8491751,"lon":11.2116215},{"lat":49.8491381,"lon":11.2114781}]},{"type":"way","id":1146,"tags":{"building":"yes"},"geometry":[{"lat":49.8494795,"lon":11.2112319},{"lat":49.8493762,"lon":11.2112821},{"lat":49.8494109,"lon":11.211453},{"lat":49.8495142,"lon":11.2114028},{"lat":49.8494795,"lon":11.2112319}]},{"type":"way","id":1147,"tags":{"building":"yes"},"geometry":[{"lat":49.851299,"lon":11.2103713},{"lat":49.8511935,"lon":11.210443},{"lat":49.8512366,"lon":11.2105936},{"lat":49.8513414,"lon":11.2105207},{"lat":49.851299,"lon":11.2103713}]},{"type":"way","id":1148,"tags":{"building":"yes"},"geometry":[{"lat":49.8524951,"lon":11.2139223},{"lat":49.852371,"lon":11.2140514},{"lat":49.8524165,"lon":11.2141566},{"lat":49.8524835,"lon":11.2140861},{"lat":49.8525405,"lon":11.2140263},{"lat":49.8524951,"lon":11.2139223}]},{"type":"way","id":1149,"tags":{"building":"yes"},"geometry":[{"lat":49.8505523,"lon":11.2143789},{"lat":49.8504452,"lon":11.2144112},{"lat":49.8504644,"lon":11.2145689},{"lat":49.8505723,"lon":11.2145367},{"lat":49.8505523,"lon":11.2143789}]},{"type":"way","id":1150,"tags":{"building":"yes"},"geometry":[{"lat":49.8529628,"lon":11.2145952},{"lat":49.8528997,"lon":11.2146693},{"lat":49.8529829,"lon":11.214839},{"lat":49.8530461,"lon":11.2147649},{"lat":49.8529628,"lon":11.2145952}]},{"type":"way","id":1151,"tags":{"building":"yes"},"geometry":[{"lat":49.8544917,"lon":11.2121928},{"lat":49.8544124,"lon":11.212243},{"lat":49.8544594,"lon":11.2124247},{"lat":49.8545395,"lon":11.2123757},{"lat":49.8544917,"lon":11.2121928}]},{"type":"way","id":1152,"tags":{"building":"yes"},"geometry":[{"lat":49.8504798,"lon":11.2076845},{"lat":49.8503982,"lon":11.2076892},{"lat":49.8504005,"lon":11.207792},{"lat":49.8504035,"lon":11.207896},{"lat":49.8504852,"lon":11.2078912},{"lat":49.8504798,"lon":11.2076845}]},{"type":"way","id":1153,"tags":{"building":"yes"},"geometry":[{"lat":49.8504567,"lon":11.2115665},{"lat":49.8503904,"lon":11.2116275},{"lat":49.8504683,"lon":11.2118116},{"lat":49.8505307,"lon":11.2117446},{"lat":49.8504567,"lon":11.2115665}]},{"type":"way","id":1154,"tags":{"building":"yes"},"geometry":[{"lat":49.8491828,"lon":11.2083155},{"lat":49.8490896,"lon":11.2083275},{"lat":49.849098,"lon":11.208502},{"lat":49.8491574,"lon":11.2084948},{"lat":49.8491913,"lon":11.2084912},{"lat":49.8491828,"lon":11.2083155}]},{"type":"way","id":1155,"tags":{"building":"yes"},"geometry":[{"lat":49.8495543,"lon":11.2106092},{"lat":49.8494579,"lon":11.2106665},{"lat":49.8494949,"lon":11.2108135},{"lat":49.8495905,"lon":11.2107574},{"lat":49.8495543,"lon":11.2106092}]},{"type":"way","id":1156,"tags":{"building":"yes"},"geometry":[{"lat":49.8504005,"lon":11.207792},{"lat":49.850291,"lon":11.2077992},{"lat":49.8502926,"lon":11.2078494},{"lat":49.8502949,"lon":11.2079462},{"lat":49.8504043,"lon":11.207939},{"lat":49.8504035,"lon":11.207896},{"lat":49.8504005,"lon":11.207792}]},{"type":"way","id":1157,"tags":{"building":"yes"},"geometry":[{"lat":49.848977,"lon":11.2135351},{"lat":49.8488745,"lon":11.2136259},{"lat":49.8489177,"lon":11.213743},{"lat":49.8490202,"lon":11.2136522},{"lat":49.848977,"lon":11.2135351}]},{"type":"way","id":1158,"tags":{"building":"yes"},"geometry":[{"lat":49.8507588,"lon":11.2147829},{"lat":49.8506687,"lon":11.2148127},{"lat":49.850691,"lon":11.2149789},{"lat":49.8507303,"lon":11.2149657},{"lat":49.8507812,"lon":11.214949},{"lat":49.8507588,"lon":11.2147829}]},{"type":"way","id":1159,"tags":{"building":"yes"},"geometry":[{"lat":49.8516443,"lon":11.2130689},{"lat":49.8515911,"lon":11.213161},{"lat":49.8516851,"lon":11.2132912},{"lat":49.8517383,"lon":11.2131992},{"lat":49.8516443,"lon":11.2130689}]},{"type":"way","id":1160,"tags":{"building":"yes"},"geometry":[{"lat":49.8501423,"lon":11.2105434},{"lat":49.850039,"lon":11.2106116},{"lat":49.8500591,"lon":11.2106857},{"lat":49.8500729,"lon":11.2107382},{"lat":49.8500999,"lon":11.2107203},{"lat":49.8501762,"lon":11.2106701},{"lat":49.8501423,"lon":11.2105434}]},{"type":"way","id":1161,"tags":{"building":"yes"},"geometry":[{"lat":49.8517383,"lon":11.2131992},{"lat":49.8516851,"lon":11.2132912},{"lat":49.8516666,"lon":11.2133247},{"lat":49.8517329,"lon":11.2134155},{"lat":49.8518046,"lon":11.2132912},{"lat":49.8517383,"lon":11.2131992}]},{"type":"way","id":1162,"tags":{"building":"yes"},"geometry":[{"lat":49.8502178,"lon":11.2106426},{"lat":49.8501762,"lon":11.2106701},{"lat":49.8500999,"lon":11.2107203},{"lat":49.8501292,"lon":11.2108267},{"lat":49.8502471,"lon":11.2107502},{"lat":49.8502178,"lon":11.2106426}]},{"type":"way","id":1163,"tags":{"building":"yes"},"geometry":[{"lat":49.8526985,"lon":11.2143765},{"lat":49.852596,"lon":11.2144829},{"lat":49.8526392,"lon":11.2145821},{"lat":49.8527386,"lon":11.2144769},{"lat":49.8527409,"lon":11.2144745},{"lat":49.8526985,"lon":11.2143765}]},{"type":"way","id":1164,"tags":{"building":"yes"},"geometry":[{"lat":49.8502117,"lon":11.2138076},{"lat":49.8501384,"lon":11.2138135},{"lat":49.8501454,"lon":11.2140131},{"lat":49.8502178,"lon":11.2140072},{"lat":49.8502117,"lon":11.2138076}]},{"type":"way","id":1165,"tags":{"building":"yes"},"geometry":[{"lat":49.8537951,"lon":11.2142773},{"lat":49.8537134,"lon":11.2143},{"lat":49.8537327,"lon":11.2144721},{"lat":49.8538144,"lon":11.2144494},{"lat":49.8537951,"lon":11.2142773}]},{"type":"way","id":1166,"tags":{"building":"yes"},"geometry":[{"lat":49.8518562,"lon":11.2148629},{"lat":49.8517845,"lon":11.2149478},{"lat":49.8518462,"lon":11.2150721},{"lat":49.8519179,"lon":11.2149873},{"lat":49.8518562,"lon":11.2148629}]},{"type":"way","id":1167,"tags":{"building":"yes"},"geometry":[{"lat":49.8499612,"lon":11.2073044},{"lat":49.8498918,"lon":11.2073044},{"lat":49.8498934,"lon":11.2075088},{"lat":49.849962,"lon":11.2075088},{"lat":49.8499612,"lon":11.2073044}]},{"type":"way","id":1168,"tags":{"building":"yes"},"geometry":[{"lat":49.8523841,"lon":11.2152622},{"lat":49.8523271,"lon":11.2153267},{"lat":49.8523987,"lon":11.2154952},{"lat":49.8524558,"lon":11.2154402},{"lat":49.8523841,"lon":11.2152622}]},{"type":"way","id":1169,"tags":{"building":"yes"},"geometry":[{"lat":49.8500814,"lon":11.2119275},{"lat":49.8499828,"lon":11.2119406},{"lat":49.8499905,"lon":11.2120817},{"lat":49.8500891,"lon":11.2120685},{"lat":49.8500814,"lon":11.2119275}]},{"type":"way","id":1170,"tags":{"building":"yes"},"geometry":[{"lat":49.8518724,"lon":11.2130175},{"lat":49.8518069,"lon":11.213051},{"lat":49.8518493,"lon":11.2132422},{"lat":49.851914,"lon":11.21321},{"lat":49.8518724,"lon":11.2130175}]},{"type":"way","id":1171,"tags":{"building":"yes"},"geometry":[{"lat":49.8489115,"lon":11.2110741},{"lat":49.8488152,"lon":11.2111339},{"lat":49.8488468,"lon":11.211257},{"lat":49.8489431,"lon":11.211196},{"lat":49.8489115,"lon":11.2110741}]},{"type":"way","id":1172,"tags":{"building":"yes"},"geometry":[{"lat":49.8516235,"lon":11.2109845},{"lat":49.8515426,"lon":11.2110789},{"lat":49.851595,"lon":11.2111876},{"lat":49.8516759,"lon":11.2110932},{"lat":49.8516235,"lon":11.2109845}]},{"type":"way","id":1173,"tags":{"building":"yes"},"geometry":[{"lat":49.8537535,"lon":11.2140347},{"lat":49.8536772,"lon":11.2140562},{"lat":49.8536965,"lon":11.2142271},{"lat":49.8537735,"lon":11.2142068},{"lat":49.8537535,"lon":11.2140347}]},{"type":"way","id":1174,"tags":{"building":"yes"},"geometry":[{"lat":49.8506109,"lon":11.2071167},{"lat":49.8506016,"lon":11.207247},{"lat":49.8507041,"lon":11.2072649},{"lat":49.8507134,"lon":11.2071347},{"lat":49.8506663,"lon":11.2071263},{"lat":49.8506109,"lon":11.2071167}]},{"type":"way","id":1175,"tags":{"building":"yes"},"geometry":[{"lat":49.8530461,"lon":11.2147649},{"lat":49.8529829,"lon":11.214839},{"lat":49.8530484,"lon":11.2149729},{"lat":49.8531116,"lon":11.2148988},{"lat":49.8530461,"lon":11.2147649}]},{"type":"way","id":1176,"tags":{"building":"yes"},"geometry":[{"lat":49.8507265,"lon":11.2074024},{"lat":49.8507026,"lon":11.2074932},{"lat":49.8508243,"lon":11.2075709},{"lat":49.850849,"lon":11.2074801},{"lat":49.8507265,"lon":11.2074024}]},{"type":"way","id":1177,"tags":{"building":"yes"},"geometry":[{"lat":49.8543353,"lon":11.2142163},{"lat":49.8542582,"lon":11.2142367},{"lat":49.8542752,"lon":11.2143908},{"lat":49.854353,"lon":11.2143705},{"lat":49.8543353,"lon":11.2142163}]},{"type":"way","id":1178,"tags":{"building":"yes"},"geometry":[{"lat":49.8488067,"lon":11.209096},{"lat":49.8487212,"lon":11.209151},{"lat":49.8487489,"lon":11.209255},{"lat":49.8487697,"lon":11.2092418},{"lat":49.8488445,"lon":11.2092406},{"lat":49.8488067,"lon":11.209096}]},{"type":"way","id":1179,"tags":{"building":"yes"},"geometry":[{"lat":49.8514139,"lon":11.212188},{"lat":49.8513437,"lon":11.2122896},{"lat":49.8513961,"lon":11.2123793},{"lat":49.8514678,"lon":11.2122789},{"lat":49.8514139,"lon":11.212188}]},{"type":"way","id":1180,"tags":{"building":"yes"},"geometry":[{"lat":49.8533443,"lon":11.2125908},{"lat":49.8532811,"lon":11.2126183},{"lat":49.8532904,"lon":11.2126661},{"lat":49.8533104,"lon":11.2127737},{"lat":49.8533736,"lon":11.212745},{"lat":49.853352,"lon":11.2126327},{"lat":49.8533443,"lon":11.2125908}]},{"type":"way","id":1181,"tags":{"building":"yes"},"geometry":[{"lat":49.8534375,"lon":11.2125944},{"lat":49.853352,"lon":11.2126327},{"lat":49.8533736,"lon":11.212745},{"lat":49.8534583,"lon":11.2127068},{"lat":49.8534375,"lon":11.2125944}]},{"type":"way","id":1182,"tags":{"building":"yes"},"geometry":[{"lat":49.8524835,"lon":11.2140861},{"lat":49.8524165,"lon":11.2141566},{"lat":49.8524627,"lon":11.2142629},{"lat":49.8525298,"lon":11.2141936},{"lat":49.8524835,"lon":11.2140861}]},{"type":"way","id":1183,"tags":{"building":"yes"},"geometry":[{"lat":49.8496791,"lon":11.208802},{"lat":49.8495936,"lon":11.208839},{"lat":49.8496144,"lon":11.2089514},{"lat":49.8496999,"lon":11.2089143},{"lat":49.8496791,"lon":11.208802}]},{"type":"way","id":1184,"tags":{"building":"yes"},"geometry":[{"lat":49.8499234,"lon":11.2126637},{"lat":49.8498595,"lon":11.2126876},{"lat":49.849881,"lon":11.2128323},{"lat":49.8499296,"lon":11.2128143},{"lat":49.8499458,"lon":11.2128084},{"lat":49.8499234,"lon":11.2126637}]},{"type":"way","id":1185,"tags":{"building":"yes"},"geometry":[{"lat":49.8506586,"lon":11.210841},{"lat":49.850617,"lon":11.2108841},{"lat":49.8506841,"lon":11.211043},{"lat":49.8507257,"lon":11.211},{"lat":49.8506586,"lon":11.210841}]},{"type":"way","id":1186,"tags":{"building":"yes"},"geometry":[{"lat":49.8538367,"lon":11.2126279},{"lat":49.8537435,"lon":11.2126876},{"lat":49.8537666,"lon":11.2127737},{"lat":49.8538598,"lon":11.2127139},{"lat":49.8538367,"lon":11.2126279}]},{"type":"way","id":1187,"tags":{"building":"yes"},"geometry":[{"lat":49.8497207,"lon":11.2107586},{"lat":49.8496575,"lon":11.2107968},{"lat":49.8496853,"lon":11.210908},{"lat":49.8497485,"lon":11.2108709},{"lat":49.8497207,"lon":11.2107586}]},{"type":"way","id":1188,"tags":{"building":"yes"},"geometry":[{"lat":49.8484298,"lon":11.2124857},{"lat":49.8484275,"lon":11.2125765},{"lat":49.8484946,"lon":11.2125813},{"lat":49.8484969,"lon":11.2124892},{"lat":49.8484298,"lon":11.2124857}]},{"type":"way","id":1189,"tags":{"building":"yes"},"geometry":[{"lat":49.8499296,"lon":11.2128143},{"lat":49.849881,"lon":11.2128323},{"lat":49.8498957,"lon":11.2129243},{"lat":49.8499442,"lon":11.2129064},{"lat":49.8499296,"lon":11.2128143}]},{"type":"way","id":1190,"tags":{"building":"yes"},"geometry":[{"lat":49.8525351,"lon":11.2145904},{"lat":49.8524904,"lon":11.2146382},{"lat":49.8525197,"lon":11.2147064},{"lat":49.8525652,"lon":11.2146586},{"lat":49.8525351,"lon":11.2145904}]},{"type":"way","id":1191,"tags":{"building":"yes"},"geometry":[{"lat":49.8507935,"lon":11.2120303},{"lat":49.8507557,"lon":11.2120865},{"lat":49.8508112,"lon":11.2121749},{"lat":49.8508482,"lon":11.2121199},{"lat":49.8507935,"lon":11.2120303}]},{"type":"way","id":1192,"tags":{"highway":"residential"},"geometry":[{"lat":49.8511896,"lon":11.2142869},{"lat":49.8514963,"lon":11.2148904},{"lat":49.8516243,"lon":11.2150781},{"lat":49.8516643,"lon":11.215096},{"lat":49.8517052,"lon":11.2150865},{"lat":49.8517676,"lon":11.2150028}]},{"type":"way","id":1193,"tags":{"highway":"residential"},"geometry":[{"lat":49.8492437,"lon":11.2069494},{"lat":49.8495258,"lon":11.206959},{"lat":49.8498271,"lon":11.2070462},{"lat":49.8500436,"lon":11.2071454},{"lat":49.850476,"lon":11.207455},{"lat":49.8508351,"lon":11.2077167}]},{"type":"way","id":1194,"tags":{"highway":"residential"},"geometry":[{"lat":49.8503642,"lon":11.2148462},{"lat":49.8504737,"lon":11.2147243},{"lat":49.8507442,"lon":11.2145331},{"lat":49.8511272,"lon":11.2143359},{"lat":49.8511896,"lon":11.2142869},{"lat":49.8516204,"lon":11.2139474},{"lat":49.8518624,"lon":11.2136761}]},{"type":"way","id":1195,"tags":{"highway":"residential"},"geometry":[{"lat":49.8545079,"lon":11.2188394},{"lat":49.8544809,"lon":11.2186936},{"lat":49.8544547,"lon":11.2185072},{"lat":49.8544108,"lon":11.2182239},{"lat":49.8543869,"lon":11.2180291},{"lat":49.85436,"lon":11.2178199},{"lat":49.8543129,"lon":11.2174147},{"lat":49.8541943,"lon":11.2163976},{"lat":49.854081,"lon":11.2154713},{"lat":49.8537281,"lon":11.2129841}]},{"type":"way","id":1196,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8503288,"lon":11.2118175},{"lat":49.8504744,"lon":11.2120231},{"lat":49.8506602,"lon":11.2122359},{"lat":49.8508505,"lon":11.2124402},{"lat":49.8510324,"lon":11.2126554}]},{"type":"way","id":1197,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8503627,"lon":11.2153757},{"lat":49.8503642,"lon":11.2148462},{"lat":49.8503126,"lon":11.2137442},{"lat":49.8502579,"lon":11.2131406},{"lat":49.8502278,"lon":11.2126028},{"lat":49.8502702,"lon":11.2121175},{"lat":49.8503288,"lon":11.2118175}]},{"type":"way","id":1198,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8492414,"lon":11.2067319},{"lat":49.8492537,"lon":11.2061426},{"lat":49.8492784,"lon":11.2055462},{"lat":49.8492976,"lon":11.2051876},{"lat":49.8493169,"lon":11.2046211},{"lat":49.84932,"lon":11.2042422},{"lat":49.8493169,"lon":11.2037068},{"lat":49.8493053,"lon":11.2031319}]},{"type":"way","id":1199,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8503288,"lon":11.2118175},{"lat":49.8500891,"lon":11.2113789}]},{"type":"way","id":1200,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8510324,"lon":11.2126554},{"lat":49.8513044,"lon":11.2130283},{"lat":49.8518624,"lon":11.2136761},{"lat":49.8519048,"lon":11.213712},{"lat":49.8519664,"lon":11.2137203},{"lat":49.8520204,"lon":11.2137036},{"lat":49.852092,"lon":11.2136641},{"lat":49.8522045,"lon":11.213559},{"lat":49.8523317,"lon":11.2134526},{"lat":49.8524311,"lon":11.2133618},{"lat":49.8525405,"lon":11.2133139},{"lat":49.8527139,"lon":11.2132661},{"lat":49.8528835,"lon":11.2132351},{"lat":49.853157,"lon":11.2131932},{"lat":49.8534776,"lon":11.2130952},{"lat":49.8537281,"lon":11.2129841},{"lat":49.8541334,"lon":11.2127582},{"lat":49.8544224,"lon":11.2125801}]},{"type":"way","id":1201,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8500891,"lon":11.2113789},{"lat":49.8499943,"lon":11.2111375},{"lat":49.8498949,"lon":11.2108625},{"lat":49.849377,"lon":11.2088928},{"lat":49.8493423,"lon":11.2086622},{"lat":49.8493023,"lon":11.2083012},{"lat":49.8492691,"lon":11.207755},{"lat":49.8492437,"lon":11.2069494},{"lat":49.8492414,"lon":11.2067319}]},{"type":"way","id":1202,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8503681,"lon":11.2155789},{"lat":49.8503627,"lon":11.2153757}]},{"type":"way","id":1203,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8506193,"lon":11.2260275},{"lat":49.850617,"lon":11.2258183},{"lat":49.8506093,"lon":11.2255363},{"lat":49.8505939,"lon":11.2251323},{"lat":49.85057,"lon":11.224206},{"lat":49.8505592,"lon":11.2235139},{"lat":49.8505461,"lon":11.2228291},{"lat":49.8505346,"lon":11.2223056},{"lat":49.8505114,"lon":11.2213996},{"lat":49.8504914,"lon":11.2204398},{"lat":49.8504783,"lon":11.2197263},{"lat":49.8504691,"lon":11.2193857},{"lat":49.8504575,"lon":11.2189386},{"lat":49.8504459,"lon":11.2183733},{"lat":49.8504321,"lon":11.2177817},{"lat":49.8504267,"lon":11.2175988},{"lat":49.8503681,"lon":11.2155789}]},{"type":"way","id":1204,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8544224,"lon":11.2125801},{"lat":49.855025,"lon":11.2122622},{"lat":49.8553178,"lon":11.2121104},{"lat":49.855895,"lon":11.2118558},{"lat":49.8559766,"lon":11.2118223},{"lat":49.8560799,"lon":11.2117841},{"lat":49.8562887,"lon":11.2116992},{"lat":49.8565083,"lon":11.2116024},{"lat":49.8566879,"lon":11.2115127},{"lat":49.8569892,"lon":11.2113896},{"lat":49.8572427,"lon":11.2112892},{"lat":49.8573922,"lon":11.2112355},{"lat":49.8575386,"lon":11.2111853},{"lat":49.8577404,"lon":11.211104},{"lat":49.8578083,"lon":11.2110801},{"lat":49.8579624,"lon":11.2110227},{"lat":49.8581766,"lon":11.2109462},{"lat":49.8583754,"lon":11.2108841},{"lat":49.8584948,"lon":11.2108422}]},{"type":"way","id":1205,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8489023,"lon":11.2120231},{"lat":49.848611,"lon":11.2122442}]},{"type":"way","id":1206,"tags":{"highway":"secondary"},"geometry":[{"lat":49.848611,"lon":11.2122442},{"lat":49.848046,"lon":11.212641},{"lat":49.847804,"lon":11.2127869},{"lat":49.8475104,"lon":11.212941},{"lat":49.8472699,"lon":11.2130486},{"lat":49.8460476,"lon":11.2135422},{"lat":49.8453431,"lon":11.2138865},{"lat":49.8450711,"lon":11.2140251}]},{"type":"way","id":1207,"tags":{"highway":"secondary"},"geometry":[{"lat":49.8500891,"lon":11.2113789},{"lat":49.8499134,"lon":11.2114757},{"lat":49.8497153,"lon":11.2115283},{"lat":49.8495997,"lon":11.2115761},{"lat":49.8495103,"lon":11.2116418},{"lat":49.8493832,"lon":11.2117076},{"lat":49.8489023,"lon":11.2120231}]}]}};
function loadDemo(){const b=DEMO.b;lastB=b;window._place={name:'Siegritz',region:'Fränkische Schweiz'};
  loadData(buildData(DEMO.osm,b,b,{name:'Siegritz',region:'Fränkische Schweiz',center:[(b.w+b.e)/2,(b.n+b.s)/2]}));
  msg('Beispiel Siegritz geladen – probier Stile, Farben und Text aus','ok')}
$('demoBtn').onclick=loadDemo;
</script>
