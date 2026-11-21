// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Farben tauschen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, hex } from './basis.js';
import { change, eff } from './zustand.js';
import { msg } from './ansicht.js';

export function usedColors() {
  const m = new Map();
  const add = c => {
    if (!c || c === 'none') return;
    c = hex(c);
    m.set(c, (m.get(c) || 0) + 1);
  };
  app.DATA.feats.forEach(f => {
    const e = eff(f);
    if (!e.h) {
      add(e.s);
      if (f.a) add(e.f);
    }
  });
  add(app.S.frame.color);
  if (app.S.bar.on) add(app.S.bar.color);
  add(app.S.title.color);
  add(app.S.sub.color);
  add(app.S.bg);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
export function fillReplace() {
  const s = $('rOld'),
    cur = s.value;
  s.innerHTML = '';
  usedColors().forEach(([c, n]) => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = `${c} (${n}×)`;
    s.appendChild(o);
  });
  if ([...s.options].some(o => o.value === cur)) s.value = cur;
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorFarben() {
  $('rGo').onclick = () => {
    const a = $('rOld').value,
      b = $('rNew').value;
    if (!a) return;
    change(() => {
      Object.values(app.S.cls).forEach(c => {
        if (hex(c.s) === a) c.s = b;
        if (c.f !== 'none' && hex(c.f) === a) c.f = b;
      });
      Object.values(app.S.ov).forEach(o => {
        if (o.s && hex(o.s) === a) o.s = b;
        if (o.f && o.f !== 'none' && hex(o.f) === a) o.f = b;
      });
      if (hex(app.S.frame.color) === a) app.S.frame.color = b;
      if (hex(app.S.bar.color) === a) app.S.bar.color = b;
      ['title', 'sub'].forEach(k => {
        if (hex(app.S[k].color) === a) app.S[k].color = b;
      });
      if (app.S.bg !== 'none' && hex(app.S.bg) === a) app.S.bg = b;
    });
    msg(`${a} wurde durch ${b} ersetzt.`, 'ok');
  };
}

