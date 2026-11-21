// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Poster-Geometrie, SVG bauen, zeichnen, Auswahl anzeigen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, CAP, CLS, CLS1, FONTDATA, MW, NS, ORDER, esc } from './basis.js';
import { BASES } from '../themen/standard.js';
import { RASTER, rasterKey } from '../karte/raster.js';
import { eff, vT, visRect } from './zustand.js';
import { panel } from './seitenleiste.js';
import { syncTools } from './bedienung.js';
import { zoom } from './ansicht.js';

export /* ---------- Poster-Geometrie & SVG ---------- */
function geo() {
  const sw = app.S.frame.w,
    p = app.S.frame.pad,
    MH = MW * app.S.view.a;
  const W = MW + 2 * p + 2 * sw,
    mx = sw + p,
    my = sw + p;
  const t = app.S.title,
    u = app.S.sub;
  const capT = t.on && t.text ? t.size * CAP[t.font] : 0,
    capS = u.on && u.text ? u.size * CAP[u.font] : 0;
  const gap = capT && capS ? app.S.bar.gap : 0,
    block = capT + gap + capS;
  let barH = 0;
  if (app.S.bar.on || block > 0) barH = app.S.bar.auto ? Math.round(block + 60 + sw / 2) : app.S.bar.h;
  const barTop = my + MH + p,
    H = barTop + (barH > 0 ? barH : sw);
  const top = barTop + (barH - sw / 2 - block) / 2;
  return {
    W,
    H,
    sw,
    p,
    mx,
    my,
    MH,
    barTop,
    barH,
    yT: top + capT,
    yS: top + capT + gap + capS
  };
}
export function buildSVG(forExport) {
  const g = geo(),
    f = app.S.frame,
    R = Math.max(0, f.r),
    ri = Math.max(0, R - f.w / 2);
  let o = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.W.toFixed(1)} ${g.H.toFixed(1)}" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}">`;
  const fonts = new Set();
  [app.S.title, app.S.sub].forEach(t => {
    if (t.on && t.text) fonts.add(t.font);
  });
  if (app.S.attr.on) fonts.add('SgMD');
  o += '<defs>';
  if (forExport && fonts.size) {
    o += '<style>';
    fonts.forEach(n => {
      o += `@font-face{font-family:'${n}';src:url(data:font/woff;base64,${FONTDATA[n]}) format('woff');}`;
    });
    o += '</style>';
  }
  o += `<clipPath id="cMap"><rect x="0" y="0" width="${MW}" height="${g.MH.toFixed(1)}"/></clipPath>`;
  o += `<clipPath id="cIn"><rect x="${f.w}" y="${f.w}" width="${(g.W - 2 * f.w).toFixed(1)}" height="${(g.H - 2 * f.w).toFixed(1)}" rx="${ri}" ry="${ri}"/></clipPath>`;
  (app.DATA.tiles || []).forEach((r, i) => {
    o += `<clipPath id="tc${i}"><rect x="${r[0].toFixed(2)}" y="${r[1].toFixed(2)}" width="${r[2].toFixed(2)}" height="${r[2].toFixed(2)}"/></clipPath>`;
  });
  o += `<clipPath id="cOut"><rect x="0" y="0" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" rx="${R + f.w / 2}" ry="${R + f.w / 2}"/></clipPath></defs>`;
  if (app.S.bg !== 'none') o += `<rect id="kartenhintergrund" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${app.S.bg}"/>`;
  o += `<g id="karte" clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">`;
  const sc = app.S.scale / app.S.view.z,
    vr = visRect();
  if (app.S.mode === 'std') {
    const E = app.DATA.ext,
      R0 = RASTER.get(rasterKey());
    o += R0 ? `<image href="${R0.url}" x="${E.x0.toFixed(2)}" y="${E.y0.toFixed(2)}" width="${(E.x1 - E.x0).toFixed(2)}" height="${(E.y1 - E.y0).toFixed(2)}" preserveAspectRatio="none"/>` : `<rect x="${E.x0}" y="${E.y0}" width="${E.x1 - E.x0}" height="${E.y1 - E.y0}" fill="#e9e7e2"/>`;
  } else ORDER.forEach(k => {
    const groups = new Map();
    app.DATA.feats.forEach(ft => {
      if (ft.k !== k) return;
      const e = eff(ft);
      if (e.h) return;
      const bx = ft.bx;
      if (bx[2] < vr[0] || bx[0] > vr[2] || bx[3] < vr[1] || bx[1] > vr[3]) return;
      const lc = k === 'haus' ? 'stroke-linejoin="miter"' : 'stroke-linecap="round" stroke-linejoin="round"';
      const fill = ft.a ? e.f : 'none';
      const p = `<path id="${ft.fid}" d="${ft.d}" fill="${fill}" fill-rule="evenodd" stroke="${e.s}" stroke-width="${+(e.w * sc).toFixed(3)}" ${lc}${forExport ? '' : ' data-k="' + k + '" data-g="' + ft.id + '"'}/>`;
      const t = ft.t ?? -1;
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(p);
    });
    groups.forEach((arr, t) => {
      o += t >= 0 ? `<g clip-path="url(#tc${t})">${arr.join('')}</g>` : arr.join('');
    });
  });
  o += '</g></g></g></g>';
  if (app.S.bar.on && g.barH > 0) o += `<rect id="balken" x="${f.w / 2}" y="${g.barTop.toFixed(1)}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - g.barTop).toFixed(1)}" fill="${app.S.bar.color}" clip-path="url(#cOut)"/>`;
  if (f.w > 0) o += `<rect id="rahmen" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="none" stroke="${f.color}" stroke-width="${f.w}"/>`;
  [['title', g.yT], ['sub', g.yS]].forEach(([k, y]) => {
    const t = app.S[k];
    if (!t.on || !t.text) return;
    o += `<text id="${k === 'title' ? 'titel' : 'untertitel'}" x="${(g.W / 2 + t.ls / 2).toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="${t.font}" font-size="${t.size}" letter-spacing="${t.ls}" fill="${t.color}">${esc(t.text)}</text>`;
  });
  if (app.S.attr.on) {
    const inBar = app.S.bar.on && g.barH > 0;
    const col = inBar ? app.S.title.color : app.S.mode === 'std' ? BASES[app.S.base].sat || app.S.base === 'dark' || app.S.base === 'fiord' ? '#ffffff' : '#333333' : app.S.cls.haupt.s;
    const x = g.W - g.sw - g.p - 4;
    const y = inBar ? g.H - g.sw - 8 : g.my + g.MH - 6;
    const at = app.S.mode === 'std' ? BASES[app.S.base].sat ? '© Esri, Maxar, Earthstar Geographics · © OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenStreetMap-Mitwirkende';
    o += `<text id="quelle" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" font-family="SgMD" font-size="11" fill="${col}" fill-opacity="0.75">${at}</text>`;
  }
  return o + '</svg>';
}
export function render() {
  if (!app.DATA) return;
  const svg = buildSVG(false);
  const tmp = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  app.poster.setAttribute('viewBox', tmp.getAttribute('viewBox'));
  app.poster.innerHTML = tmp.innerHTML;
  const g = geo();
  const hits = document.createElementNS(NS, 'g');
  hits.setAttribute('transform', vT(g));
  const hw = (12 / app.S.view.z).toFixed(2);
  app.poster.querySelectorAll('path[data-k]').forEach(p => {
    if (p.getAttribute('fill') !== 'none' || p.dataset.k === 'haus') {
      p.setAttribute('pointer-events', 'all');
      p.style.cursor = 'pointer';
      if (p.dataset.k === 'haus') return;
    }
    const h = document.createElementNS(NS, 'path');
    h.setAttribute('d', p.getAttribute('d'));
    h.setAttribute('fill', 'none');
    h.setAttribute('stroke', 'transparent');
    h.setAttribute('stroke-width', hw);
    h.setAttribute('stroke-linecap', 'round');
    h.dataset.ref = p.dataset.g;
    hits.appendChild(h);
  });
  const hg = document.createElementNS(NS, 'g');
  hg.setAttribute('clip-path', 'url(#cIn)');
  const hg2 = document.createElementNS(NS, 'g');
  hg2.setAttribute('clip-path', 'url(#cMapHit)');
  const cm = document.createElementNS(NS, 'clipPath');
  cm.id = 'cMapHit';
  const cr = document.createElementNS(NS, 'rect');
  cr.setAttribute('x', g.mx);
  cr.setAttribute('y', g.my);
  cr.setAttribute('width', MW);
  cr.setAttribute('height', g.MH);
  cm.appendChild(cr);
  app.poster.querySelector('defs').appendChild(cm);
  hg2.appendChild(hits);
  hg.appendChild(hg2);
  app.poster.insertBefore(hg, app.poster.querySelector('#balken') || app.poster.querySelector('#rahmen') || null);
  const fr = app.poster.querySelector('#rahmen');
  if (fr) {
    fr.setAttribute('pointer-events', 'stroke');
    fr.style.cursor = 'pointer';
  }
  ['#balken', '#titel', '#untertitel'].forEach(q => {
    const e = app.poster.querySelector(q);
    if (e) e.style.cursor = 'pointer';
  });
  drawSel();
  panel();
  zoom();
  syncTools();
}
export const FMAP = new Map();
export function frags(id) {
  if (!FMAP.size && app.DATA) app.DATA.feats.forEach(f => {
    if (!FMAP.has(f.id)) FMAP.set(f.id, []);
    FMAP.get(f.id).push(f);
  });
  return FMAP.get(id);
}
export function feat(id) {
  const a = frags(id);
  return a ? a[0] : undefined;
}
export function drawSel() {
  app.poster.querySelectorAll('.selov').forEach(e => e.remove());
  const ov = document.createElementNS(NS, 'g');
  ov.setAttribute('class', 'selov');
  ov.setAttribute('pointer-events', 'none');
  const g = geo();
  const ids = app.selCls ? [...new Set(app.DATA.feats.filter(f => f.k === app.selCls && !eff(f).h).map(f => f.id))] : [...app.sel];
  ids.forEach(id => {
    const fr = frags(id);
    if (fr) {
      fr.forEach(f => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', f.d);
        if (f.t >= 0) p.setAttribute('clip-path', `url(#tc${f.t})`);
        p.setAttribute('transform', vT(g));
        p.setAttribute('fill', f.a && eff(f).f !== 'none' ? 'rgba(47,111,228,.25)' : 'none');
        p.setAttribute('stroke', '#2f6fe4');
        p.setAttribute('stroke-width', (Math.max(3, eff(f).w * app.S.scale + 3) / app.S.view.z).toFixed(2));
        p.setAttribute('stroke-opacity', '.7');
        p.setAttribute('stroke-linejoin', 'round');
        p.setAttribute('stroke-linecap', 'round');
        ov.appendChild(p);
      });
      return;
    }
    const m = {
      frame: '#rahmen',
      bar: '#balken',
      title: '#titel',
      sub: '#untertitel',
      bgmap: '#kartenhintergrund'
    };
    const el = app.poster.querySelector(m[id]);
    if (!el) return;
    let b;
    try {
      b = el.getBBox();
    } catch (e) {
      return;
    }
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', b.x - 4);
    r.setAttribute('y', b.y - 4);
    r.setAttribute('width', b.width + 8);
    r.setAttribute('height', b.height + 8);
    r.setAttribute('fill', 'none');
    r.setAttribute('stroke', '#2f6fe4');
    r.setAttribute('stroke-width', '3');
    r.setAttribute('stroke-dasharray', '10 6');
    ov.appendChild(r);
  });
  const ovc = document.createElementNS(NS, 'g');
  ovc.setAttribute('clip-path', 'url(#cMapHit)');
  [...ov.childNodes].forEach(n => {
    if (n.tagName === 'path') ovc.appendChild(n);
  });
  ov.appendChild(ovc);
  app.poster.appendChild(ov);
  let txt = 'Nichts ausgewählt';
  if (app.selCls) txt = `Alle ${CLS[app.selCls]} (Vorlage für die ganze Gruppe)`;else if (app.sel.size) {
    const c = {};
    [...app.sel].forEach(id => {
      const f = feat(id);
      const k = f ? CLS1[f.k] : {
        frame: 'Rahmen',
        bar: 'Balken',
        title: 'Titel',
        sub: 'Untertitel',
        bgmap: 'Kartenhintergrund'
      }[id];
      c[k] = (c[k] || 0) + 1;
    });
    txt = Object.entries(c).map(([k, v]) => v > 1 ? `${v}× ${k}` : k).join(', ');
  }
  $('selinfo').textContent = txt;
}
/* ---------- Zeigerbedienung: Klick, Rahmen aufziehen, Verschieben, Zoomen ---------- */

/** Verbindet die Bedienelemente dieses Bausteins mit der Seite. */
export function initEditorZeichnen() {
  app.poster = $('poster');
}

