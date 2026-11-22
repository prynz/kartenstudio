// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ortswahl-Fenster mit MapLibre-Karte und Formatrahmen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from '../editor/app.js';
import { $ } from '../editor/basis.js';
import { setGen } from '../editor/laden.js';
import { KONFIG } from '../konfig.js';

/** MapLibre (groß) erst laden, wenn das Kartenfenster wirklich gebraucht wird */
export function loadMaplibre() {
  // MapLibre 6: der Hintergrund-Prozess (Worker) wird als eigene Datei mit ausgeliefert
  return Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'), import('maplibre-gl/dist/maplibre-gl.css')]).then(([m, w]) => {
    const lib = m.default || m;
    if (lib.setWorkerUrl) lib.setWorkerUrl(w.default);
    return lib;
  });
}
export async function initMap() {
  try {
    const maplibregl = await loadMaplibre();
    app.map = new maplibregl.Map({
      container: 'map',
      style: KONFIG.styles + '/positron',
      center: [11.2111, 49.8514],
      zoom: 15.3,
      attributionControl: {
        compact: false
      }
    });
    app.map.addControl(new maplibregl.NavigationControl({
      showCompass: false
    }), 'top-right');
    app.map.on('move', sizeInfo);
    app.map.on('load', () => {
      placeFrame();
      sizeInfo();
    });
    app.map.on('error', e => {});
  } catch (e) {
    $('maperr').style.display = 'flex';
  }
  window.addEventListener('resize', () => {
    placeFrame();
    sizeInfo();
  });
  placeFrame();
}
export function fitTo(b) {
  if (!b || !app.map || !app.map.fitBounds) return;
  const ov = $('frameov'),
    wrap = $('mapwrap');
  try {
    app.map.resize();
    app.map.fitBounds([[b.w, b.s], [b.e, b.n]], {
      padding: {
        left: ov.offsetLeft,
        top: ov.offsetTop,
        right: Math.max(0, wrap.clientWidth - ov.offsetLeft - ov.offsetWidth),
        bottom: Math.max(0, wrap.clientHeight - ov.offsetTop - ov.offsetHeight)
      },
      duration: 0
    });
  } catch (e) {}
}
export function openPicker(focusSearch) {
  $('picker').classList.remove('hidden');
  setGen('');
  const ready = app.mapInit ? Promise.resolve() : (app.mapInit = true, initMap());
  ready.then(() => setTimeout(() => {
    if (app.map) app.map.resize();
    placeFrame();
    if (app.lastB) fitTo(app.lastB);
    sizeInfo();
    if (focusSearch) $('q').focus();
  }, 40));
}
export function closePicker() {
  $('picker').classList.add('hidden');
  $('results').classList.add('hidden');
}
export function placeFrame() {
  const wrap = $('mapwrap'),
    W = wrap.clientWidth,
    H = wrap.clientHeight,
    a = +$('aspect').value;
  let w = W * 0.62,
    h = w * a;
  if (h > H * 0.82) {
    h = H * 0.82;
    w = h / a;
  }
  const ov = $('frameov');
  ov.style.width = w + 'px';
  ov.style.height = h + 'px';
  ov.style.left = (W - w) / 2 + 'px';
  ov.style.top = (H - h) / 2 + 'px';
}
export function frameBounds() {
  const wrap = $('mapwrap'),
    ov = $('frameov');
  const x0 = ov.offsetLeft,
    y0 = ov.offsetTop,
    x1 = x0 + ov.offsetWidth,
    y1 = y0 + ov.offsetHeight;
  const nw = app.map.unproject([x0, y0]),
    se = app.map.unproject([x1, y1]);
  return {
    w: nw.lng,
    n: nw.lat,
    e: se.lng,
    s: se.lat
  };
}
export function meters(b) {
  const R = 6371000,
    lat = (b.n + b.s) / 2 * Math.PI / 180;
  return {
    w: (b.e - b.w) * Math.PI / 180 * R * Math.cos(lat),
    h: (b.n - b.s) * Math.PI / 180 * R
  };
}
export function sizeInfo() {
  if (!app.map) return;
  try {
    const m = meters(frameBounds());
    $('sizeinfo').textContent = `Rahmen: ca. ${Math.round(m.w)} × ${Math.round(m.h)} m.` + (m.w > 3500 ? ' Sehr groß – die Karte wird sehr dicht.' : '');
  } catch (e) {}
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initKarteOrtswahl() {
  $('pClose').onclick = closePicker;
  $('pCancel').onclick = closePicker;
  ['openPicker2', 'openPicker3'].forEach(id => $(id).onclick = () => openPicker(true));
  document.querySelectorAll('#fmt1 button').forEach(b => b.onclick = () => {
    document.querySelectorAll('#fmt1 button').forEach(x => x.classList.toggle('on', x === b));
    $('aspect').value = b.dataset.a;
    placeFrame();
    sizeInfo();
  });
}

