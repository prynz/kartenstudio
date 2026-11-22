// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Zeiger-Bedienung: Auswählen, Verschieben, Zoomen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, MW } from './basis.js';
import { begin, change, clampView, commit, defView, eff, vLimits, visRect } from './zustand.js';
import { drawSel, geo, render, renderView } from './zeichnen.js';
import { msg } from './ansicht.js';
import { openSec, panel } from './seitenleiste.js';

export function idOf(t) {
  if (!t || !t.dataset) return null;
  if (t.dataset.ref) return t.dataset.ref;
  if (t.dataset.k) return t.dataset.g;
  return {
    rahmen: 'frame',
    balken: 'bar',
    titel: 'title',
    untertitel: 'sub',
    kartenhintergrund: 'bgmap'
  }[t.id] || null;
}
export function toSvg(cx, cy) {
  const m = app.poster.getScreenCTM();
  if (!m) return {
    x: 0,
    y: 0
  };
  const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
  return {
    x: p.x,
    y: p.y
  };
}
export function svgToMap(p) {
  const g = geo(),
    v = app.S.view;
  return {
    x: (p.x - g.mx - MW / 2) / v.z + v.cx,
    y: (p.y - g.my - g.MH / 2) / v.z + v.cy
  };
}
export function endDrag(ev) {
  if (!app.drag) return;
  const d = app.drag;
  app.drag = null;
  app.cv.classList.remove('dragging');
  $('marq').style.display = 'none';
  if (d.pin != null) {
    commit();
    return;
  }
  if (app.tool === 'move') {
    commit();
    return;
  }
  if (!d.moved) {
    const id = idOf(d.t);
    app.selCls = null;
    if (!id) {
      if (!d.multi) app.sel.clear();
    } else if (d.multi) {
      app.sel.has(id) ? app.sel.delete(id) : app.sel.add(id);
    } else {
      app.sel.clear();
      app.sel.add(id);
    }
    if (id) {
      if (id === 'title' || id === 'sub') {
        app.curText = id;
        openSec('text');
      } else if (['frame', 'bar', 'bgmap'].includes(id)) openSec('rahmen');else openSec('elemente');
    }
    drawSel();
    panel();
    return;
  }
  const a = svgToMap(toSvg(Math.min(d.x, ev.clientX), Math.min(d.y, ev.clientY))),
    b = svgToMap(toSvg(Math.max(d.x, ev.clientX), Math.max(d.y, ev.clientY)));
  const vr = visRect();
  const r = [Math.max(a.x, vr[0]), Math.max(a.y, vr[1]), Math.min(b.x, vr[2]), Math.min(b.y, vr[3])];
  if (!d.multi) app.sel.clear();
  app.selCls = null;
  if (app.S.mode !== 'std' && r[2] > r[0] && r[3] > r[1]) app.DATA.feats.forEach(f => {
    if (eff(f).h) return;
    const bx = f.bx;
    if (bx[2] < r[0] || bx[0] > r[2] || bx[3] < r[1] || bx[1] > r[3]) return;
    const P = f.pts;
    let hit = false;
    for (let i = 0; i < P.length; i += 2) {
      if (P[i] >= r[0] && P[i] <= r[2] && P[i + 1] >= r[1] && P[i + 1] <= r[3]) {
        hit = true;
        break;
      }
    }
    if (!hit && f.a && bx[0] <= r[0] && bx[2] >= r[2] && bx[1] <= r[1] && bx[3] >= r[3]) hit = true;
    if (hit) app.sel.add(f.id);
  });
  if (app.sel.size) openSec('elemente');
  drawSel();
  panel();
  if (app.sel.size) msg(`${app.sel.size} Elemente markiert`, 'ok');
}
export function setTool(t) {
  app.tool = t;
  $('toolSel').classList.toggle('on', t === 'sel');
  $('toolMove').classList.toggle('on', t === 'move');
  app.cv.classList.toggle('tool-move', t === 'move');
  $('toolHint').textContent = t === 'sel' ? 'Klicken oder Rahmen aufziehen zum Auswählen · Klick daneben hebt auf' : 'Karte ziehen zum Verschieben · Mausrad zum Zoomen';
}
export function zToSlider(v) {
  const L = vLimits(v);
  return Math.round(100 * Math.log(v.z / L.zmin) / Math.log(L.zmax / L.zmin));
}
export function sliderToZ(val, v) {
  const L = vLimits(v);
  return L.zmin * Math.pow(L.zmax / L.zmin, val / 100);
}
export function syncTools() {
  if (!app.S) return;
  $('vZoom').value = zToSlider(app.S.view);
  const o = [...$('aspect2').options].find(o => Math.abs(+o.value - app.S.view.a) < 0.01);
  if (o) $('aspect2').value = o.value;
}
export const zStep = f => change(() => {
  app.S.view.z *= f;
  clampView(app.S.view);
});

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
/* ---------- Zwei-Finger-Zoom (Handy/Tablet) ---------- */
const PTS = new Map();
let pinch = null;
function pinchInfo() {
  const [a, b] = [...PTS.values()];
  return { d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function startPinch() {
  if ((app.S.motif === 'sterne' || app.S.motif === 'koord' || app.S.motif === 'wolke' || (app.S.multi && app.S.multi.on))) return;
  const i = pinchInfo();
  if (app.drag && app.tool !== 'move') $('marq').style.display = 'none';
  app.drag = null;
  begin();
  // Kartenpunkt unter der Fingermitte merken – er soll unter den Fingern bleiben
  pinch = { d0: Math.max(10, i.d), v0: { ...app.S.view }, p0: svgToMap(toSvg(i.x, i.y)) };
}
function movePinch() {
  const i = pinchInfo(),
    v0 = pinch.v0,
    L = vLimits(v0);
  const z = Math.min(L.zmax, Math.max(L.zmin, v0.z * i.d / pinch.d0));
  const s = toSvg(i.x, i.y),
    g = geo();
  app.S.view = { ...v0, z, cx: pinch.p0.x - (s.x - g.mx - MW / 2) / z, cy: pinch.p0.y - (s.y - g.my - g.MH / 2) / z };
  clampView(app.S.view);
  renderView();
}

export function initEditorBedienung() {
  app.cv = $('canvas');
  const up = ev => {
    PTS.delete(ev.pointerId);
    if (pinch) {
      if (PTS.size < 2) {
        pinch = null;
        app.drag = null;
        app.cv.classList.remove('dragging');
        commit();
      }
      return;
    }
    endDrag(ev);
  };
  app.cv.addEventListener('pointerdown', ev => {
    if (!app.DATA) return;
    if (ev.pointerType === 'touch') {
      PTS.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (PTS.size === 2) {
        try {
          app.cv.setPointerCapture(ev.pointerId);
        } catch (e) {}
        startPinch();
        ev.preventDefault();
        return;
      }
      if (PTS.size > 2) return;
    }
    if (ev.button !== 0) return;
    // Markierung (Pin) anfassen und verschieben
    const pe = ev.target.closest && ev.target.closest('[data-pin]');
    if (pe && app.S.pins && app.S.pins[+pe.dataset.pin]) {
      const i = +pe.dataset.pin,
        m = svgToMap(toSvg(ev.clientX, ev.clientY));
      app.drag = { pin: i, dx: app.S.pins[i].x - m.x, dy: app.S.pins[i].y - m.y, x: ev.clientX, y: ev.clientY, moved: false };
      begin();
      try {
        app.cv.setPointerCapture(ev.pointerId);
      } catch (e) {}
      ev.preventDefault();
      return;
    }
    app.drag = {
      x: ev.clientX,
      y: ev.clientY,
      t: ev.target,
      moved: false,
      multi: ev.shiftKey || ev.ctrlKey || ev.metaKey,
      v0: {
        ...app.S.view
      }
    };
    try {
      app.cv.setPointerCapture(ev.pointerId);
    } catch (e) {}
    // Beim Sternenhimmel gibt es nichts zu verschieben (der Himmel hängt an Ort und Zeit)
    if (app.tool === 'move' && (app.S.motif === 'sterne' || app.S.motif === 'koord' || app.S.motif === 'wolke' || (app.S.multi && app.S.multi.on))) {
      app.drag = null;
      return;
    }
    if (app.tool === 'move') {
      begin();
      app.cv.classList.add('dragging');
    }
    ev.preventDefault();
  });
  app.cv.addEventListener('pointermove', ev => {
    if (PTS.has(ev.pointerId)) PTS.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pinch) {
      if (PTS.size >= 2 && pinch.v0) movePinch();
      return;
    }
    if (!app.drag) return;
    const dx = ev.clientX - app.drag.x,
      dy = ev.clientY - app.drag.y;
    if (!app.drag.moved && Math.hypot(dx, dy) > 4) app.drag.moved = true;
    if (!app.drag.moved) return;
    if (app.drag.pin != null) {
      const m = svgToMap(toSvg(ev.clientX, ev.clientY)),
        P = app.S.pins[app.drag.pin],
        vr = visRect();
      P.x = Math.min(vr[2], Math.max(vr[0], m.x + app.drag.dx));
      P.y = Math.min(vr[3], Math.max(vr[1], m.y + app.drag.dy));
      render();
      return;
    }
    if (app.tool === 'move') {
      const a = toSvg(app.drag.x, app.drag.y),
        b = toSvg(ev.clientX, ev.clientY);
      app.S.view = {
        ...app.drag.v0,
        cx: app.drag.v0.cx - (b.x - a.x) / app.drag.v0.z,
        cy: app.drag.v0.cy - (b.y - a.y) / app.drag.v0.z
      };
      clampView(app.S.view);
      renderView();
      return;
    }
    const m = $('marq');
    m.style.display = 'block';
    m.style.left = Math.min(ev.clientX, app.drag.x) + 'px';
    m.style.top = Math.min(ev.clientY, app.drag.y) + 'px';
    m.style.width = Math.abs(dx) + 'px';
    m.style.height = Math.abs(dy) + 'px';
  });
  app.cv.addEventListener('pointerup', up);
  app.cv.addEventListener('pointercancel', up);
  app.cv.addEventListener('wheel', ev => {
    if (!app.DATA || app.tool !== 'move' && !ev.ctrlKey || (app.S.motif === 'sterne' || app.S.motif === 'koord' || app.S.motif === 'wolke' || (app.S.multi && app.S.multi.on))) return;
    ev.preventDefault();
    const p = svgToMap(toSvg(ev.clientX, ev.clientY));
    const v = app.S.view;
    const f = Math.exp(-ev.deltaY * 0.0015);
    begin();
    const nz = v.z * f;
    const L = vLimits(v);
    const z = Math.min(L.zmax, Math.max(L.zmin, nz));
    app.S.view = {
      ...v,
      z,
      cx: p.x - (p.x - v.cx) * v.z / z,
      cy: p.y - (p.y - v.cy) * v.z / z
    };
    clampView(app.S.view);
    renderView();
    clearTimeout(app.cv._wt);
    app.cv._wt = setTimeout(commit, 350);
  }, {
    passive: false
  });
  $('toolSel').onclick = () => setTool('sel');
  $('toolMove').onclick = () => setTool('move');
  $('vZoom').addEventListener('input', e => {
    begin();
    app.S.view.z = sliderToZ(+e.target.value, app.S.view);
    clampView(app.S.view);
    render();
  });
  $('vZoom').addEventListener('change', () => commit());
  $('zIn').onclick = () => zStep(1.2);
  $('zOut').onclick = () => zStep(1 / 1.2);
  $('aspect2').addEventListener('change', e => change(() => {
    app.S.view.a = +e.target.value;
    clampView(app.S.view);
  }));
  $('vReset').onclick = () => change(() => {
    app.S.view = defView();
    clampView(app.S.view);
  });
  $('desel').onclick = () => {
    app.sel.clear();
    app.selCls = null;
    drawSel();
    panel();
  };
  
  /* ---------- Eigenschaften ---------- */
}

