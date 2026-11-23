// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Kacheln/Overpass-Daten in Poster-Koordinaten umrechnen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { MW } from '../editor/basis.js';
import { classify, merc } from './overpass.js';
import { classifyTile } from './kacheln.js';

/**
 * Fluss-Mittellinien, die mitten in einer Wasserfläche liegen (z. B. der Rhein quer durch den
 * Bodensee), weglassen – die Fläche zeigt das Wasser schon; die Linie wirkte wie ein Strich im See.
 * Geprüft an drei Stellen der Linie (20 %, 50 %, 80 %): nur wenn alle im Wasser liegen, fällt sie weg.
 */
function ohneSeeLinien(feats) {
  const flaechen = feats.filter(f => f.k === 'wasser' && f.a && f.d);
  if (!flaechen.length) return feats;
  const poly = flaechen.map(f => ({
    bx: f.bx,
    ringe: f.d.split('M').filter(Boolean).map(r => (r.match(/-?\d+(?:\.\d+)?/g) || []).map(Number))
  }));
  const imRing = (r, x, y) => {
    let c = false;
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const imWasser = (x, y) => poly.some(P => x >= P.bx[0] && x <= P.bx[2] && y >= P.bx[1] && y <= P.bx[3] && P.ringe.reduce((c, r) => (imRing(r, x, y) ? !c : c), false));
  return feats.filter(f => {
    if (f.k !== 'wasser' || f.a || !f.pts || f.pts.length < 4) return true;
    const n = f.pts.length / 2;
    return ![0.2, 0.5, 0.8].every(q => {
      const j = Math.floor(q * (n - 1)) * 2;
      return imWasser(f.pts[j], f.pts[j + 1]);
    });
  });
}
export function buildDataTiles(tiles, b, big, place) {
  const [x0, y0] = merc(b.w, b.n),
    [x1, y1] = merc(b.e, b.s);
  const sc = MW / (x1 - x0);
  const MH = (y1 - y0) * sc;
  const [ex0, ey0] = merc(big.w, big.n),
    [ex1, ey1] = merc(big.e, big.s);
  const feats = [],
    tileRects = [];
  let n = 0;
  tiles.forEach((t, ti) => {
    const Z = Math.pow(2, t.z);
    tileRects.push([(t.x / Z - x0) * sc, (t.y / Z - y0) * sc, sc / Z]);
    Object.entries(t.layers || {}).forEach(([lname, L]) => {
      const f = 1 / (L.ext * Z);
      L.features.forEach(ft => {
        const k = classifyTile(lname, ft.props, ft.type);
        if (!k) return;
        let d = '',
          pts = [],
          bx = [1e9, 1e9, -1e9, -1e9];
        ft.rings.forEach(r => {
          for (let i = 0; i < r.length; i += 2) {
            const X = ((t.x + r[i] / L.ext) / Z - x0) * sc,
              Y = ((t.y + r[i + 1] / L.ext) / Z - y0) * sc;
            d += (i ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
            pts.push(X, Y);
            if (X < bx[0]) bx[0] = X;
            if (Y < bx[1]) bx[1] = Y;
            if (X > bx[2]) bx[2] = X;
            if (Y > bx[3]) bx[3] = Y;
          }
          if (ft.type === 3) d += 'Z';
        });
        if (!d) return;
        const fid = 'f' + n++;
        const gid = lname === 'building' && ft.id != null ? 'b' + ft.id : fid;
        feats.push({
          id: gid,
          fid,
          k,
          a: ft.type === 3,
          d,
          pts,
          bx,
          t: ti,
          // Gebäudehöhe in Metern (für 3D-Häuser)
          h: lname === 'building' ? +ft.props.render_height || 0 : 0
        });
      });
    });
  });
  const E = [(ex0 - x0) * sc, (ey0 - y0) * sc, (ex1 - x0) * sc, (ey1 - y0) * sc];
  return {
    feats: ohneSeeLinien(feats),
    tiles: tileRects,
    MH0: MH,
    ext: {
      x0: E[0],
      y0: E[1],
      x1: E[2],
      y1: E[3]
    },
    proj: {
      x0,
      y0,
      sc
    },
    place: place.name,
    region: place.region,
    center: place.center,
    src: 'tiles'
  };
}
/** Gebäudehöhe aus OSM-Merkmalen (Meter), 0 = unbekannt */
function hoehe(tags) {
  const h = parseFloat(tags.height);
  if (h > 0) return h;
  const l = parseFloat(tags['building:levels']);
  return l > 0 ? l * 3 + 2 : 0;
}
export function buildData(osm, b, big, place) {
  const [x0, y0] = merc(b.w, b.n),
    [x1, y1] = merc(b.e, b.s);
  const sc = MW / (x1 - x0);
  const MH = (y1 - y0) * sc;
  const Pn = (lon, lat) => {
    const [x, y] = merc(lon, lat);
    return [(x - x0) * sc, (y - y0) * sc];
  };
  const [ex0, ey0] = Pn(big.w, big.n),
    [ex1, ey1] = Pn(big.e, big.s);
  const feats = [];
  const mk = (rings, closeAll) => {
    let d = '',
      pts = [],
      bx = [1e9, 1e9, -1e9, -1e9];
    rings.forEach(g => {
      g.forEach((p, i) => {
        const [x, y] = Pn(p.lon, p.lat);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        pts.push(x, y);
        if (x < bx[0]) bx[0] = x;
        if (y < bx[1]) bx[1] = y;
        if (x > bx[2]) bx[2] = x;
        if (y > bx[3]) bx[3] = y;
      });
      if (closeAll) d += 'Z';
    });
    return {
      d,
      pts,
      bx
    };
  };
  (osm.elements || []).forEach(el => {
    const k = classify(el.tags);
    if (!k) return;
    if (el.type === 'way' && el.geometry && el.geometry.length > 1) {
      const g = el.geometry;
      const closed = g.length > 3 && g[0].lat === g[g.length - 1].lat && g[0].lon === g[g.length - 1].lon;
      const area = k === 'haus' || k === 'gruen' || k === 'wasser' && el.tags.natural === 'water';
      const r = mk([g], area && closed);
      feats.push({
        id: 'w' + el.id,
        fid: 'w' + el.id,
        k,
        a: area,
        t: -1,
        h: k === 'haus' ? hoehe(el.tags) : 0,
        ...r
      });
    } else if (el.type === 'relation' && el.members) {
      const rings = el.members.filter(m => m.geometry && m.geometry.length > 1 && (m.role === 'outer' || m.role === 'inner' || m.role === '')).map(m => m.geometry);
      if (rings.length) {
        const r = mk(rings, true);
        feats.push({
          id: 'r' + el.id,
          fid: 'r' + el.id,
          k,
          a: true,
          t: -1,
          ...r
        });
      }
    }
  });
  return {
    feats,
    tiles: [],
    MH0: MH,
    ext: {
      x0: ex0,
      y0: ey0,
      x1: ex1,
      y1: ey1
    },
    proj: {
      x0,
      y0,
      sc
    },
    place: place.name,
    region: place.region,
    center: place.center,
    src: 'overpass'
  };
}
