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
export function defView() {
  const a = app.DATA ? app.DATA.MH0 / MW : 0.8805;
  return {
    cx: MW / 2,
    cy: (app.DATA ? app.DATA.MH0 : MW * a) / 2,
    z: 1,
    a
  };
}
export function vLimits(v) {
  const e = app.DATA.ext,
    MH = MW * v.a;
  const zmin = Math.max(MW / (e.x1 - e.x0), MH / (e.y1 - e.y0)) * 1.0001;
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
    e = app.DATA.ext;
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
