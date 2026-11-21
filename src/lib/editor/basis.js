// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Grundlagen: Konstanten, Schriften, kleine Hilfsfunktionen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import FONT_XB_URL from '../assets/fonts/inter-xb.woff?inline';
import FONT_MD_URL from '../assets/fonts/inter-md.woff?inline';
import FONT_FR_URL from '../assets/fonts/frak.woff?inline';
const b64 = (u) => u.slice(u.indexOf(',') + 1);
const FONT_XB = b64(FONT_XB_URL), FONT_MD = b64(FONT_MD_URL), FONT_FR = b64(FONT_FR_URL);

export const NS = 'http://www.w3.org/2000/svg';
export const FONTDATA = {
  SgXB: FONT_XB,
  SgMD: FONT_MD,
  SgFR: FONT_FR
};
export const CAP = {
  SgXB: 0.7275,
  SgMD: 0.7275,
  SgFR: 0.684
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
