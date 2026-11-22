// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Ortssuche (Photon-Geocoder)
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { $, esc } from '../editor/basis.js';
import { KONFIG } from '../konfig.js';

export function attachSearch(inp, btn, box, onPick) {
  async function run() {
    const q = $(inp).value.trim();
    if (!q) return;
    const R = $(box);
    R.classList.remove('hidden');
    R.innerHTML = '<div class="info">Suche …</div>';
    try {
      const r = await fetch(KONFIG.geocoder + '?lang=de&limit=6&q=' + encodeURIComponent(q));
      const j = await r.json();
      R.innerHTML = '';
      if (!j.features || !j.features.length) {
        R.innerHTML = '<div class="info">Nichts gefunden. Versuche Ort und Gemeinde, z. B. „Siegritz Heiligenstadt“.</div>';
        return;
      }
      j.features.forEach(f => {
        const p = f.properties;
        const b = document.createElement('button');
        const sub = [p.city && p.city !== p.name ? p.city : '', p.county, p.state, p.country].filter(Boolean).join(', ');
        b.innerHTML = `<b>${esc(p.name || '(ohne Namen)')}</b><small>${esc(sub)}</small>`;
        b.onclick = () => {
          R.classList.add('hidden');
          onPick(f, q);
        };
        R.appendChild(b);
      });
    } catch (e) {
      R.innerHTML = '<div class="info" style="color:var(--err)">Keine Verbindung zum Suchdienst. Ist das Internet da? Falls du die Datei in einer App-Vorschau geöffnet hast: Die blockiert Internetzugriffe – öffne sie im Browser (Chrome, Safari, Edge).</div>';
    }
  }
  $(btn).onclick = run;
  $(inp).addEventListener('keydown', e => {
    if (e.key === 'Enter') run();
    if (e.key === 'Escape') $(box).classList.add('hidden');
  });
  document.addEventListener('pointerdown', e => {
    if (!$(box).contains(e.target) && e.target !== $(inp) && e.target !== $(btn)) $(box).classList.add('hidden');
  });
  return run;
}
