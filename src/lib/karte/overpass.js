// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Rückfall: Daten live von Overpass laden
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { meters } from './ortswahl.js';

export const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
export const CACHE = [];
export
// {bb:{w,e,n,s}, osm}
function inside(b, c) {
  return b.w >= c.w && b.e <= c.e && b.s >= c.s && b.n <= c.n;
}
export function expand(b, f) {
  const dx = (b.e - b.w) * f,
    dy = (b.n - b.s) * f;
  return {
    w: b.w - dx,
    e: b.e + dx,
    s: b.s - dy,
    n: b.n + dy
  };
}
export function qOne(url, q, signal) {
  return fetch(url, {
    method: 'POST',
    body: 'data=' + encodeURIComponent(q),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    signal
  }).then(async r => {
    if (!r.ok) throw new Error(r.status === 429 ? 'ausgelastet' : r.status === 504 ? 'Zeitüberschreitung' : 'HTTP ' + r.status);
    const j = await r.json();
    if (j && j.remark && /runtime error|timed out|out of memory/i.test(j.remark) && !(j.elements || []).length) throw new Error('Zeitüberschreitung');
    return j;
  });
}
export async function fetchOSM(b) {
  const hit = CACHE.find(c => inside(b, c.bb));
  if (hit) return hit;
  const mw = meters(b).w;
  const big = expand(b, mw < 1500 ? 0.3 : mw < 3000 ? 0.2 : 0.1);
  const bb = `${big.s.toFixed(6)},${big.w.toFixed(6)},${big.n.toFixed(6)},${big.e.toFixed(6)}`;
  const q = `[out:json][timeout:90][maxsize:134217728][bbox:${bb}];(way["building"];relation["building"];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|residential|unclassified|living_street|service|road|pedestrian|track|path|footway|cycleway|bridleway|steps)$"];way["waterway"];way["natural"="water"];relation["natural"="water"];way["railway"~"^(rail|light_rail|narrow_gauge)$"];way["leisure"="park"];way["landuse"~"^(forest|grass|meadow|recreation_ground|village_green)$"];way["natural"~"^(wood|scrub|grassland)$"];relation["landuse"="forest"];relation["natural"="wood"];);out geom qt;`;
  const ctrls = [],
    errs = [];
  let done = false;
  try {
    const osm = await new Promise((resolve, reject) => {
      let started = 0,
        failed = 0;
      const timers = [];
      const start = () => {
        if (done || started >= OVERPASS.length) return;
        const i = started++;
        const c = new AbortController();
        ctrls.push(c);
        const to = setTimeout(() => c.abort(), 150000);
        qOne(OVERPASS[i], q, c.signal).then(j => {
          clearTimeout(to);
          if (!done) {
            done = true;
            resolve(j);
          }
        }).catch(e => {
          clearTimeout(to);
          errs.push(OVERPASS[i].split('/')[2] + ': ' + (e.name === 'AbortError' ? 'keine Antwort nach 2,5 Minuten' : e.message === 'Failed to fetch' ? 'nicht erreichbar' : e.message));
          failed++;
          if (!done) {
            if (failed >= OVERPASS.length) {
              done = true;
              reject(new Error(errs.join(' · ')));
            } else start();
          }
        });
      };
      start();
      timers.push(setTimeout(start, 8000), setTimeout(start, 16000));
    });
    ctrls.forEach(c => {
      try {
        c.abort();
      } catch (e) {}
    });
    const res = {
      bb: big,
      osm
    };
    CACHE.unshift(res);
    if (CACHE.length > 6) CACHE.pop();
    return res;
  } finally {
    done = true;
  }
}
export function classify(t) {
  if (!t) return null;
  if (t.building) return 'haus';
  const h = t.highway;
  if (h) {
    if (/^(motorway|trunk|primary|secondary|tertiary)(_link)?$/.test(h)) return 'haupt';
    if (/^(residential|unclassified|living_street|service|road|pedestrian)$/.test(h)) return 'neben';
    if (/^(track|path|footway|cycleway|bridleway|steps)$/.test(h)) return 'weg';
    return null;
  }
  if (t.waterway || t.natural === 'water') return 'wasser';
  if (t.railway) return 'bahn';
  if (t.leisure === 'park' || /^(forest|grass|meadow|recreation_ground|village_green)$/.test(t.landuse || '') || /^(wood|scrub|grassland)$/.test(t.natural || '')) return 'gruen';
  return null;
}
export function merc(lon, lat) {
  const x = (lon + 180) / 360;
  const s = Math.sin(lat * Math.PI / 180);
  const y = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
  return [x, y];
}
/* ---------- Vektorkacheln (OpenFreeMap, OpenMapTiles-Schema) ---------- */
