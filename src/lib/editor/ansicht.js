// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Undo/Redo-Knöpfe, Tastenkürzel, Vorschau-Hintergründe, Zoom, Meldungen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $ } from './basis.js';
import { drawSel, geo, render } from './zeichnen.js';
import { mapSel, panel } from './seitenleiste.js';
import { setTool } from './bedienung.js';
import { snap, updUndo } from './zustand.js';

export function zoom() {
  if (!app.DATA) return;
  const z = +$('zoom').value / 100;
  const g = geo(),
    c = $('canvas');
  const base = Math.max(240, Math.min(c.clientWidth - 80, (c.clientHeight - 136) * g.W / g.H));
  app.poster.style.width = base * z + 'px';
}
export function msg(t, c) {
  const m = $('msg');
  m.textContent = t;
  m.className = 'toast' + (t ? ' show' : '') + (c === 'err' ? ' err' : '');
  $('msg2').textContent = c === 'err' ? t : '';
  clearTimeout(app.msgT);
  if (t && c !== 'busy') app.msgT = setTimeout(() => {
    m.className = 'toast';
  }, 2600);
}

/* ---------- Export ---------- */

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorAnsicht() {
  $('undo').onclick = () => {
    if (!app.undoS.length) return;
    app.redoS.push(snap());
    app.S = JSON.parse(app.undoS.pop());
    updUndo();
    render();
  };
  $('redo').onclick = () => {
    if (!app.redoS.length) return;
    app.undoS.push(snap());
    app.S = JSON.parse(app.redoS.pop());
    updUndo();
    render();
  };
  document.addEventListener('keydown', e => {
    if (!app.DATA || !$('picker').classList.contains('hidden')) return;
    if (e.target.tagName === 'INPUT' && e.target.type === 'text' || e.target.tagName === 'SELECT') return;
    if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'v') {
      setTool('sel');
      return;
    }
    if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'h') {
      setTool('move');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? $('redo').click() : $('undo').click();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      $('redo').click();
    } else if (e.key === 'Escape') {
      app.sel.clear();
      app.selCls = null;
      drawSel();
      panel();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && (mapSel().length || app.selCls)) {
      e.preventDefault();
      $('mHide').click();
    }
  });
  document.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => {
    const c = $('canvas');
    document.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.bg === 'checker') {
      c.classList.add('checker');
      app.poster.style.background = '';
    } else {
      c.classList.remove('checker');
      app.poster.style.background = b.dataset.bg;
    }
  });
  window.addEventListener('resize', zoom);
  $('zoom').addEventListener('input', zoom);
}

