// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Grundlagen: Konstanten, Schriften, kleine Hilfsfunktionen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
export const NS = 'http://www.w3.org/2000/svg';
/** Eingebettete Schriften (für Export/Vorschaubilder) – werden per ladeSchriften() nachgeladen */
export const FONTDATA = {};
let schriftLaden = null;
/** Schriftdaten nachladen (einmal); löst danach das Ereignis „ks-schriften“ aus */
export function ladeSchriften() {
  if (!schriftLaden) schriftLaden = import('./schriftdaten.js').then(m => {
    Object.assign(FONTDATA, m.DATEN);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('ks-schriften'));
  });
  return schriftLaden;
}
export const schriftenDa = () => !!FONTDATA.SgXB;
export const CAP = {
  SgXB: 0.7275,
  SgMD: 0.7275,
  SgFR: 0.684,
  SgSC: 0.75,
  SgBR: 0.72,
  SgBE: 0.7
};
export const SWATCH = ['#262c3a', '#000000', '#ffffff', '#a6a6a6', '#c62828', '#1f6f43', '#b07d2b', '#2f5fa8'];
export const CLS = {
  gruen: 'Grünflächen',
  haus: 'Häuser',
  haupt: 'Hauptstraßen',
  neben: 'Nebenstraßen',
  weg: 'Feldwege',
  wasser: 'Gewässer',
  bahn: 'Bahn'
};
export const CLS1 = {
  gruen: 'Grünfläche',
  haus: 'Haus',
  haupt: 'Hauptstraße',
  neben: 'Nebenstraße',
  weg: 'Feldweg',
  wasser: 'Gewässer',
  bahn: 'Bahn'
};
export const ORDER = ['gruen', 'wasser', 'weg', 'neben', 'bahn', 'haus', 'haupt'];
export const MW = 1004;
export const $ = id => document.getElementById(id);
export function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function hex(c) {
  if (!c || c === 'none') return '#000000';
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + [...c.slice(1)].map(x => x + x).join('').toLowerCase();
  return '#000000';
}

/* ---------- Stil-Vorlagen ---------- */
