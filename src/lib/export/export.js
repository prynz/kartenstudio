// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Export als SVG und PNG
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from '../editor/app.js';
import { $ } from '../editor/basis.js';
import { buildSVG, geo } from '../editor/zeichnen.js';
import { msg } from '../editor/ansicht.js';

export /* ---------- Export ---------- */
function fileBase() {
  return ('Karte_' + (app.DATA.place || 'Ort')).replace(/[^\wäöüÄÖÜß-]+/g, '_');
}
export async function download(name, blob) {
  dlPlain(name, blob);
  return true;
}
export function dlPlain(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 2000);
}
export async function renderPNG(W) {
  const svg = buildSVG(true),
    g = geo(),
    H = Math.round(W * g.H / g.W);
  const url = URL.createObjectURL(new Blob([svg], {
    type: 'image/svg+xml'
  }));
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  try {
    await img.decode();
  } catch (e) {}
  await new Promise(r => setTimeout(r, 150));
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  cv.getContext('2d').drawImage(img, 0, 0, W, H);
  URL.revokeObjectURL(url);
  return cv;
}

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initExportExport() {
  $('dlBtn').onclick = e => {
    e.stopPropagation();
    $('dlPop').classList.toggle('hidden');
  };
  document.addEventListener('pointerdown', e => {
    if (!$('dlPop').contains(e.target) && e.target !== $('dlBtn') && !$('dlBtn').contains(e.target)) $('dlPop').classList.add('hidden');
  });
  document.querySelectorAll('#dlFmt button').forEach(b => b.onclick = () => {
    app.dlF = b.dataset.f;
    document.querySelectorAll('#dlFmt button').forEach(x => x.classList.toggle('on', x === b));
    $('dlSizeRow').classList.toggle('hidden', app.dlF !== 'png');
  });
  $('dlGo').onclick = async () => {
    if (app.dlF === 'svg') {
      if (await download(fileBase() + '.svg', new Blob([buildSVG(true)], {
        type: 'image/svg+xml'
      }))) msg('SVG heruntergeladen', 'ok');
      $('dlPop').classList.add('hidden');
      return;
    }
    $('dlGo').disabled = true;
    $('dlGo').textContent = 'Wird erstellt …';
    try {
      const cv = await renderPNG(+$('pngW').value);
      const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
      if (await download(fileBase() + '.png', blob)) msg('PNG heruntergeladen – transparenter Hintergrund', 'ok');
      $('dlPop').classList.add('hidden');
    } catch (e) {
      msg('PNG konnte nicht erstellt werden', 'err');
    }
    $('dlGo').disabled = false;
    $('dlGo').textContent = 'Datei erstellen';
  };
}

