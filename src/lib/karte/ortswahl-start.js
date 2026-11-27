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
import { istNeu } from '../editor/modus.js';

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
  if (istNeu() && !(breite > 0)) return liveBounds(p, lon, lat, a);
  const small = /^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm|house|street)$/.test(p.osm_value || p.type || '');
  const tiny = /^(hamlet|isolated_dwelling|farm|house|street|neighbourhood)$/.test(p.osm_value || p.type || '');
  let wm = tiny ? 750 : small ? 1300 : 2500;
  const cos = Math.cos(lat * Math.PI / 180);
  if (p.extent && !tiny) {
    const e = p.extent; // [west, nord, ost, süd]
    const ew = (e[2] - e[0]) * 111320 * cos, eh = (e[1] - e[3]) * 110540;
    // Der ganze Ort aufs Poster (wie bei klassischen Stadtplan-Postern): Ortsgrenze mit etwas Luft,
    // Dörfer höchstens 1,8 km, Großstädte höchstens 10 km (sonst nur noch Gewimmel)
    wm = Math.max(small ? 900 : 1500, Math.min(small ? 1800 : 10000, Math.max(ew, eh / a) * (small ? 1.08 : 0.9)));
  }
  if (breite > 0) wm = breite;
  const [mx, my] = merc(lon, lat);
  const dx = wm / (40075016.7 * cos), dy = dx * a;
  const [w, n] = mercInv(mx - dx / 2, my - dy / 2), [e2, s] = mercInv(mx + dx / 2, my + dy / 2);
  return { w, n, e: e2, s };
}

/** Art des Suchtreffers grob einordnen: Adresse, Straße, Ort (Dorf/Stadt) oder Gebiet (Land, Bundesland …) */
export function trefferArt(p) {
  const t = String(p.type || ''), v = String(p.osm_value || ''), k = String(p.osm_key || '');
  if (t === 'house' || p.housenumber || (k && k !== 'place' && k !== 'boundary' && t !== 'street' && t !== 'city' && t !== 'district' && t !== 'county' && t !== 'state' && t !== 'country' && t !== 'locality' && t !== 'other')) return 'adresse';
  if (t === 'street') return 'strasse';
  if (t === 'country' || v === 'country' || v === 'continent') return 'land';
  if (t === 'state' || t === 'county' || /^(state|region|province|county|island|archipelago)$/.test(v)) return 'gebiet';
  if (/^(village|hamlet|isolated_dwelling|farm|neighbourhood|quarter|suburb|locality)$/.test(v) || t === 'locality') return 'dorf';
  return 'stadt';
}

/**
 * Startausschnitt im neuen Editor (Live-Karte): genau das, was gesucht wurde.
 * Land/Bundesland/Stadt → ganze Fläche (z. B. Italien = der ganze Stiefel), Straße → die Straße,
 * Adresse → genau dieser Punkt (≈ 500 m). Feinjustieren danach per Ziehen und Zoomen.
 */
function liveBounds(p, lon, lat, a) {
  const art = trefferArt(p);
  const welt = 40075016.7;
  let [cx, cy] = merc(lon, lat);
  let dx;
  // Breite in Metern ohne Ausdehnung (oder als Untergrenze)
  const ohne = { adresse: 500, strasse: 900, dorf: 1600, stadt: 6000, gebiet: 300000, land: 1200000 }[art];
  const cos = Math.cos(lat * Math.PI / 180);
  dx = ohne / (welt * cos);
  if (p.extent && art !== 'adresse') {
    const e = p.extent; // [west, nord, ost, süd]
    let [x0, y0] = merc(e[0], e[1]), [x1, y1] = merc(e[2], e[3]);
    if (x1 < x0) x1 += 1; // über die Datumsgrenze
    let w = x1 - x0, h = y1 - y0;
    // Städte: Mitte = Stadtpunkt, Ausdehnung symmetrisch darum. Ferne Exklaven (Hamburg → Insel Neuwerk
    // in der Nordsee) würden die Stadt sonst an den Rand schieben.
    if (art === 'stadt' && cx > x0 && cx < x1 && cy > y0 && cy < y1) {
      const sym = (/** @type {number} */ l, /** @type {number} */ r) => 2 * Math.min(Math.max(l, r), Math.min(l, r) * 1.15);
      w = sym(cx - x0, x1 - cx); h = sym(cy - y0, y1 - cy);
    }
    // Etwas Luft drumherum; große Gebiete mittig auf ihre Fläche (nicht auf die Hauptstadt)
    const luft = art === 'land' || art === 'gebiet' ? 1.08 : art === 'strasse' ? 1.25 : 1.05;
    const d = Math.max(w, h / a) * luft;
    const min = { strasse: 400, dorf: 900, stadt: 1500 }[art] || 0;
    dx = Math.max(d, min / (welt * cos));
    if (art === 'land' || art === 'gebiet') { cx = (x0 + x1) / 2; cy = (y0 + y1) / 2; }
  }
  dx = Math.min(dx, 0.9); // höchstens fast die ganze Welt
  const dy = dx * a;
  cy = Math.min(1 - dy / 2, Math.max(dy / 2, cy));
  const [w, n] = mercInv(cx - dx / 2, cy - dy / 2), [e2, s] = mercInv(cx + dx / 2, cy + dy / 2);
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

