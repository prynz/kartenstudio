// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ausschnitt laden (mit Ladeanzeige), Daten in den Editor übernehmen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { revealEditor } from './animation.js';
import { wizardAfterLoad } from './assistent.js';
import { $, CLS, MW, ORDER } from './basis.js';
import { FMAP, drawSel, render } from './zeichnen.js';
import { PRESETS } from '../themen/vorlagen.js';
import { buildData, buildDataTiles } from '../karte/daten.js';
import { closePicker, frameBounds, meters } from '../karte/ortswahl.js';
import { defView, newState, updUndo } from './zustand.js';
import { expand, fetchOSM } from '../karte/overpass.js';
import { fetchTiles } from '../karte/kacheln.js';
import { panel } from './seitenleiste.js';

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
  const b = frameBounds();
  const m = meters(b);
  if (m.w > 6000) {
    setGen('Der Ausschnitt ist zu groß (über 6 km breit). Bitte näher heranzoomen.', 'err');
    return false;
  }
  app.genBusy = true;
  $('gen').disabled = true;
  setGen('');
  let ldTimer = setTimeout(startLoader, 350);
  const cached = false;
  try {
    let data = null;
    const c0 = app.map.getCenter();
    const pl0 = window._place || {
      name: '',
      region: ''
    };
    const place0 = {
      name: pl0.name || 'Mein Ort',
      region: pl0.region || '',
      center: [c0.lng, c0.lat]
    };
    try {
      const mw = meters(b).w;
      const big = expand(b, mw < 1500 ? 0.5 : mw < 3000 ? 0.35 : 0.2);
      const tiles = await fetchTiles(big);
      data = buildDataTiles(tiles, b, big, place0);
      if (!data.feats.length) data = null;
    } catch (e) {
      console.warn('Kacheln fehlgeschlagen, nutze Overpass', e);
      data = null;
    }
    if (!data) {
      if (!$('loader').style.display || $('loader').style.display === 'none') {
        clearTimeout(ldTimer);
        startLoader();
      }
      const res = await fetchOSM(b);
      const c = app.map.getCenter();
      const pl = window._place || {
        name: '',
        region: ''
      };
      const place = {
        name: pl.name || 'Mein Ort',
        region: pl.region || '',
        center: [c.lng, c.lat]
      };
      data = buildData(res.osm, b, res.bb, place);
    }
    clearTimeout(ldTimer);
    if (!data.feats.length) throw new Error('In diesem Ausschnitt wurden keine Kartenelemente gefunden');
    const wasShown = $('loader').style.display === 'block';
    stopLoader(true);
    if (wasShown) await new Promise(r => setTimeout(r, 350));
    app.lastB = b;
    closePicker();
    loadData(data);
    setGen('');
    app.genBusy = false;
    $('gen').disabled = false;
    return true;
  } catch (e) {
    clearTimeout(ldTimer);
    stopLoader(false);
    setGen('Das hat leider nicht geklappt: ' + (e && e.message || 'Fehler') + '. Die Kartenserver sind gerade überlastet – bitte gleich noch einmal auf „Ausschnitt übernehmen“ klicken.', 'err');
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
  $('side').classList.remove('nodata');
  $('hdrEdit').classList.remove('hidden');
  $('placeName').textContent = app.DATA.place || 'Mein Ort';
  $('placeInfo').textContent = [app.DATA.region, `${new Set(app.DATA.feats.map(f => f.id)).size} Kartenelemente`].filter(Boolean).join(' · ');
  updUndo();
  render();
  renderThumbs();
  wizardAfterLoad();
}
export function renderThumbs() {
  if (!app.DATA) return;
  const v = defView(),
    MH = MW * v.a;
  document.querySelectorAll('#styles button[data-p], #wzStyles button[data-p]').forEach(b => {
    const p = PRESETS[b.dataset.p];
    let o = `<svg viewBox="${MW * 0.18} ${MH * 0.18} ${MW * 0.64} ${MW * 0.64}" preserveAspectRatio="xMidYMid slice">`;
    o += `<rect x="-2000" y="-2000" width="6000" height="6000" fill="${p.bg !== 'none' ? p.bg : '#ffffff'}"/>`;
    ORDER.forEach(k => {
      const c = p.cls[k];
      if (c.h) return;
      app.DATA.feats.forEach(f => {
        if (f.k !== k) return;
        const bx = f.bx;
        if (bx[2] < 0 || bx[0] > MW || bx[3] < 0 || bx[1] > MH) return;
        o += `<path d="${f.d}" fill="${f.a ? c.f : 'none'}" stroke="${c.s}" stroke-width="${c.w * 1.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
      });
    });
    o += `<rect x="-2000" y="-2000" width="6000" height="6000" fill="none"/>`;
    b.querySelector('.th').innerHTML = o + '</svg>';
  });
}

/* ---------- Poster-Geometrie & SVG ---------- */

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorLaden() {
  $('gen').onclick = generate;
}

