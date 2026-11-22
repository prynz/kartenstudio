// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Standard-Stile als hochaufgelöstes Bild rendern
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { loadMaplibre } from './ortswahl.js';
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
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19
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
    m = new maplibregl.Map({ container: div, style: st, center: c, zoom, interactive: false, attributionControl: false, preserveDrawingBuffer: true, pixelRatio: pr, fadeDuration: 0 });
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
