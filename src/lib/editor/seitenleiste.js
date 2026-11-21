// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Seitenleiste: Eigenschaften und Schritte 01–06
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { animateSections } from './animation.js';
import { revealSection } from './sheet.js';
import { $, CLS, SWATCH, hex } from './basis.js';
import { BASES } from '../themen/standard.js';
import { PRESETS } from '../themen/vorlagen.js';
import { begin, change, clampView, commit, eff, newState } from './zustand.js';
import { ensureRaster } from '../karte/raster.js';
import { feat, geo, render } from './zeichnen.js';
import { fillReplace } from './farben.js';

export /* ---------- Eigenschaften ---------- */
function mapSel() {
  return [...app.sel].filter(id => feat(id));
}
export function setVal(id, v) {
  const e = $(id);
  e.value = v;
  const o = $(id + 'v');
  if (o) o.textContent = (+v).toFixed(e.step && +e.step < 1 ? +e.step < 0.1 ? 2 : 1 : 0);
}
export function panel() {
  if (!app.S) return;
  const m = mapSel();
  const showMap = app.selCls || m.length;
  $('pMap').classList.toggle('hidden', !showMap);
  $('selhint').classList.toggle('hidden', !!showMap);
  if (showMap) {
    const e = app.selCls ? app.S.cls[app.selCls] : eff(feat(m[0]));
    $('mStroke').value = hex(e.s);
    $('mFillOn').checked = e.f !== 'none';
    $('mFill').value = e.f !== 'none' ? hex(e.f) : hex(e.s);
    setVal('mW', e.w);
  }
  document.querySelectorAll('#grpbtns .chip').forEach(c => c.classList.toggle('on', c.dataset.k === app.selCls));
  $('bgOn').checked = app.S.bg !== 'none';
  $('bgColor').value = app.S.bg !== 'none' ? hex(app.S.bg) : '#ffffff';
  $('fColor').value = hex(app.S.frame.color);
  setVal('fW', app.S.frame.w);
  setVal('fR', app.S.frame.r);
  setVal('fP', app.S.frame.pad);
  $('bColor').value = hex(app.S.bar.color);
  setVal('bH', geo().barH);
  $('bAuto').checked = app.S.bar.auto;
  setVal('bGap', app.S.bar.gap);
  $('bOn').checked = app.S.bar.on;
  const t = app.S[app.curText];
  $('tabTitle').classList.toggle('on', app.curText === 'title');
  $('tabSub').classList.toggle('on', app.curText === 'sub');
  if (document.activeElement !== $('tText')) $('tText').value = t.text;
  $('tFont').value = t.font;
  setVal('tSize', t.size);
  setVal('tLs', t.ls);
  $('tColor').value = hex(t.color);
  $('tOn').checked = t.on;
  setVal('gScale', app.S.scale);
  $('attrOn').checked = app.S.attr.on;
  const std = app.S.mode === 'std';
  document.querySelectorAll('#modeTabs button').forEach(b => b.classList.toggle('on', b.dataset.m === app.S.mode));
  $('artBox').classList.toggle('hidden', std);
  $('stdBox').classList.toggle('hidden', !std);
  document.querySelectorAll('#styles button').forEach(b => b.classList.toggle('on', !std && b.dataset.p === app.S.preset));
  document.querySelectorAll('#bases button').forEach(b => b.classList.toggle('on', std && b.dataset.b === app.S.base));
  $('themeDesc').textContent = PRESETS[app.S.preset].desc || '';
  $('labelsOn').checked = app.S.labels;
  CUST.forEach(([id, get]) => {
    if (document.activeElement !== $(id)) $(id).value = hex(get() === 'none' ? '#ffffff' : get());
  });
  $('elArt').classList.toggle('hidden', std);
  $('elStd').classList.toggle('hidden', !std);
  document.querySelectorAll('#fmt2 button').forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.a - app.S.view.a) < 0.01));
  // Zusammenfassungen
  $('sumA').textContent = (([...document.querySelectorAll('#fmt2 button')].find(b => Math.abs(+b.dataset.a - app.S.view.a) < 0.01) || {}).textContent || '') + (app.S.view.z > 1.01 ? ` · ${app.S.view.z.toFixed(1)}×` : '');
  $('sumS').textContent = std ? 'Standard · ' + BASES[app.S.base].name : PRESETS[app.S.preset].name;
  $('sumE').textContent = app.selCls ? `Alle ${CLS[app.selCls]}` : m.length ? `${m.length} ausgewählt` : '';
  $('sumR').textContent = (app.S.frame.r > 0 ? 'abgerundet' : 'eckig') + (app.S.bar.on ? ' · mit Balken' : '');
  $('sumT').textContent = app.S.title.on ? app.S.title.text : '';
  fillReplace();
}
export function textKey() {
  return app.curText;
}
export function openSec(name) {
  animateSections(() => document.querySelectorAll('.sec').forEach(x => x.classList.toggle('open', x.dataset.s === name)));
  revealSection(document.querySelector(`.sec[data-s="${name}"]`));
}
export function setMap(prop, val) {
  if (app.selCls) {
    app.S.cls[app.selCls][prop] = val;
    app.DATA.feats.forEach(f => {
      if (f.k === app.selCls && app.S.ov[f.id]) delete app.S.ov[f.id][prop];
    });
  } else mapSel().forEach(id => {
    (app.S.ov[id] = app.S.ov[id] || {})[prop] = val;
  });
}
export function live(id, fn) {
  const e = $(id);
  e.addEventListener('input', () => {
    begin();
    fn(e);
    render();
  });
  e.addEventListener('change', () => commit());
}
export function dms(v, pos, neg) {
  const s = v < 0 ? neg : pos;
  v = Math.abs(v);
  const d = Math.floor(v),
    m = Math.floor((v - d) * 60),
    sec = Math.round(((v - d) * 60 - m) * 60);
  return `${d}° ${String(m).padStart(2, '0')}′ ${String(sec).padStart(2, '0')}″ ${s}`;
}
export function viewCenterLL() {
  const p = app.DATA.proj,
    v = app.S.view;
  const x = v.cx / p.sc + p.x0,
    y = v.cy / p.sc + p.y0;
  return [x * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180 / Math.PI];
}
export const dotsHTML = d => `<span class="dots">${d.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
export const CUST = [['cBg', () => app.S.bg, v => {
  app.S.bg = v;
}], ['cHaus', () => app.S.cls.haus.f !== 'none' ? app.S.cls.haus.f : app.S.cls.haus.s, v => {
  if (app.S.cls.haus.f !== 'none') app.S.cls.haus.f = v;else app.S.cls.haus.s = v;
}], ['cHausL', () => app.S.cls.haus.s, v => {
  app.S.cls.haus.s = v;
}], ['cHaupt', () => app.S.cls.haupt.s, v => {
  app.S.cls.haupt.s = v;
}], ['cNeben', () => app.S.cls.neben.s, v => {
  app.S.cls.neben.s = v;
  app.S.cls.weg.s = v;
}], ['cWasser', () => app.S.cls.wasser.f !== 'none' ? app.S.cls.wasser.f : app.S.cls.wasser.s, v => {
  app.S.cls.wasser.f = v;
  app.S.cls.wasser.s = v;
}], ['cGruen', () => app.S.cls.gruen.f !== 'none' ? app.S.cls.gruen.f : app.S.cls.gruen.s, v => {
  app.S.cls.gruen.f = v;
  app.S.cls.gruen.s = v;
  app.S.cls.gruen.h = false;
}]];

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorSeitenleiste() {
  document.querySelectorAll('.sec>.sh').forEach(h => h.onclick = () => {
    const sec = h.parentElement;
    const was = sec.classList.contains('open');
    animateSections(() => {
      document.querySelectorAll('.sec').forEach(x => x.classList.remove('open'));
      if (!was) sec.classList.add('open');
    });
    if (!was) revealSection(sec);
  });
  $('tabTitle').onclick = () => {
    app.curText = 'title';
    panel();
  };
  $('tabSub').onclick = () => {
    app.curText = 'sub';
    panel();
  };
  document.querySelectorAll('#fmt2 button').forEach(b => b.onclick = () => change(() => {
    app.S.view.a = +b.dataset.a;
    clampView(app.S.view);
  }));
  live('mStroke', e => setMap('s', e.value));
  live('mFill', e => {
    $('mFillOn').checked = true;
    setMap('f', e.value);
  });
  $('mFillOn').addEventListener('change', e => change(() => setMap('f', e.target.checked ? $('mFill').value : 'none')));
  live('mW', e => setMap('w', +e.value));
  $('mHide').onclick = () => change(() => setMap('h', true));
  $('mShow').onclick = () => change(() => setMap('h', false));
  $('bgOn').addEventListener('change', e => change(() => app.S.bg = e.target.checked ? $('bgColor').value : 'none'));
  live('bgColor', e => {
    $('bgOn').checked = true;
    app.S.bg = e.value;
  });
  live('fColor', e => app.S.frame.color = e.value);
  live('fW', e => app.S.frame.w = +e.value);
  live('fR', e => app.S.frame.r = +e.value);
  live('fP', e => app.S.frame.pad = +e.value);
  live('bColor', e => app.S.bar.color = e.value);
  live('bH', e => {
    app.S.bar.auto = false;
    app.S.bar.h = +e.value;
  });
  live('bGap', e => app.S.bar.gap = +e.value);
  $('bAuto').addEventListener('change', e => change(() => {
    app.S.bar.auto = e.target.checked;
    if (!app.S.bar.auto) app.S.bar.h = geo().barH;
  }));
  $('bOn').addEventListener('change', e => change(() => app.S.bar.on = e.target.checked));
  live('tText', e => {
    const k = textKey();
    if (k) app.S[k].text = e.value;
  });
  $('tFont').addEventListener('change', e => change(() => {
    const k = textKey();
    if (k) app.S[k].font = e.target.value;
  }));
  live('tSize', e => {
    const k = textKey();
    if (k) app.S[k].size = +e.value;
  });
  live('tLs', e => {
    const k = textKey();
    if (k) app.S[k].ls = +e.value;
  });
  live('tColor', e => {
    const k = textKey();
    if (k) app.S[k].color = e.value;
  });
  $('tOn').addEventListener('change', e => change(() => {
    const k = textKey();
    if (k) app.S[k].on = e.target.checked;
  }));
  $('tCoord').onclick = () => {
    const k = textKey();
    if (!k || !app.DATA) return;
    const [lon, lat] = viewCenterLL();
    change(() => {
      app.S[k].text = dms(lat, 'N', 'S') + '\u2003\u2003' + dms(lon, 'E', 'W');
      if (app.S[k].font === 'SgFR') {
        app.S[k].font = 'SgMD';
        app.S[k].size = 26;
        app.S[k].ls = 2;
      }
    });
  };
  live('gScale', e => app.S.scale = +e.value);
  $('attrOn').addEventListener('change', e => change(() => app.S.attr.on = e.target.checked));
  document.querySelectorAll('.sw').forEach(box => {
    SWATCH.forEach(c => {
      const s = document.createElement('span');
      s.style.background = c;
      s.title = c;
      s.onclick = () => {
        const inp = $(box.dataset.for);
        inp.value = c;
        inp.dispatchEvent(new Event('input'));
        inp.dispatchEvent(new Event('change'));
      };
      box.appendChild(s);
    });
  });
  Object.entries(PRESETS).forEach(([k, p]) => {
    const b = document.createElement('button');
    b.dataset.p = k;
    b.title = p.desc || '';
    b.innerHTML = `<div class="th" style="background:${p.bg === 'none' ? '#fff' : p.bg}"></div><span class="nm">${p.name}</span>`;
    b.onclick = () => change(() => {
      const keep = app.S;
      app.S = newState(k, keep);
      app.S.mode = 'art';
    });
    $('styles').appendChild(b);
  });
  Object.entries(BASES).forEach(([k, p]) => {
    const b = document.createElement('button');
    b.dataset.b = k;
    b.innerHTML = `${dotsHTML(p.dots)}<span class="nm">${p.name}</span>`;
    b.onclick = () => {
      change(() => {
        app.S.mode = 'std';
        app.S.base = k;
      });
      ensureRaster();
    };
    $('bases').appendChild(b);
  });
  document.querySelectorAll('#modeTabs button').forEach(b => b.onclick = () => {
    change(() => {
      app.S.mode = b.dataset.m;
    });
    if (app.S.mode === 'std') ensureRaster();
  });
  $('labelsOn').addEventListener('change', e => {
    change(() => app.S.labels = e.target.checked);
    ensureRaster();
  });
  CUST.forEach(([id,, set]) => live(id, e => set(e.value)));
  /* ---------- Standard-Karte als Bild rendern ---------- */
}

