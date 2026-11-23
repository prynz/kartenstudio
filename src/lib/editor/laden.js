// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ausschnitt laden (mit Ladeanzeige), Daten in den Editor übernehmen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { ladeSchriften } from './basis.js';
import { app } from './app.js';
import { revealEditor } from './animation.js';
import { wizardAfterLoad } from './assistent.js';
import { popColor, popDefs, popSymbols } from '../themen/pop.js';
import { $, CLS, MW, ORDER } from './basis.js';
import { FMAP, alsBild, drawSel, render } from './zeichnen.js';
import { PRESETS } from '../themen/vorlagen.js';
import { buildData, buildDataTiles } from '../karte/daten.js';
import { closePicker, frameBounds, meters } from '../karte/ortswahl.js';
import { defView, newState, updUndo } from './zustand.js';
import { expand, fetchOSM } from '../karte/overpass.js';
import { fetchTiles } from '../karte/kacheln.js';
import { panel } from './seitenleiste.js';
import { msg } from './ansicht.js';
import { saveDraftSoon } from './entwurf.js';

export const LOADMSG = ['Wir rollen die Landkarte aus …', 'Häuser werden gezählt – bitte nicht wackeln …', 'Der Kartograf spitzt seinen Bleistift …', 'Straßen werden glatt gebügelt …', 'Kurze Kaffeepause für die Maschine – mit Milch, ohne Zucker.', 'Feldwege werden nachgemessen …', 'Noch ein Schluck Kaffee … und weiter geht’s.', 'Die Dächer werden einzeln aufgesetzt …', 'Fast geschafft – wir polieren noch die Ecken …'];
export const LOADSUB = ['Daten kommen frisch aus OpenStreetMap', 'Wir laden etwas mehr Umgebung mit – zum Feinjustieren', 'Die öffentlichen Kartenserver haben gerade viel zu tun – wir bleiben dran', 'Dauert heute etwas länger – der Kaffee ist schon nachgefüllt'];
export function startLoader() {
  const L = $('loader');
  L.style.display = 'block';
  $('loadBar').style.transition = 'none';
  $('loadBar').style.width = '0';
  void $('loadBar').offsetWidth;
  $('loadBar').style.transition = 'width .6s ease';
  app.ldStart = Date.now();
  let i = 0;
  $('loadText').textContent = LOADMSG[0];
  $('loadSub').textContent = LOADSUB[0];
  $('loadText').style.opacity = 1;
  let n = 0;
  clearInterval(app.ldT);
  app.ldT = setInterval(() => {
    n++;
    const t = (Date.now() - app.ldStart) / 1000;
    $('loadBar').style.width = (92 * (1 - Math.exp(-t / 9))).toFixed(1) + '%';
    if (n % 28 === 0) {
      i = (i + 1) % LOADMSG.length;
      const el = $('loadText');
      el.style.opacity = 0;
      setTimeout(() => {
        el.textContent = LOADMSG[i];
        el.style.opacity = 1;
      }, 300);
      $('loadSub').textContent = t > 45 ? LOADSUB[3] : t > 18 ? LOADSUB[2] : t > 6 ? LOADSUB[1] : LOADSUB[0];
    }
  }, 100);
}
export function stopLoader(ok) {
  clearInterval(app.ldT);
  if (ok) {
    $('loadBar').style.width = '100%';
    $('loadText').textContent = 'Fertig – viel Spaß beim Gestalten!';
    setTimeout(() => {
      $('loader').style.display = 'none';
    }, 450);
  } else $('loader').style.display = 'none';
}
export function setGen(t, c) {
  const m = $('pStatus');
  m.textContent = t;
  m.className = c || '';
}
export function boundsChanged() {
  if (!app.map || !app.lastB) return !!app.map;
  const b = frameBounds();
  const tol = (app.lastB.e - app.lastB.w) * 0.01;
  return ['w', 'e', 'n', 's'].some(k => Math.abs(b[k] - app.lastB[k]) > tol);
}
export async function generate() {
  if (app.genBusy) return false;
  if (!app.map) {
    setGen('Die Vorschaukarte ist nicht geladen.', 'err');
    return false;
  }
  const c = app.map.getCenter();
  // Große Gebiete (Inseln, Seen, Regionen) gehen bis 40 km – dann mit gröberer Kartenstufe
  return loadBounds(frameBounds(), { center: [c.lng, c.lat], maxW: 40000 });
}

/**
 * Kartendaten aus Vektorkacheln holen (mit Rand zum Nachjustieren) – oder null.
 * Wird auch für zusätzliche Orte (mehrere Orte auf einem Poster) genutzt.
 */
export async function tileData(b, place) {
  const mw = meters(b).w;
  try {
    const big = expand(b, mw < 1500 ? 0.5 : mw < 3000 ? 0.35 : 0.2);
    const tiles = await fetchTiles(big);
    const data = buildDataTiles(tiles, b, big, place);
    return data.feats.length ? data : null;
  } catch (e) {
    console.warn('Kacheln fehlgeschlagen', e);
    return null;
  }
}

/** Fehlermeldung dort zeigen, wo der Nutzer gerade ist (Kartenfenster oder Editor). */
function loadErr(t) {
  if (!$('picker').classList.contains('hidden')) setGen(t, 'err');
  else msg(t, 'err');
}

/**
 * Kartendaten für einen Bereich laden und in den Editor übernehmen.
 * Wird vom Kartenfenster („Ausschnitt übernehmen“) und direkt aus der Suche genutzt.
 * @param {{w:number,e:number,n:number,s:number}} b sichtbarer Ausschnitt
 * @param {{center?:number[], keepLoader?:boolean, maxW?:number}} [opt]
 */
export async function loadBounds(b, opt = {}) {
  if (app.genBusy) return false;
  const m = meters(b);
  const maxW = opt.maxW || 6000;
  if (!(m.w > 50) || m.w > maxW) {
    loadErr(`Der Ausschnitt ist zu groß (über ${Math.round(maxW / 1000)} km breit). Bitte näher heranzoomen.`);
    return false;
  }
  // Ladeanzeige dort einblenden, wo man gerade ist
  const L = $('loader');
  const host = $('picker').classList.contains('hidden') ? document.querySelector('.stage') : $('mapwrap');
  if (L.parentElement !== host) host.appendChild(L);
  app.genBusy = true;
  $('gen').disabled = true;
  setGen('');
  let ldTimer = setTimeout(startLoader, 350);
  try {
    let data = null;
    const pl0 = window._place || { name: '', region: '' };
    const place0 = {
      name: pl0.name || 'Mein Ort',
      region: pl0.region || '',
      center: opt.center || [(b.w + b.e) / 2, (b.n + b.s) / 2]
    };
    data = await tileData(b, place0);
    if (!data) {
      if (!L.style.display || L.style.display === 'none') {
        clearTimeout(ldTimer);
        startLoader();
      }
      if (m.w > 6000) throw new Error('Für so große Gebiete sind keine Kartendaten verfügbar');
      const res = await fetchOSM(b);
      data = buildData(res.osm, b, res.bb, place0);
    }
    clearTimeout(ldTimer);
    if (!data.feats.length) throw new Error('In diesem Ausschnitt wurden keine Kartenelemente gefunden');
    const wasShown = L.style.display === 'block';
    stopLoader(true);
    if (wasShown) await new Promise(r => setTimeout(r, 350));
    app.lastB = b;
    app.isDemo = false;
    closePicker();
    loadData(data);
    setGen('');
    app.genBusy = false;
    $('gen').disabled = false;
    return true;
  } catch (e) {
    clearTimeout(ldTimer);
    stopLoader(false);
    loadErr('Das hat leider nicht geklappt: ' + (e && e.message || 'Fehler') + '. Die Kartenserver sind gerade überlastet – bitte gleich noch einmal versuchen.');
  }
  app.genBusy = false;
  $('gen').disabled = false;
  return false;
}
export function loadData(data) {
  const prev = app.DATA,
    prevS = app.S;
  app.DATA = data;
  FMAP.clear();
  if (prevS) {
    app.S = JSON.parse(JSON.stringify(prevS));
    const ids = new Set(app.DATA.feats.map(f => f.id));
    Object.keys(app.S.ov).forEach(id => {
      if (!ids.has(id)) delete app.S.ov[id];
    });
    if (prev && app.S.title.text === String(prev.place || '').toUpperCase()) app.S.title.text = String(app.DATA.place).toUpperCase();
    if (prev && app.S.sub.text === prev.region && app.DATA.region) app.S.sub.text = app.DATA.region;
    app.S.view = defView();
    app.undoS = [];
    app.redoS = [];
  } else {
    app.S = newState('umriss');
    app.undoS = [];
    app.redoS = [];
  }
  app.sel.clear();
  app.selCls = null;
  const btns = $('grpbtns');
  btns.innerHTML = '';
  Object.keys(CLS).forEach(k => {
    const n = new Set(app.DATA.feats.filter(f => f.k === k).map(f => f.id)).size;
    if (!n) return;
    const b = document.createElement('button');
    b.className = 'chip';
    b.dataset.k = k;
    b.innerHTML = `${CLS[k]} <span style="color:var(--soft)">${n}</span>`;
    b.onclick = () => {
      app.sel.clear();
      app.selCls = k;
      drawSel();
      panel();
    };
    btns.appendChild(b);
  });
  revealEditor();
  // Editor offen → Schriftdaten für Vorschaubilder/Export jetzt holen (falls noch nicht da)
  ladeSchriften();
  $('side').classList.remove('nodata');
  $('hdrEdit').classList.remove('hidden');
  $('hdrOrt').textContent = app.DATA.place || 'Mein Ort';
  $('placeName').textContent = app.DATA.place || 'Mein Ort';
  $('placeInfo').textContent = [app.DATA.region, `${new Set(app.DATA.feats.map(f => f.id)).size} Kartenelemente`].filter(Boolean).join(' · ');
  updUndo();
  render();
  renderThumbs();
  wizardAfterLoad();
  saveDraftSoon();
}
/** Umrisse für die Vorschaubilder einmal vorbereiten (gilt für alle Stile desselben Orts) */
let PFADE = { D: null, r: '', liste: null };
function vorbereitet(D, r, klein) {
  const k = r.join();
  if (PFADE.D === D && PFADE.r === k) return PFADE.liste;
  const liste = {};
  ORDER.forEach(c => (liste[c] = { flaechen: [], linien: [] }));
  D.feats.forEach(f => {
    const bx = f.bx;
    if (!liste[f.k]) return;
    if (bx[2] < r[0] || bx[0] > r[2] || bx[3] < r[1] || bx[1] > r[3]) return;
    if (Math.max(bx[2] - bx[0], bx[3] - bx[1]) < klein) return;
    (f.a ? liste[f.k].flaechen : liste[f.k].linien).push(new Path2D(f.d));
  });
  PFADE = { D, r: k, liste };
  return liste;
}
/** Ein Stil-Vorschaubild direkt auf eine Leinwand malen → Blob-URL */
async function leinwandBild(p, D, vb, r, klein) {
  const liste = vorbereitet(D, r, klein);
  const N = 200;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  x.fillStyle = p.bg !== 'none' ? p.bg : '#ffffff';
  x.fillRect(0, 0, N, N);
  x.setTransform(N / vb[2], 0, 0, N / vb[3], -vb[0] * N / vb[2], -vb[1] * N / vb[3]);
  x.lineCap = 'round';
  x.lineJoin = 'round';
  ORDER.forEach(k => {
    const cl = p.cls[k];
    if (!cl || cl.h) return;
    const L = liste[k];
    const strich = cl.s && cl.s !== 'none';
    x.lineWidth = cl.w * 1.6;
    if (strich) x.strokeStyle = cl.s;
    const fuellen = cl.f && cl.f !== 'none';
    if (fuellen) x.fillStyle = cl.f;
    L.flaechen.forEach(pf => {
      if (fuellen) x.fill(pf, 'evenodd');
      if (strich) x.stroke(pf);
    });
    if (strich) L.linien.forEach(pf => x.stroke(pf));
  });
  const b = await new Promise(res => c.toBlob(res, 'image/png'));
  return URL.createObjectURL(b);
}

/* ---------- Vorschaubilder der Farbstile ----------
   Früher: je Stil eine Mini-Karte mit ALLEN Häusern als SVG direkt in der Seite (×2: Assistent und
   erweiterte Einstellungen). Bei Städten hunderttausende Elemente → alles wurde zäh.
   Jetzt: nur der sichtbare Ausschnitt, ohne Winzigteile, einmal in ein kleines Bild umgerechnet,
   nacheinander in ruhigen Momenten (beliebteste zuerst). */
let stilLauf = 0;
/** @type {string[]} */
let stilUrls = [];
export function renderThumbs() {
  if (!app.DATA) return;
  const lauf = ++stilLauf;
  const v = defView(),
    MH = MW * v.a;
  const vb = [MW * 0.18, MH * 0.18, MW * 0.64, MW * 0.64];
  const r = [vb[0], vb[1], vb[0] + vb[2], vb[1] + vb[3]];
  const klein = vb[2] / 160; // kleiner als ein Bildpunkt im Vorschaubild
  const knoepfe = [...document.querySelectorAll('#wzStyles button[data-p], #styles button[data-p]')];
  const reihe = [...new Set(knoepfe.map(b => b.dataset.p))];
  const alt = stilUrls;
  stilUrls = [];
  const D = app.DATA;
  let i = 0;
  const naechstes = async () => {
    if (lauf !== stilLauf || app.DATA !== D) return;
    if (i >= reihe.length) {
      alt.forEach(u => URL.revokeObjectURL(u));
      return;
    }
    const key = reihe[i++];
    const p = PRESETS[key];
    // Ohne Pop-Art-Symbole: direkt auf eine Leinwand malen (viel schneller als SVG → Bild)
    if (!p.pop) {
      try {
        const url = await leinwandBild(p, D, vb, r, klein);
        if (lauf !== stilLauf) return URL.revokeObjectURL(url);
        stilUrls.push(url);
        setzen(key, url);
      } catch (e) {}
      return weiter();
    }
    let o = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice">`;
    o += `<rect x="-2000" y="-2000" width="6000" height="6000" fill="${p.bg !== 'none' ? p.bg : '#ffffff'}"/>`;
    if (p.pop) o += `<defs>${popDefs()}</defs>` + popSymbols(D, { view: { z: 1.4 }, scale: 1, cls: p.cls }, r, p.pop.pal);
    ORDER.forEach(k => {
      const c = p.cls[k];
      if (c.h) return;
      let pfade = '';
      D.feats.forEach(f => {
        if (f.k !== k) return;
        const bx = f.bx;
        if (bx[2] < r[0] || bx[0] > r[2] || bx[3] < r[1] || bx[1] > r[3]) return;
        if (Math.max(bx[2] - bx[0], bx[3] - bx[1]) < klein) return;
        const fl = p.pop && k === 'haus' ? popColor(f.id, p.pop.pal) : f.a ? c.f : 'none';
        pfade += `<path d="${f.d}" fill="${fl}"/>`;
      });
      if (pfade) o += `<g stroke="${c.s}" stroke-width="${c.w * 1.6}" stroke-linecap="round" stroke-linejoin="round" fill-rule="evenodd">${pfade}</g>`;
    });
    o += '</svg>';
    try {
      const url = await alsBild(o, 200);
      if (lauf !== stilLauf) return URL.revokeObjectURL(url);
      stilUrls.push(url);
      setzen(key, url);
    } catch (e) {}
    weiter();
  };
  const setzen = (key, url) => knoepfe.forEach(b => {
    if (b.dataset.p !== key) return;
    const th = b.querySelector('.th');
    if (th) th.innerHTML = `<img src="${url}" alt="">`;
  });
  const weiter = () => {
    const w = window;
    if (w.requestIdleCallback) w.requestIdleCallback(naechstes, { timeout: 300 });
    else setTimeout(naechstes, 20);
  };
  // Alte Bilder (anderer Ort) sofort weg, damit kein falscher Ort zu sehen ist
  knoepfe.forEach(b => {
    const th = b.querySelector('.th');
    if (th) th.innerHTML = '';
  });
  naechstes();
}

/* ---------- Poster-Geometrie & SVG ---------- */

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorLaden() {
  $('gen').onclick = generate;
}

