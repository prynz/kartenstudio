// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Offline-Beispiel Siegritz
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $ } from './basis.js';
import { buildData } from '../karte/daten.js';
import { loadData } from './laden.js';
import { msg } from './ansicht.js';
import { setTool } from './bedienung.js';
import { updUndo } from './zustand.js';

export /* ---------- Beispiel-Ausschnitt (funktioniert ohne Internet) ---------- */

async function loadDemo(quiet) {
  // Beispieldaten erst laden, wenn sie gebraucht werden (hält den Start schlank)
  const DEMO = (await import('./beispiel-siegritz.json')).default;
  const b = DEMO.b;
  app.lastB = b;
  window._place = {
    name: 'Siegritz',
    region: 'Fränkische Schweiz'
  };
  loadData(buildData(DEMO.osm, b, b, {
    name: 'Siegritz',
    region: 'Fränkische Schweiz',
    center: [(b.w + b.e) / 2, (b.n + b.s) / 2]
  }));
  app.isDemo = true;
  if (!quiet) msg('Beispiel Siegritz geladen – probier Stile, Farben und Text aus', 'ok');
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorBeispiel() {
  updUndo();
  setTool('sel');
  /* ---------- Beispiel-Ausschnitt (funktioniert ohne Internet) ---------- */
  
  // Kein Knopf mehr auf der Startseite – die Offline-Daten nutzen die Galerie und die automatischen Tests
  window.addEventListener('ks-demo', () => loadDemo());
}

