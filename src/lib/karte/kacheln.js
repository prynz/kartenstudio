// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Vektorkacheln (OpenFreeMap) laden und dekodieren
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from '../editor/app.js';
import { KONFIG } from '../konfig.js';

export /* ---------- Vektorkacheln (OpenFreeMap, OpenMapTiles-Schema) ---------- */
function PB(buf) {
  this.b = buf;
  this.p = 0;
  this.e = buf.length;
}
PB.prototype.v = function () {
  let r = 0,
    s = 0,
    c;
  do {
    c = this.b[this.p++];
    if (s < 28) r |= (c & 0x7f) << s;else r += (c & 0x7f) * Math.pow(2, s);
    s += 7;
  } while (c & 0x80);
  return r >>> 0 === r ? r : r;
};
PB.prototype.vb = function () {
  let r = 0,
    m = 1,
    c;
  do {
    c = this.b[this.p++];
    r += (c & 0x7f) * m;
    m *= 128;
  } while (c & 0x80);
  return r;
};
PB.prototype.bytes = function () {
  const n = this.vb();
  const o = this.b.subarray(this.p, this.p + n);
  this.p += n;
  return o;
};
PB.prototype.skip = function (t) {
  if (t === 0) this.vb();else if (t === 1) this.p += 8;else if (t === 2) {
    const n = this.vb();
    this.p += n;
  } else if (t === 5) this.p += 4;
};
export const TD = new TextDecoder();
export function packed(u8) {
  const p = new PB(u8),
    a = [];
  while (p.p < p.e) a.push(p.vb());
  return a;
}
export function decodeValue(u8) {
  const p = new PB(u8);
  let v = null;
  while (p.p < p.e) {
    const k = p.vb(),
      f = k >> 3,
      t = k & 7;
    if (f === 1) v = TD.decode(p.bytes());else if (f === 2) {
      v = new DataView(p.b.buffer, p.b.byteOffset + p.p, 4).getFloat32(0, true);
      p.p += 4;
    } else if (f === 3) {
      v = new DataView(p.b.buffer, p.b.byteOffset + p.p, 8).getFloat64(0, true);
      p.p += 8;
    } else if (f === 4 || f === 5) v = p.vb();else if (f === 6) {
      const n = p.vb();
      v = n % 2 ? -(n + 1) / 2 : n / 2;
    } else if (f === 7) v = !!p.vb();else p.skip(t);
  }
  return v;
}
export function decodeTile(buf, want) {
  const p = new PB(new Uint8Array(buf)),
    layers = {};
  while (p.p < p.e) {
    const k = p.vb();
    if (k >> 3 === 3 && (k & 7) === 2) {
      const L = new PB(p.bytes());
      let name = '',
        ext = 4096;
      const feats = [],
        keys = [],
        vals = [];
      while (L.p < L.e) {
        const kk = L.vb(),
          f = kk >> 3,
          t = kk & 7;
        if (f === 1) name = TD.decode(L.bytes());else if (f === 2) feats.push(L.bytes());else if (f === 3) keys.push(TD.decode(L.bytes()));else if (f === 4) vals.push(decodeValue(L.bytes()));else if (f === 5) ext = L.vb();else L.skip(t);
      }
      if (!want.includes(name)) continue;
      layers[name] = {
        ext,
        features: feats.map(fb => {
          const F = new PB(fb);
          let id = null,
            tags = [],
            type = 0,
            geom = [];
          while (F.p < F.e) {
            const kk = F.vb(),
              f = kk >> 3,
              t = kk & 7;
            if (f === 1) id = F.vb();else if (f === 2) tags = packed(F.bytes());else if (f === 3) type = F.vb();else if (f === 4) geom = packed(F.bytes());else F.skip(t);
          }
          const props = {};
          for (let i = 0; i + 1 < tags.length; i += 2) props[keys[tags[i]]] = vals[tags[i + 1]];
          const rings = [];
          let x = 0,
            y = 0,
            cur = null,
            i = 0;
          while (i < geom.length) {
            const c = geom[i++],
              cmd = c & 7,
              n = c >> 3;
            if (cmd === 1 || cmd === 2) {
              for (let j = 0; j < n; j++) {
                const dx = geom[i++],
                  dy = geom[i++];
                x += dx >>> 1 ^ -(dx & 1);
                y += dy >>> 1 ^ -(dy & 1);
                if (cmd === 1) {
                  cur = [];
                  rings.push(cur);
                }
                cur.push(x, y);
              }
            } else if (cmd === 7) {
              if (cur) cur.closed = true;
            }
          }
          return {
            id,
            type,
            props,
            rings
          };
        })
      };
    } else p.skip(k & 7);
  }
  return layers;
}
export const TILECACHE = new Map();
export async function tileTemplate() {
  if (app.TILEURL) return app.TILEURL;
  const r = await fetch(KONFIG.tileJson);
  if (!r.ok) throw new Error('TileJSON HTTP ' + r.status);
  const j = await r.json();
  app.TILEURL = {
    url: j.tiles[0],
    maxz: Math.min(14, j.maxzoom || 14)
  };
  return app.TILEURL;
}
export function lon2t(lon, z) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, z));
}
export function lat2t(lat, z) {
  const s = Math.sin(lat * Math.PI / 180);
  return Math.floor((0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Math.pow(2, z));
}
export async function fetchTiles(big) {
  const T = await tileTemplate();
  // Große Gebiete (z. B. lange Routen): gröbere Kachelstufe, sonst würden es hunderte Kacheln
  let z = T.maxz;
  const count = zz => (lon2t(big.e, zz) - lon2t(big.w, zz) + 1) * (lat2t(big.s, zz) - lat2t(big.n, zz) + 1);
  while (z > 11 && count(z) > 100) z--;
  const x0 = lon2t(big.w, z),
    x1 = lon2t(big.e, z),
    y0 = lat2t(big.n, z),
    y1 = lat2t(big.s, z);
  const list = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) list.push({
    z,
    x,
    y
  });
  if (list.length > 160) throw new Error('Ausschnitt zu groß');
  const want = ['building', 'transportation', 'water', 'waterway', 'park', 'landcover'];
  let idx = 0;
  const out = [];
  async function worker() {
    while (idx < list.length) {
      const t = list[idx++];
      const key = t.z + '/' + t.x + '/' + t.y;
      if (!TILECACHE.has(key)) {
        const r = await fetch(T.url.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y));
        if (r.status === 204 || r.status === 404) {
          TILECACHE.set(key, {});
        } else {
          if (!r.ok) throw new Error('Kachel HTTP ' + r.status);
          TILECACHE.set(key, decodeTile(await r.arrayBuffer(), want));
        }
      }
      out.push({
        ...t,
        layers: TILECACHE.get(key)
      });
    }
  }
  await Promise.all(Array.from({
    length: Math.min(8, list.length)
  }, worker));
  return out;
}
export function classifyTile(layer, p, type) {
  if (layer === 'building') return type === 3 ? 'haus' : null;
  if (layer === 'transportation') {
    if (type !== 2 || p.brunnel === 'tunnel') return null;
    const c = p.class;
    if (/^(motorway|trunk|primary|secondary|tertiary)$/.test(c)) return 'haupt';
    if (/^(minor|service|raceway|busway)$/.test(c)) return 'neben';
    if (/^(track|path)$/.test(c)) return 'weg';
    if (/^(rail|transit)$/.test(c)) return 'bahn';
    return null;
  }
  if (layer === 'water') return type === 3 ? 'wasser' : null;
  if (layer === 'waterway') return type === 2 && p.brunnel !== 'tunnel' ? 'wasser' : null;
  if (layer === 'park') return type === 3 ? 'gruen' : null;
  if (layer === 'landcover') return type === 3 && /^(wood|grass|wetland)$/.test(p.class) ? 'gruen' : null;
  return null;
}
