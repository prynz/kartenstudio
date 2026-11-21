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
  // Rand um das Poster: am Handy knapper, damit es den Platz über der Einstellungs-Leiste nutzt
  const narrow = matchMedia('(max-width: 900px)').matches;
  const B = document.body.classList;
  const dock = !B.contains('wiz-on') && !(narrow && B.contains('sheet-big'));
  const padX = narrow ? 32 : 80,
    padY = narrow ? (dock ? 78 : 26) : dock ? 136 : 80;
  const base = Math.max(narrow ? 60 : 240, Math.min(c.clientWidth - padX, (c.clientHeight - padY) * g.W / g.H));
  app.poster.style.width = base * z + 'px';
  // Ecken des Schattens an die Rahmenrundung anpassen
  const R = Math.max(0, app.S.frame.r) + app.S.frame.w / 2;
  app.poster.style.borderRadius = R > 0.5 ? (R * base * z / g.W).toFixed(1) + 'px' : '0';
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
    // Vorschau-Hintergrund wird im Poster in Rahmenform gezeichnet (siehe render), nicht als Rechteck dahinter
    c.classList.toggle('checker', b.dataset.bg === 'checker');
    app.previewBg = b.dataset.bg;
    render();
  });
  window.addEventListener('resize', zoom);
  $('zoom').addEventListener('input', zoom);
}

