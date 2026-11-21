// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Standard-Stile als hochaufgelöstes Bild rendern
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import maplibregl from 'maplibre-gl';
import { app } from '../editor/app.js';
import { BASES } from '../themen/standard.js';
import { MW } from '../editor/basis.js';
import { msg } from '../editor/ansicht.js';
import { render } from '../editor/zeichnen.js';

export const RASTER = new Map();
export function rasterKey() {
  return app.S.base + '|' + (app.S.labels ? 1 : 0) + '|' + (app.DATA ? app.DATA.ext.x0.toFixed(1) + app.DATA.proj.x0 : '');
}
export function mercInv(x, y) {
  return [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI];
}
export async function ensureRaster() {
  if (!app.S || app.S.mode !== 'std' || !app.DATA) return;
  const k = rasterKey();
  if (RASTER.has(k)) {
    render();
    return;
  }
  if (!maplibregl) {
    msg('Standard-Stile brauchen eine Internetverbindung – hier sind nur die künstlerischen Stile verfügbar.', 'err');
    return;
  }
  if (app.rasterJob === k) return;
  app.rasterJob = k;
  msg('Karte wird gezeichnet …', 'busy');
  const E = app.DATA.ext,
    P = app.DATA.proj,
    B = BASES[app.S.base];
  const mw = (E.x1 - E.x0) / P.sc,
    mh = (E.y1 - E.y0) / P.sc;
  const cssW = Math.round(Math.min(2600, 1150 * (E.x1 - E.x0) / MW)),
    cssH = Math.round(cssW * mh / mw);
  const pr = Math.max(1, Math.min(2.5, 4096 / Math.max(cssW, cssH)));
  const zoom = Math.log2(cssW / (mw * 512));
  const c = mercInv(P.x0 + (E.x0 + E.x1) / 2 / P.sc, P.y0 + (E.y0 + E.y1) / 2 / P.sc);
  const div = document.createElement('div');
  div.style.cssText = `position:fixed;left:-20000px;top:0;width:${cssW}px;height:${cssH}px;pointer-events:none`;
  document.body.appendChild(div);
  let m = null;
  try {
    const r = await fetch(B.style);
    if (!r.ok) throw new Error('Stil HTTP ' + r.status);
    const st = await r.json();
    st.layers.forEach(l => {
      if (l.type === 'symbol') {
        l.layout = l.layout || {};
        l.layout.visibility = app.S.labels ? 'visible' : 'none';
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
      st.layers.splice(bi + 1, 0, {
        id: 'sat',
        type: 'raster',
        source: 'sat'
      });
      if (app.S.labels) st.layers.forEach(l => {
        if (l.type === 'symbol' && l.paint) {
          l.paint['text-color'] = '#ffffff';
          l.paint['text-halo-color'] = 'rgba(0,0,0,.75)';
          l.paint['text-halo-width'] = 1.4;
        }
      });
    }
    m = new maplibregl.Map({
      container: div,
      style: st,
      center: c,
      zoom,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      pixelRatio: pr,
      fadeDuration: 0
    });
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('Zeitüberschreitung')), 60000);
      m.once('idle', () => {
        clearTimeout(to);
        res();
      });
    });
    const url = m.getCanvas().toDataURL('image/jpeg', 0.9);
    RASTER.set(k, {
      url
    });
    msg('Karte fertig', 'ok');
  } catch (e) {
    console.warn(e);
    msg('Die Karte konnte nicht gezeichnet werden (' + (e.message || e) + '). Bitte erneut versuchen.', 'err');
  } finally {
    try {
      m && m.remove();
    } catch (e) {}
    div.remove();
    if (app.rasterJob === k) app.rasterJob = null;
  }
  if (app.S.mode === 'std') render();
}
