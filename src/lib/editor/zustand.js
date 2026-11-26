// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Zustand des Editors, Ansicht, Undo/Redo
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, CLS, MW } from './basis.js';
import { PRESETS } from '../themen/vorlagen.js';
import { applyDesign } from '../themen/designs.js';
import { RASTER, ensureRaster, rasterKey } from '../karte/raster.js';
import { render } from './zeichnen.js';
import { saveDraftSoon } from './entwurf.js';

export function newState(presetKey, keep) {
  const p = PRESETS[presetKey];
  const st = {
    preset: presetKey,
    cls: JSON.parse(JSON.stringify(p.cls)),
    ov: {},
    scale: 1,
    bg: p.bg,
    bg2: p.bg2 || '',
    bgV: !!p.bgV,
    frame: {
      ...p.frame
    },
    bar: {
      color: p.bar.color,
      on: p.bar.on,
      h: 150,
      auto: true,
      gap: 20
    },
    title: {
      text: app.DATA ? app.DATA.place.toUpperCase() : 'TITEL',
      font: 'SgXB',
      size: 72,
      ls: 14,
      color: p.text,
      on: true
    },
    sub: {
      text: app.DATA ? app.DATA.region : '',
      font: 'SgFR',
      size: 38,
      ls: 1,
      color: p.text,
      on: true
    },
    attr: {
      on: true
    },
    view: defView(),
    mode: 'art',
    base: 'liberty',
    labels: true,
    pop: p.pop ? JSON.parse(JSON.stringify(p.pop)) : null,
    note: { text: '', on: true },
    pins: [],
    pinColor: '#d64545',
    print: null
  };
  Object.keys(CLS).forEach(k => {
    if (st.cls[k].h === undefined) st.cls[k].h = false;
  });
  if (keep) {
    st.view = {
      ...keep.view
    };
    st.title = {
      ...keep.title,
      color: p.text
    };
    st.sub = {
      ...keep.sub,
      color: p.text
    };
    st.attr = {
      ...keep.attr
    };
    st.bar.gap = keep.bar.gap;
    st.bar.auto = keep.bar.auto;
    st.bar.h = keep.bar.h;
    st.mode = keep.mode;
    st.base = keep.base;
    st.labels = keep.labels;
    if (keep.ortsnamen) st.ortsnamen = true;
    if (keep.zeig) {
      st.zeig = keep.zeig;
      zeigAnwenden(st);
    }
    st.note = { ...(keep.note || st.note) };
    st.pins = JSON.parse(JSON.stringify(keep.pins || []));
    st.pinColor = keep.pinColor || st.pinColor;
    st.print = keep.print ? { ...keep.print } : null;
    if (keep.product) st.product = { ...keep.product };
    if (keep.fx) st.fx = { ...keep.fx };
    if (keep.occasion) st.occasion = keep.occasion;
    if (keep.sky) st.sky = { ...keep.sky };
    if (keep.koord) st.koord = { ...keep.koord };
    if (keep.wolke) st.wolke = { ...keep.wolke };
    if (keep.motif) st.motif = keep.motif;
    if (keep.route) st.route = JSON.parse(JSON.stringify(keep.route));
    if (keep.hoehen) st.hoehen = { ...keep.hoehen };
    if (keep.multi) st.multi = JSON.parse(JSON.stringify(keep.multi));
    if (keep.info) st.info = { ...keep.info };
    if (keep.typo) st.typo = { ...keep.typo };
    if (keep.form) st.form = keep.form;
  }
  // Design (Aufbau/Rahmen) bleibt beim Wechsel des Farbthemas erhalten
  applyDesign(st, keep && keep.design || 'poster', p, !keep);
  return st;
}
/** Kartendetails: „strassen“ = ohne Häuser, „haeuser“ = ohne Straßen/Wege/Bahn, „alle“ = wie der Stil */
export const STRASSEN = ['haupt', 'neben', 'weg', 'bahn'];
export function zeigAnwenden(st) {
  if (st.zeig === 'strassen' && st.cls.haus) st.cls.haus.h = true;
  if (st.zeig === 'haeuser') STRASSEN.forEach(k => st.cls[k] && (st.cls[k].h = true));
}
export function defView() {
  const a = app.DATA ? app.DATA.MH0 / MW : 0.8805;
  return {
    cx: MW / 2,
    cy: (app.DATA ? app.DATA.MH0 : MW * a) / 2,
    z: 1,
    a
  };
}
/** Meter je Karteneinheit (Poster-Kartenkoordinaten) */
export function meterJeEinheit(D = app.DATA) {
  const lat = (D.center && D.center[1]) || 50;
  return 40075016.7 * Math.cos(lat * Math.PI / 180) / D.proj.sc;
}
/** Kann beim Verschieben weitere Karte nachgeladen werden? (nur Vektorkacheln, nicht beim Beispiel) */
export function nachladbar(D = app.DATA) {
  return !!(D && D.src === 'tiles' && D.tkeys && !app.isDemo && !(app.S && app.S.multi && app.S.multi.on));
}
/**
 * Bereich, in dem man die Karte verschieben darf. Mit Nachladen: großzügig um den Ort
 * (8 × Posterbreite, höchstens 15 km) – fehlende Teile werden beim Ziehen nachgeladen.
 */
export function freiBereich(D = app.DATA) {
  const e = D.ext;
  if (!nachladbar(D)) return e;
  if (D._frei && D._frei.e === e) return D._frei.r;
  const L = Math.min(MW * 8, 15000 / meterJeEinheit(D)) / 2;
  const cx = MW / 2, cy = D.MH0 / 2;
  const r = { x0: Math.min(e.x0, cx - L), y0: Math.min(e.y0, cy - L), x1: Math.max(e.x1, cx + L), y1: Math.max(e.y1, cy + L) };
  D._frei = { e, r };
  return r;
}
/** Kleinster Zoom, bei dem die schon geladene Gegend das Poster füllt („Mit Umgebung“) */
export function extZmin(v) {
  const e = app.DATA.ext, MH = MW * v.a;
  return Math.max(MW / (e.x1 - e.x0), MH / (e.y1 - e.y0)) * 1.0001;
}
/**
 * Wie viele Kartenelemente dürfen höchstens gleichzeitig sichtbar sein? Darüber wird das Poster am
 * Bildschirm zäh (jede Linie ist ein eigenes Element) – und gedruckt ist es ohnehin nur noch Gewimmel.
 */
export const SICHTBAR_MAX = () => (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 900px)').matches ? 11000 : 17000);
/** Kartenelemente je Flächeneinheit der ursprünglich geladenen Gegend (Stadt dicht, Dorf dünn) */
export function dichte(D = app.DATA) {
  if (!D) return 0;
  if (D._dichte == null) {
    const e = D.ext;
    D._dichte = (D.n0 ?? D.feats.length) / Math.max(1, (e.x1 - e.x0) * (e.y1 - e.y0));
  }
  return D._dichte;
}
/** Größte sinnvolle sichtbare Breite (Karteneinheiten) nach Dichte des Orts */
export function dichteBreite(v) {
  const d = dichte();
  return d > 0 ? Math.sqrt(SICHTBAR_MAX() / (d * v.a)) : Infinity;
}
export function vLimits(v) {
  const MH = MW * v.a;
  let zmin = extZmin(v);
  if (nachladbar()) {
    // Herauszoomen über die geladene Gegend hinaus: bis 3 × Posterbreite (max. 6 km) – lädt nach.
    // In dichten Städten weniger weit (höchstens ~17 000 Elemente sichtbar), nie aber enger als die geladene Gegend.
    const f = freiBereich();
    const maxW = Math.max(MW / zmin, Math.min(MW * 3, 6000 / meterJeEinheit(), dichteBreite(v)));
    zmin = Math.max(MW / maxW, MW / (f.x1 - f.x0), MH / (f.y1 - f.y0)) * 1.0001;
  }
  return {
    zmin,
    zmax: 8,
    MH
  };
}
export function clampView(v) {
  const L = vLimits(v);
  v.z = Math.min(L.zmax, Math.max(L.zmin, v.z));
  const hw = MW / 2 / v.z,
    hh = L.MH / 2 / v.z,
    e = freiBereich();
  v.cx = Math.min(e.x1 - hw, Math.max(e.x0 + hw, v.cx));
  v.cy = Math.min(e.y1 - hh, Math.max(e.y0 + hh, v.cy));
  return v;
}
export function vT(g) {
  const v = app.S.view;
  return `translate(${g.mx.toFixed(2)},${g.my.toFixed(2)}) translate(${MW / 2},${(g.MH / 2).toFixed(2)}) scale(${v.z.toFixed(5)}) translate(${(-v.cx).toFixed(2)},${(-v.cy).toFixed(2)})`;
}
export function visRect() {
  const v = app.S.view,
    MH = MW * v.a,
    hw = MW / 2 / v.z,
    hh = MH / 2 / v.z;
  return [v.cx - hw, v.cy - hh, v.cx + hw, v.cy + hh];
}
export function snap() {
  return JSON.stringify(app.S);
}
export function begin() {
  if (app.pending === null) app.pending = snap();
}
export function commit() {
  if (app.pending !== null) {
    if (app.pending !== snap()) {
      app.undoS.push(app.pending);
      if (app.undoS.length > 150) app.undoS.shift();
      app.redoS = [];
    }
    app.pending = null;
  }
  updUndo();
}
export function change(fn) {
  begin();
  fn();
  commit();
  render();
}
export function updUndo() {
  if (app.S && app.S.mode === 'std' && app.DATA && !RASTER.has(rasterKey())) setTimeout(ensureRaster, 0);
  $('undo').disabled = !app.undoS.length;
  $('redo').disabled = !app.redoS.length;
  saveDraftSoon();
}
export function eff(f) {
  const c = app.S.cls[f.k],
    o = app.S.ov[f.id] || {};
  return {
    s: o.s ?? c.s,
    f: o.f ?? c.f,
    w: o.w ?? c.w,
    h: o.h ?? c.h
  };
}

/* ---------- Schritt 1: Karte & Suche ---------- */
