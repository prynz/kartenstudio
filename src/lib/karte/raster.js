// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Standard-Stile als hochaufgelöstes Bild rendern
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { loadMaplibre } from './ortswahl.js';
import { KONFIG } from '../konfig.js';
import { app } from '../editor/app.js';
import { BASES } from '../themen/standard.js';
import { MW } from '../editor/basis.js';
import { msg } from '../editor/ansicht.js';
import { render } from '../editor/zeichnen.js';
import { visRect } from '../editor/zustand.js';

export const RASTER = new Map();
export function rasterKey() {
  return app.S.base + '|' + (app.S.labels ? 1 : 0) + '|' + (app.DATA ? app.DATA.ext.x0.toFixed(1) + app.DATA.proj.x0 : '');
}
export function mercInv(x, y) {
  return [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI];
}
/** Stil-JSON laden und für Beschriftung/Satellit anpassen */
async function styleFor(B, labels) {
  const r = await fetch(B.style);
  if (!r.ok) throw new Error('Stil HTTP ' + r.status);
  const st = await r.json();
  st.layers.forEach(l => {
    if (l.type === 'symbol') {
      l.layout = l.layout || {};
      l.layout.visibility = labels ? 'visible' : 'none';
    } else if (B.sat && l.type !== 'background') {
      l.layout = l.layout || {};
      l.layout.visibility = 'none';
    }
  });
  if (B.sat) {
    st.sources.sat = {
      type: 'raster',
      // Amtliches Luftbild Bayern (WMS, 40 cm), Datenquelle: Bayerische Vermessungsverwaltung, CC BY 4.0
      tiles: [KONFIG.luftbildBayern],
      tileSize: 256,
      maxzoom: 20
    };
    const bi = st.layers.findIndex(l => l.type === 'background');
    st.layers.splice(bi + 1, 0, { id: 'sat', type: 'raster', source: 'sat' });
    if (labels) st.layers.forEach(l => {
      if (l.type === 'symbol' && l.paint) {
        l.paint['text-color'] = '#ffffff';
        l.paint['text-halo-color'] = 'rgba(0,0,0,.75)';
        l.paint['text-halo-width'] = 1.4;
      }
    });
  }
  return st;
}

/**
 * Bereich `rect` (Poster-Koordinaten) mit einer unsichtbaren MapLibre-Karte als Bild zeichnen.
 * @returns {Promise<{url:string, rect:number[], pxPerUnit:number}>}
 */
async function drawRect(maplibregl, rect, cssW) {
  const P = app.DATA.proj,
    B = BASES[app.S.base];
  const mw = (rect[2] - rect[0]) / P.sc,
    mh = (rect[3] - rect[1]) / P.sc;
  cssW = Math.round(cssW);
  const cssH = Math.round(cssW * mh / mw);
  const pr = Math.max(1, Math.min(2.5, 4096 / Math.max(cssW, cssH)));
  const zoom = Math.log2(cssW / (mw * 512));
  const c = mercInv(P.x0 + (rect[0] + rect[2]) / 2 / P.sc, P.y0 + (rect[1] + rect[3]) / 2 / P.sc);
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-20000px;top:0;width:${cssW}px;height:${cssH}px;pointer-events:none`;
  document.body.appendChild(div);
  let m = null;
  try {
    const st = await styleFor(B, app.S.labels);
    m = new maplibregl.Map({ container: div, style: st, center: c, zoom, interactive: false, attributionControl: false, canvasContextAttributes: { preserveDrawingBuffer: true }, pixelRatio: pr, fadeDuration: 0 });
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('Zeitüberschreitung')), 60000);
      m.once('idle', () => {
        clearTimeout(to);
        res();
      });
    });
    const url = m.getCanvas().toDataURL('image/jpeg', 0.9);
    return { url, rect, pxPerUnit: cssW * pr / (rect[2] - rect[0]) };
  } finally {
    try {
      m && m.remove();
    } catch (e) {}
    div.remove();
  }
}

export async function ensureRaster() {
  if (!app.S || app.S.mode !== 'std' || !app.DATA) return;
  const k = rasterKey();
  if (RASTER.has(k)) {
    render();
    scheduleDetail();
    return;
  }
  if (app.rasterJob === k) return;
  app.rasterJob = k;
  let maplibregl = null;
  try {
    maplibregl = await loadMaplibre();
  } catch (e) {}
  if (!maplibregl) {
    app.rasterJob = null;
    msg('Standard-Stile brauchen eine Internetverbindung – hier sind nur die künstlerischen Stile verfügbar.', 'err');
    return;
  }
  msg('Karte wird gezeichnet …', 'busy');
  const E = app.DATA.ext;
  try {
    RASTER.set(k, await drawRect(maplibregl, [E.x0, E.y0, E.x1, E.y1], Math.min(2600, 1150 * (E.x1 - E.x0) / MW)));
    msg('Karte fertig', 'ok');
  } catch (e) {
    console.warn(e);
    msg('Die Karte konnte nicht gezeichnet werden (' + (e.message || e) + '). Bitte erneut versuchen.', 'err');
  } finally {
    if (app.rasterJob === k) app.rasterJob = null;
  }
  if (app.S.mode === 'std') {
    render();
    scheduleDetail();
  }
}

/* ---------- Scharf nachzeichnen beim Hineinzoomen ----------
   Das Grundbild deckt den ganzen geladenen Bereich ab. Wird hineingezoomt, zeichnen wir
   kurz nach dem Loslassen nur den sichtbaren Teil (plus Rand) in voller Auflösung neu. */
let DETAIL = null;
let detailTimer = 0;
let detailBusy = '';
/** Passendes Detailbild für die aktuelle Ansicht (oder null) */
export function detailRaster() {
  if (!DETAIL || !app.S || DETAIL.key !== rasterKey()) return null;
  const v = visRect(),
    r = DETAIL.rect;
  if (v[0] < r[0] || v[1] < r[1] || v[2] > r[2] || v[3] > r[3]) return null;
  return DETAIL;
}
/** Wie viele Bildpunkte je Poster-Einheit für eine scharfe Vorschau/Export gebraucht werden */
function needPx() {
  return 2.6 * app.S.view.z;
}
export function scheduleDetail() {
  clearTimeout(detailTimer);
  detailTimer = window.setTimeout(makeDetail, 450);
}
async function makeDetail() {
  if (!app.S || app.S.mode !== 'std' || !app.DATA) return;
  const base = RASTER.get(rasterKey());
  if (!base) return;
  const want = needPx();
  const have = detailRaster();
  if (base.pxPerUnit >= want * 0.8 || (have && have.pxPerUnit >= want * 0.8)) return;
  const v = visRect(),
    E = app.DATA.ext,
    w = v[2] - v[0],
    h = v[3] - v[1];
  const rect = [Math.max(E.x0, v[0] - w * 0.25), Math.max(E.y0, v[1] - h * 0.25), Math.min(E.x1, v[2] + w * 0.25), Math.min(E.y1, v[3] + h * 0.25)];
  const key = rasterKey() + '|' + rect.map(x => x.toFixed(0)).join(',');
  if (detailBusy === key) return;
  detailBusy = key;
  try {
    const maplibregl = await loadMaplibre();
    // CSS-Breite so wählen, dass ≈ want Bildpunkte je Einheit entstehen (pixelRatio bis 2,5)
    const cssW = Math.min(2600, want * (rect[2] - rect[0]) / 2);
    const d = await drawRect(maplibregl, rect, cssW);
    DETAIL = { ...d, key: rasterKey() };
    if (app.S.mode === 'std') render();
  } catch (e) {
    console.warn('Detailbild', e);
  } finally {
    if (detailBusy === key) detailBusy = '';
  }
}

/* ---------- Echte 3D-Ansicht (Landkarten-Stile) ----------
   MapLibre zeichnet die Karte mit gekippter Kamera, Drehung, 3D-Gebäuden und Gelände.
   Ergebnis: ein Bild genau für die Kartenfläche des Posters. */
export const KAMERA = new Map();
/** 3D-Ansicht aktiv? (nur bei Landkarten-Stilen) */
export function std3d() {
  const S = app.S;
  if (!S || S.mode !== 'std' || !S.fx) return false;
  if (S.motif && S.motif !== 'karte') return false;
  return +S.fx.kipp > 0 || !!S.fx.h3d || !!S.fx.relief || !!S.fx.gelaende || !!+S.fx.dreh;
}
export function kameraKey() {
  const S = app.S, v = S.view, f = S.fx || {};
  return [rasterKey(), v.cx.toFixed(1), v.cy.toFixed(1), v.z.toFixed(3), v.a, +f.kipp || 0, +f.dreh || 0, !!f.h3d, !!f.relief, !!f.gelaende, JSON.stringify(S.pins || []), S.route ? S.route.pts.length : 0].join('|');
}
export function kameraBild() {
  return std3d() ? KAMERA.get(kameraKey()) || null : null;
}
let kamTimer = 0;
let kamJob = '';
export function scheduleKamera(delay = 450) {
  clearTimeout(kamTimer);
  kamTimer = window.setTimeout(makeKamera, delay);
}
/** Stil um 3D-Gebäude, Gelände und Relief ergänzen */
function stil3d(st, f) {
  const vec = Object.keys(st.sources).find(k => st.sources[k].type === 'vector');
  if (f.gelaende || f.relief) {
    const dem = { type: 'raster-dem', tiles: [KONFIG.terrain], encoding: 'terrarium', tileSize: 256, maxzoom: 14 };
    st.sources.ksDem = dem;
    st.sources.ksDem2 = { ...dem };
  }
  if (f.gelaende) st.terrain = { source: 'ksDem', exaggeration: 1.6 };
  if (f.relief) {
    const i = st.layers.findIndex(l => l['source-layer'] === 'building' || l.type === 'line');
    st.layers.splice(i < 0 ? st.layers.length : i, 0, { id: 'ks-relief', type: 'hillshade', source: 'ksDem2', paint: { 'hillshade-exaggeration': 0.45, 'hillshade-shadow-color': 'rgba(40,40,50,.55)', 'hillshade-highlight-color': 'rgba(255,255,255,.35)' } });
  }
  if (f.h3d && vec) {
    const fl = st.layers.find(l => l['source-layer'] === 'building' && l.type === 'fill');
    let col = fl && fl.paint && fl.paint['fill-color'];
    if (typeof col !== 'string') col = BASES[app.S.base].sat ? '#e8e2d8' : '#d9d2c8';
    st.layers = st.layers.filter(l => !(l['source-layer'] === 'building' && l.type === 'fill-extrusion'));
    const sym = st.layers.findIndex(l => l.type === 'symbol');
    st.layers.splice(sym < 0 ? st.layers.length : sym, 0, {
      id: 'ks-3d', type: 'fill-extrusion', source: vec, 'source-layer': 'building', minzoom: 12,
      paint: { 'fill-extrusion-color': col, 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.95, 'fill-extrusion-vertical-gradient': true }
    });
  }
  return st;
}
async function makeKamera() {
  if (!std3d() || !app.DATA) return;
  const key = kameraKey();
  if (KAMERA.has(key) || kamJob === key) return;
  kamJob = key;
  let maplibregl = null;
  try {
    maplibregl = await loadMaplibre();
  } catch (e) {}
  if (!maplibregl) {
    kamJob = '';
    return;
  }
  const S = app.S, v = S.view, P = app.DATA.proj, f = S.fx || {};
  const MH = MW * v.a;
  const cssW = 1300, cssH = Math.round(cssW * MH / MW);
  const pr = Math.min(2.4, 4096 / Math.max(cssW, cssH));
  const mw = MW / v.z / P.sc;
  const zoom = Math.log2(cssW / (mw * 512));
  const c = mercInv(P.x0 + v.cx / P.sc, P.y0 + v.cy / P.sc);
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-20000px;top:0;width:${cssW}px;height:${cssH}px;pointer-events:none`;
  document.body.appendChild(div);
  let m = null;
  msg('3D-Ansicht wird gezeichnet …', 'busy');
  try {
    const st = stil3d(await styleFor(BASES[S.base], S.labels), f);
    m = new maplibregl.Map({ container: div, style: st, center: c, zoom, pitch: Math.min(70, +f.kipp || 0), bearing: +f.dreh || 0, maxPitch: 85, interactive: false, attributionControl: false, canvasContextAttributes: { preserveDrawingBuffer: true }, pixelRatio: pr, fadeDuration: 0 });
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('Zeitüberschreitung')), 60000);
      m.once('idle', () => {
        clearTimeout(to);
        res();
      });
    });
    // Markierungen und Route an die richtige Stelle im Bild setzen
    const k = MW / cssW;
    const punkt = (x, y) => {
      const q = m.project(mercInv(P.x0 + x / P.sc, P.y0 + y / P.sc));
      return [q.x * k, q.y * k];
    };
    const pins = (S.pins || []).map(p => punkt(+p.x, +p.y));
    let route = null;
    if (S.route && S.route.pts) route = S.route.pts.map(q => {
      const r = m.project(q);
      return [r.x * k, r.y * k];
    });
    KAMERA.set(key, { url: m.getCanvas().toDataURL('image/jpeg', 0.92), pins, route, pxPerUnit: cssW * pr / (MW / v.z) });
    if (KAMERA.size > 6) KAMERA.delete(KAMERA.keys().next().value);
    msg('3D-Ansicht fertig', 'ok');
  } catch (e) {
    console.warn('3D-Ansicht', e);
    msg('Die 3D-Ansicht konnte nicht gezeichnet werden. Bitte erneut versuchen.', 'err');
  } finally {
    try {
      m && m.remove();
    } catch (e) {}
    div.remove();
    if (kamJob === key) kamJob = '';
  }
  if (kameraKey() === key) render();
  else if (std3d()) scheduleKamera(100);
}
