// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Offline-Beispiel Siegritz
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import DEMO from './beispiel-siegritz.json';
import { app } from './app.js';
import { $ } from './basis.js';
import { buildData } from '../karte/daten.js';
import { loadData } from './laden.js';
import { msg } from './ansicht.js';
import { setTool } from './bedienung.js';
import { updUndo } from './zustand.js';

export /* ---------- Beispiel-Ausschnitt (funktioniert ohne Internet) ---------- */

function loadDemo() {
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
  msg('Beispiel Siegritz geladen – probier Stile, Farben und Text aus', 'ok');
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorBeispiel() {
  updUndo();
  setTool('sel');
  /* ---------- Beispiel-Ausschnitt (funktioniert ohne Internet) ---------- */
  
  $('demoBtn').onclick = loadDemo;
}

