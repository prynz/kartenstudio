// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ort übernehmen, Suche auf Startseite und im Fenster verbinden
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from '../editor/app.js';
import { $ } from '../editor/basis.js';
import { attachSearch } from './suche.js';
import { sizeInfo } from './ortswahl.js';
import { loadBounds } from '../editor/laden.js';
import { merc } from './overpass.js';
import { mercInv } from './raster.js';

/** Untertitel-Vorschlag aus den Ortsdaten: Landkreis ohne „Landkreis“, sonst Stadt/Bundesland */
export function regionOf(p) {
  const county = String(p.county || '').replace(/^(Landkreis|Kreis|Lkr\.?|Region|Bezirk)\s+/i, '').trim();
  const city = p.city && p.city !== p.name ? p.city : '';
  return county && county !== p.name ? county : city || p.state || '';
}

/**
 * Schlauer Startausschnitt: Ortskern im gewünschten Seitenverhältnis.
 * Dörfer ≈ 1,1 km breit, Städte nach ihrer Ausdehnung (gedeckelt, damit die Karte nicht zu dicht wird).
 */
/**
 * @param {any} p @param {number} lon @param {number} lat @param {number} a
 * @param {number} [breite] feste Breite in Metern (z. B. für Beispiele)
 */
export function placeBounds(p, lon, lat, a, breite) {
  const small = /^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm|house|street)$/.test(p.osm_value || p.type || '');
  const tiny = /^(hamlet|isolated_dwelling|farm|house|street|neighbourhood)$/.test(p.osm_value || p.type || '');
  let wm = tiny ? 750 : 1100;
  const cos = Math.cos(lat * Math.PI / 180);
  if (p.extent && !small) {
    const e = p.extent; // [west, nord, ost, süd]
    const ew = (e[2] - e[0]) * 111320 * cos, eh = (e[1] - e[3]) * 110540;
    // Ortskern: etwas enger als die Gemeindegrenze
    wm = Math.max(900, Math.min(2000, Math.max(ew, eh / a) * 0.6));
  }
  if (breite > 0) wm = breite;
  const [mx, my] = merc(lon, lat);
  const dx = wm / (40075016.7 * cos), dy = dx * a;
  const [w, n] = mercInv(mx - dx / 2, my - dy / 2), [e2, s] = mercInv(mx + dx / 2, my + dy / 2);
  return { w, n, e: e2, s };
}

export function pickPlace(f, q) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const name = String(p.name || q).slice(0, 60);
  window._place = { name, region: regionOf(p).slice(0, 60), lon, lat };
  $('q').value = name;
  const inPicker = !$('picker').classList.contains('hidden');
  if (!inPicker) {
    // Direkt zum fertigen Poster – ohne Umweg über das Kartenfenster
    const a = app.S ? app.S.view.a : +$('aspect').value || 0.8805;
    // Neuer Ort: eine geladene Route gehört nicht mehr dazu
    if (app.S && app.S.route) app.S.route = null;
    loadBounds(placeBounds(p, lon, lat, a), { center: [lon, lat] });
    return;
  }
  const small = /^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm|house|street)$/.test(p.osm_value || p.type || '');
  if (!app.map) return;
  if (p.extent && !small) {
    const e = p.extent;
    app.map.fitBounds([[e[0], e[3]], [e[2], e[1]]], { padding: 90, maxZoom: 16.2, minZoom: 13, duration: 0 });
  } else app.map.jumpTo({ center: [lon, lat], zoom: 15.4 });
  setTimeout(sizeInfo, 50);
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initKarteOrtswahlStart() {
  attachSearch('q', 'go', 'results', pickPlace);
  app.landingRun = attachSearch('lq', 'lgo', 'lresults', pickPlace);
  document.querySelectorAll('.examples .chip').forEach(c => c.onclick = () => {
    $('lq').value = c.dataset.q;
    app.landingRun();
  });
  
  /* ---------- OSM laden ---------- */
}

