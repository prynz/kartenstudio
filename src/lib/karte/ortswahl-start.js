// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ort übernehmen, Suche auf Startseite und im Fenster verbinden
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from '../editor/app.js';
import { $ } from '../editor/basis.js';
import { attachSearch } from './suche.js';
import { openPicker, sizeInfo } from './ortswahl.js';

export function pickPlace(f, q) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  window._place = {
    name: p.name || q,
    region: p.county || p.state || '',
    lon,
    lat
  };
  $('q').value = p.name || q;
  const small = /^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm|house|street)$/.test(p.osm_value || p.type || '');
  const go = () => {
    if (!app.map) return;
    if (p.extent && !small) {
      const e = p.extent;
      app.map.fitBounds([[e[0], e[3]], [e[2], e[1]]], {
        padding: 90,
        maxZoom: 16.2,
        minZoom: 13,
        duration: 0
      });
    } else app.map.jumpTo({
      center: [lon, lat],
      zoom: 15.4
    });
    setTimeout(sizeInfo, 50);
  };
  if ($('picker').classList.contains('hidden')) {
    openPicker(false);
    setTimeout(go, 80);
  } else go();
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

