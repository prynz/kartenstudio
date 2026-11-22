// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Poster-Geometrie, SVG bauen, zeichnen, Auswahl anzeigen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, CAP, CLS, CLS1, FONTDATA, MW, NS, ORDER, esc } from './basis.js';
import { BASES } from '../themen/standard.js';
import { RASTER, rasterKey, detailRaster, scheduleDetail } from '../karte/raster.js';
import { fitPrint } from './druck.js';
import { clampView } from './zustand.js';
import { eff, vT, visRect } from './zustand.js';
import { dms, panel, viewCenterLL } from './seitenleiste.js';
import { LAY_DEFAULT } from '../themen/designs.js';
import { syncWizard } from './assistent.js';
import { popDefs, popSymbols, popColor, popK } from '../themen/pop.js';
import { syncTools } from './bedienung.js';
import { zoom } from './ansicht.js';

/* ---------- Poster-Geometrie & SVG ---------- */
// Berechnet, wo Karte, Balken und Text im Poster liegen – je nach Design (app.S.lay).
export function geo() {
  const S = app.S,
    L = { ...LAY_DEFAULT, ...(S.lay || {}) };
  const sw = S.frame.w,
    p = S.frame.pad,
    MH = MW * S.view.a;
  const W = MW + 2 * p + 2 * sw,
    mx = sw + p;
  const t = S.title,
    u = S.sub;
  const capT = t.on && t.text ? t.size * CAP[t.font] : 0,
    capS = u.on && u.text ? u.size * CAP[u.font] : 0;
  const cSize = Math.round(Math.max(16, (u.size || 34) * 0.62));
  const capC = L.coords && app.DATA ? cSize * CAP.SgMD : 0;
  const nt = S.note && S.note.on !== false && S.note.text ? S.note.text : '';
  const nSize = Math.round(Math.max(18, (u.size || 34) * 0.72));
  const capN = nt ? nSize * CAP.SgMD : 0;
  const gap = capT && capS ? S.bar.gap : 0,
    gapC = capC && (capT || capS) ? Math.round(S.bar.gap * 0.8) : 0,
    gapN = capN && (capT || capS || capC) ? Math.max(14, Math.round(S.bar.gap * 0.8)) : 0;
  const block = capT + gap + capS + gapC + capC + gapN + capN;
  let my,
    H,
    barTop,
    barH = 0,
    top;
  if (L.kind === 'below') {
    my = sw + p;
    barTop = my + MH;
    const tp = block > 0 ? Math.max(L.textPad, p) : p;
    top = my + MH + tp;
    H = block > 0 ? top + block + tp + sw : my + MH + p + sw;
  } else if (L.kind === 'top') {
    const tp = block > 0 ? Math.max(L.textPad, p) : 0;
    top = sw + tp;
    my = block > 0 ? top + block + tp : sw + p;
    barTop = my + MH;
    H = my + MH + p + sw;
  } else if (L.kind === 'bartop') {
    // Farbbalken oben mit Text, Karte darunter
    barH = block > 0 ? (S.bar.auto ? Math.round(block + 60 + sw / 2) : S.bar.h) : 0;
    barTop = 0;
    my = sw + (barH > 0 ? barH - sw / 2 : 0) + p;
    H = my + MH + p + sw;
    top = sw / 2 + (barH - sw / 2 - block) / 2;
  } else if (L.kind === 'over') {
    my = sw + p;
    barTop = my + MH;
    H = my + MH + p + sw;
    top = my + MH - Math.max(56, MH * 0.07) - block;
  } else {
    // 'bar' – Text im Farbbalken unter der Karte (Ursprungsdesign)
    my = sw + p;
    if (S.bar.on || block > 0) barH = S.bar.auto ? Math.round(block + 60 + sw / 2) : S.bar.h;
    barTop = my + MH + p;
    H = barTop + (barH > 0 ? barH : sw);
    top = barTop + (barH - sw / 2 - block) / 2;
  }
  let y = top,
    yT = top,
    yS = top,
    yC = top,
    yN = top;
  if (capT) yT = y += capT;
  if (capS) yS = y += (capT ? gap : 0) + capS;
  if (capC) yC = y += gapC + capC;
  if (capN) yN = y += gapN + capN;
  return { W, H, sw, p, mx, my, MH, barTop, barH, yT, yS, yC, yN, nSize, note: nt, top, block, cSize, L };
}
/** Koordinaten der Kartenmitte als Textzeile. */
export function coordText() {
  const [lon, lat] = viewCenterLL();
  return `${dms(lat, 'N', 'S')}  ·  ${dms(lon, 'O', 'W')}`;
}
/** Umriss der Kartenfläche (Rechteck oder Kreis), optional um `grow` vergrößert. */
function mapShape(g, grow, attrs) {
  const sh = g.L.shape;
  if (sh === 'circle') {
    const r = Math.min(MW, g.MH) / 2 + grow;
    return `<circle cx="${MW / 2}" cy="${(g.MH / 2).toFixed(1)}" r="${r.toFixed(1)}"${attrs}/>`;
  }
  const x0 = -grow,
    y0 = -grow,
    w = MW + 2 * grow,
    h = g.MH + 2 * grow;
  /** Punkt in relativen Koordinaten (0–1) der Kartenfläche */
  const P = (u, v) => `${(x0 + u * w).toFixed(1)} ${(y0 + v * h).toFixed(1)}`;
  if (sh === 'heart') {
    const d = `M${P(.5, .97)} C${P(.18, .76)} ${P(0, .55)} ${P(0, .31)} C${P(0, .12)} ${P(.14, 0)} ${P(.29, 0)} C${P(.4, 0)} ${P(.47, .06)} ${P(.5, .15)} C${P(.53, .06)} ${P(.6, 0)} ${P(.71, 0)} C${P(.86, 0)} ${P(1, .12)} ${P(1, .31)} C${P(1, .55)} ${P(.82, .76)} ${P(.5, .97)} Z`;
    return `<path d="${d}"${attrs}/>`;
  }
  if (sh === 'hex') return `<path d="M${P(.5, 0)} L${P(1, .25)} L${P(1, .75)} L${P(.5, 1)} L${P(0, .75)} L${P(0, .25)} Z"${attrs}/>`;
  if (sh === 'arch') {
    const r = w / 2;
    return `<path d="M${x0} ${(y0 + h).toFixed(1)} L${x0} ${(y0 + r).toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(x0 + w).toFixed(1)} ${(y0 + r).toFixed(1)} L${(x0 + w).toFixed(1)} ${(y0 + h).toFixed(1)} Z"${attrs}/>`;
  }
  if (sh === 'rounded') {
    const r = Math.max(0, 44 + grow);
    return `<rect x="${x0}" y="${y0}" width="${w}" height="${h.toFixed(1)}" rx="${r}" ry="${r}"${attrs}/>`;
  }
  return `<rect x="${-grow}" y="${-grow}" width="${MW + 2 * grow}" height="${(g.MH + 2 * grow).toFixed(1)}"${attrs}/>`;
}
/**
 * Karteninhalt (Häuser, Straßen …) als SVG-Text – das ist der teure Teil.
 * @param {boolean} forExport
 * @param {number[]} vr Kartenbereich, der gezeichnet wird [x0,y0,x1,y1]
 */
function mapContent(forExport, vr) {
  let o = '';
  const sc = app.S.scale / app.S.view.z;
  if (app.S.mode === 'std') {
    const E = app.DATA.ext,
      R0 = RASTER.get(rasterKey());
    o += R0 ? `<image href="${R0.url}" x="${E.x0.toFixed(2)}" y="${E.y0.toFixed(2)}" width="${(E.x1 - E.x0).toFixed(2)}" height="${(E.y1 - E.y0).toFixed(2)}" preserveAspectRatio="none"/>` : `<rect x="${E.x0}" y="${E.y0}" width="${E.x1 - E.x0}" height="${E.y1 - E.y0}" fill="#e9e7e2"/>`;
    // Schärferes Detailbild für den sichtbaren Bereich (nach dem Hineinzoomen)
    const D = R0 && detailRaster();
    if (D) {
      const r = D.rect;
      o += `<image href="${D.url}" x="${r[0].toFixed(2)}" y="${r[1].toFixed(2)}" width="${(r[2] - r[0]).toFixed(2)}" height="${(r[3] - r[1]).toFixed(2)}" preserveAspectRatio="none"/>`;
    }
  } else {
  const pop = app.S.pop && app.S.pop.pal;
  if (pop) o += `<defs>${popDefs()}</defs>` + popSymbols(app.DATA, app.S, vr, pop);
  // Pop-Art: Straßen/Wasser im selben Maßstab wie die Symbole
  const pk = pop ? popK(app.DATA, app.S) : 1;
  ORDER.forEach(k => {
    const groups = new Map();
    app.DATA.feats.forEach(ft => {
      if (ft.k !== k) return;
      const e = eff(ft);
      if (e.h) return;
      const bx = ft.bx;
      if (bx[2] < vr[0] || bx[0] > vr[2] || bx[3] < vr[1] || bx[1] > vr[3]) return;
      const lc = k === 'haus' ? 'stroke-linejoin="miter"' : 'stroke-linecap="round" stroke-linejoin="round"';
      let fill = ft.a ? e.f : 'none';
      // Pop-Art: jedes Haus bekommt eine feste Zufallsfarbe (außer es wurde einzeln umgefärbt)
      if (pop && k === 'haus' && !(app.S.ov[ft.id] && app.S.ov[ft.id].f)) fill = popColor(ft.id, pop);
      const p = `<path id="${ft.fid}" d="${ft.d}" fill="${fill}" fill-rule="evenodd" stroke="${e.s}" stroke-width="${+(e.w * sc * pk).toFixed(3)}" ${lc}${forExport ? '' : ' data-k="' + k + '" data-g="' + ft.id + '"'}/>`;
      const t = ft.t ?? -1;
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(p);
    });
    groups.forEach((arr, t) => {
      o += t >= 0 ? `<g clip-path="url(#tc${t})">${arr.join('')}</g>` : arr.join('');
    });
  });
  }
  return o;
}

/* ---------- Zwischenspeicher für die Karte ----------
   Text-, Rahmen- oder Designänderungen bauen die Karte nicht neu auf: Der fertige
   Karten-Knoten wird wiederverwendet. Beim Verschieben wird nur die Ansicht versetzt. */
const MC = { key: '', node: null, hits: null, rect: null, z: 0 };
function mapKey() {
  const S = app.S;
  return JSON.stringify([app.DATA && app.DATA.place, app.DATA && app.DATA.feats.length, app.DATA && app.DATA.ext, S.cls, S.ov, S.scale, S.mode, S.base, S.labels, S.pop, S.view.z, S.mode === 'std' ? [!!RASTER.get(rasterKey()), detailRaster() ? detailRaster().url.length + detailRaster().rect.join() : 0] : 0]);
}
/** Sichtbarer Bereich plus großzügiger Rand, damit Verschieben ohne Neuzeichnen geht */
function cullRect() {
  const v = visRect(), w = v[2] - v[0], h = v[3] - v[1], E = app.DATA.ext;
  return [Math.max(E.x0, v[0] - w * 0.6), Math.max(E.y0, v[1] - h * 0.6), Math.min(E.x1, v[2] + w * 0.6), Math.min(E.y1, v[3] + h * 0.6)];
}
function cacheCovers() {
  if (!MC.node || !MC.rect) return false;
  const v = visRect(), r = MC.rect, E = app.DATA.ext, eps = 0.5;
  return (v[0] >= r[0] - eps || r[0] <= E.x0 + eps) && (v[1] >= r[1] - eps || r[1] <= E.y0 + eps) && (v[2] <= r[2] + eps || r[2] >= E.x1 - eps) && (v[3] <= r[3] + eps || r[3] >= E.y1 - eps);
}
/** Kartenknoten (und Klickflächen) holen – aus dem Zwischenspeicher oder neu bauen */
function mapNodes() {
  const key = mapKey();
  if (key === MC.key && cacheCovers()) return MC;
  const rect = cullRect();
  const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}"><g id="kartenInhalt">${mapContent(false, rect)}</g></svg>`, 'image/svg+xml');
  const node = document.importNode(doc.documentElement.firstChild, true);
  // Klickflächen: breite unsichtbare Linien, damit man dünne Straßen gut trifft
  const hits = document.createElementNS(NS, 'g');
  const hw = (12 / app.S.view.z).toFixed(2);
  node.querySelectorAll('path[data-k]').forEach(p => {
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
  Object.assign(MC, { key, node, hits, rect, z: app.S.view.z });
  return MC;
}

let fullTimer = 0;
/**
 * Schnelle Aktualisierung beim Ziehen/Zoomen: nur die Ansicht verschieben/skalieren.
 * Das vollständige Neuzeichnen folgt kurz nach der letzten Bewegung.
 */
export function renderView() {
  if (!app.DATA) return;
  const inner = app.poster.querySelector('#kartenAnsicht');
  if (!inner || !MC.node || !cacheCovers()) {
    render();
    return;
  }
  const g = geo();
  const t = vT(g);
  // Linienstärken sind für den alten Zoom berechnet – bis zum Neuzeichnen proportional mitskalieren
  inner.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  const pa = app.poster.querySelector('#pinsAnsicht');
  if (pa) pa.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  if (MC.hits) MC.hits.setAttribute('transform', t);
  drawSel();
  syncTools();
  clearTimeout(fullTimer);
  fullTimer = window.setTimeout(render, 140);
}
/* ---------- Effekte: Vignette und Papier-Struktur ---------- */
let NOISE = '';
/** Feines Papierkorn als kleines Kachelbild (einmal erzeugt, wird im Export eingebettet) */
function noiseURL() {
  if (NOISE) return NOISE;
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d'),
    d = x.createImageData(160, 160);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 120 + rnd() * 135;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  // leichte Fasern
  x.globalAlpha = 0.08;
  x.strokeStyle = '#000';
  for (let i = 0; i < 40; i++) {
    x.beginPath();
    const px = rnd() * 160, py = rnd() * 160;
    x.moveTo(px, py);
    x.lineTo(px + (rnd() - 0.5) * 30, py + (rnd() - 0.5) * 8);
    x.stroke();
  }
  NOISE = c.toDataURL('image/png');
  return NOISE;
}
function fxSVG(g) {
  const fx = app.S.fx || {};
  let o = '';
  if (fx.vig) {
    o += `<defs><radialGradient id="gVig" cx="50%" cy="50%" r="72%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs>`;
    o += `<g clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><rect id="vignette" width="${MW}" height="${g.MH.toFixed(1)}" fill="url(#gVig)"/></g></g></g>`;
  }
  // Papier-Struktur nur auf farbigem Grund (auf transparentem Grund, z. B. für Shirts, wäre sie Schmutz)
  if (fx.paper && app.S.bg !== 'none') {
    o += `<defs><pattern id="pPaper" width="160" height="160" patternUnits="userSpaceOnUse"><image href="${noiseURL()}" width="160" height="160"/></pattern></defs>`;
    o += `<rect id="papier" x="0" y="0" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" fill="url(#pPaper)" opacity=".16" style="mix-blend-mode:multiply" clip-path="url(#cOut)" pointer-events="none"/>`;
  }
  return o;
}

/* ---------- Markierungen (Pins) ---------- */
/** Formen, jeweils um (0,0) gezeichnet; Pin/Tropfen mit Spitze bei (0,0) */
export const PIN_SHAPES = {
  herz: { name: 'Herz', d: 'M0 15C-9 8-17 1-17-8C-17-14-12-18-7-18C-3-18-1-16 0-13C1-16 3-18 7-18C12-18 17-14 17-8C17 1 9 8 0 15Z' },
  pin: { name: 'Pin', d: 'M0 0C-3-7-14-15-14-25A14 14 0 1 1 14-25C14-15 3-7 0 0ZM0-30A5 5 0 1 0 0-20A5 5 0 1 0 0-30Z' },
  stern: { name: 'Stern', d: 'M0-18L5-6L18-6L8 2L12 15L0 7L-12 15L-8 2L-18-6L-5-6Z' },
  punkt: { name: 'Punkt', d: 'M0-11A11 11 0 1 1 0 11A11 11 0 1 1 0-11Z' }
};
/** Pins als SVG – in eigener Ebene über der Karte, Größe unabhängig vom Zoom */
function pinsSVG(g, forExport) {
  const pins = app.S.pins || [];
  if (!pins.length) return '';
  const v = app.S.view,
    k = 1 / v.z,
    sz = (app.S.pinSize || 1) * 1.25;
  const col = app.S.pinColor || '#d64545';
  let o = `<g id="pins" clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g id="pinsAnsicht" transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">`;
  pins.forEach((p, i) => {
    const S = PIN_SHAPES[p.i] || PIN_SHAPES.herz;
    const s = (k * sz).toFixed(4);
    o += `<g transform="translate(${(+p.x).toFixed(2)},${(+p.y).toFixed(2)}) scale(${s})"${forExport ? '' : ` data-pin="${i}" style="cursor:grab"`}>`;
    if (!forExport) o += `<circle r="26" cy="${p.i === 'pin' ? -20 : 0}" fill="transparent"/>`;
    o += `<path d="${S.d}" fill="${col}" fill-rule="evenodd" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"/></g>`;
  });
  return o + '</g></g></g></g>';
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
  if (app.S.attr.on || g.L.coords || g.note) fonts.add('SgMD');
  o += '<defs>';
  if (forExport && fonts.size) {
    o += '<style>';
    fonts.forEach(n => {
      o += `@font-face{font-family:'${n}';src:url(data:font/woff;base64,${FONTDATA[n]}) format('woff');}`;
    });
    o += '</style>';
  }
  o += `<clipPath id="cMap">${mapShape(g, 0, '')}</clipPath>`;
  o += `<clipPath id="cIn"><rect x="${f.w}" y="${f.w}" width="${(g.W - 2 * f.w).toFixed(1)}" height="${(g.H - 2 * f.w).toFixed(1)}" rx="${ri}" ry="${ri}"/></clipPath>`;
  (app.DATA.tiles || []).forEach((r, i) => {
    o += `<clipPath id="tc${i}"><rect x="${r[0].toFixed(2)}" y="${r[1].toFixed(2)}" width="${r[2].toFixed(2)}" height="${r[2].toFixed(2)}"/></clipPath>`;
  });
  o += `<clipPath id="cOut"><rect x="0" y="0" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" rx="${R + f.w / 2}" ry="${R + f.w / 2}"/></clipPath></defs>`;
  if (app.S.bg !== 'none') o += `<rect id="kartenhintergrund" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${app.S.bg}"/>`;
  o += `<g id="karte" clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g id="kartenAnsicht" transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">`;
  o += forExport ? mapContent(true, visRect()) : '<g id="kartenInhalt"/>';
  o += '</g></g></g></g>';
  const ink = app.S.title.color;
  o += fxSVG(g);
  o += pinsSVG(g, forExport);
  if (g.L.inner > 0) o += mapShape(g, g.L.innerGap + g.L.inner / 2, ` id="innenlinie" transform="translate(${g.mx},${g.my})" fill="none" stroke="${f.w > 0 ? f.color : ink}" stroke-width="${g.L.inner}"`);
  if (g.L.kind === 'over' && g.L.fade && g.block > 0) {
    const paper = app.S.bg !== 'none' ? app.S.bg : '#ffffff',
      y0 = Math.max(g.my, g.top - 150);
    o += `<defs><linearGradient id="gFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paper}" stop-opacity="0"/><stop offset=".55" stop-color="${paper}" stop-opacity=".82"/><stop offset="1" stop-color="${paper}" stop-opacity=".95"/></linearGradient></defs>`;
    o += `<rect id="verlauf" x="${g.mx}" y="${y0.toFixed(1)}" width="${MW}" height="${(g.my + g.MH - y0).toFixed(1)}" fill="url(#gFade)" clip-path="url(#cIn)"/>`;
  }
  if (g.L.kind === 'bartop' && g.barH > 0) o += `<rect id="balken" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.barH).toFixed(1)}" fill="${app.S.bar.color}" clip-path="url(#cOut)"/>`;
  if (g.L.kind === 'bar' && app.S.bar.on && g.barH > 0) o += `<rect id="balken" x="${f.w / 2}" y="${g.barTop.toFixed(1)}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - g.barTop).toFixed(1)}" fill="${app.S.bar.color}" clip-path="url(#cOut)"/>`;
  if (f.w > 0) o += `<rect id="rahmen" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="none" stroke="${f.color}" stroke-width="${f.w}"/>`;
  [['title', g.yT], ['sub', g.yS]].forEach(([k, y]) => {
    const t = app.S[k];
    if (!t.on || !t.text) return;
    o += `<text id="${k === 'title' ? 'titel' : 'untertitel'}" x="${(g.W / 2 + t.ls / 2).toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="${t.font}" font-size="${t.size}" letter-spacing="${t.ls}" fill="${t.color}">${esc(t.text)}</text>`;
  });
  if (g.L.rule && app.S.title.on && app.S.title.text && app.S.sub.on && app.S.sub.text) {
    const yr = (g.yT + (g.yS - app.S.sub.size * CAP[app.S.sub.font])) / 2;
    o += `<line id="zierlinie" x1="${(g.W / 2 - 70).toFixed(1)}" x2="${(g.W / 2 + 70).toFixed(1)}" y1="${yr.toFixed(1)}" y2="${yr.toFixed(1)}" stroke="${app.S.title.color}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (g.L.coords && app.DATA) o += `<text id="koordinaten" x="${(g.W / 2 + 1.5).toFixed(2)}" y="${g.yC.toFixed(2)}" text-anchor="middle" font-family="SgMD" font-size="${g.cSize}" letter-spacing="3" fill="${app.S.sub.color}" fill-opacity="0.85">${esc(coordText())}</text>`;
  if (g.note) o += `<text id="widmung" x="${(g.W / 2 + 1).toFixed(2)}" y="${g.yN.toFixed(2)}" text-anchor="middle" font-family="SgMD" font-size="${g.nSize}" letter-spacing="2" fill="${app.S.sub.color}">${esc(g.note)}</text>`;
  if (app.S.attr.on) {
    const inBar = g.L.kind === 'bar' && app.S.bar.on && g.barH > 0;
    const onPaper = !inBar && g.L.kind !== 'top' && g.L.kind !== 'bartop';
    const col = inBar || onPaper ? app.S.title.color : app.S.mode === 'std' ? BASES[app.S.base].sat || app.S.base === 'dark' || app.S.base === 'fiord' ? '#ffffff' : '#333333' : app.S.cls.haupt.s;
    const x = g.W - g.sw - g.p - 4;
    const y = inBar ? g.H - g.sw - 8 : g.L.kind === 'below' ? g.H - g.sw - Math.min(14, g.p / 2 + 4) : g.my + g.MH - 6;
    const at = app.S.mode === 'std' ? BASES[app.S.base].sat ? '© Esri, Maxar, Earthstar Geographics · © OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenStreetMap-Mitwirkende';
    o += `<text id="quelle" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" font-family="SgMD" font-size="11" fill="${col}" fill-opacity="0.75">${at}</text>`;
  }
  return o + '</svg>';
}
export function render() {
  if (!app.DATA) return;
  clearTimeout(fullTimer);
  if (app.S.print) {
    // Druckformat: Kartenhöhe so anpassen, dass das Poster genau aufs Papier passt
    const a0 = app.S.view.a;
    fitPrint(app.S);
    if (app.S.view.a !== a0) clampView(app.S.view);
  }
  const svg = buildSVG(false);
  const tmp = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
  app.poster.setAttribute('viewBox', tmp.getAttribute('viewBox'));
  // Vorschau-Hintergrund (Karomuster = transparent) genau in der Umrissform des Posters
  const pv = app.previewBg || 'checker';
  const bgFill = pv === 'checker' ? 'url(#pvChecker)' : pv;
  const tdefs = tmp.querySelector('defs');
  if (pv === 'checker') tdefs.insertAdjacentHTML('beforeend', '<pattern id="pvChecker" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fff"/><rect width="12" height="12" fill="#ececec"/><rect x="12" y="12" width="12" height="12" fill="#ececec"/></pattern>');
  tdefs.insertAdjacentHTML('afterend', `<rect id="vorschau" x="0" y="0" width="100%" height="100%" fill="${bgFill}" clip-path="url(#cOut)" pointer-events="none"/>`);
  const g = geo();
  const before = MC.node;
  const M = mapNodes();
  const oldK = app.poster.querySelector('#karte');
  const oldHg = app.poster.querySelector('#treffer');
  if (oldK && M.node === before && oldK.contains(M.node)) {
    // Schneller Weg: Karte bleibt im Poster, nur alles drumherum wird ersetzt.
    // (Herausnehmen und Wiedereinsetzen würde den Browser zwingen, jedes Haus neu zu vermessen.)
    const newK = tmp.querySelector('#karte');
    let a = newK, b = oldK;
    while (a && b && a.id !== 'kartenInhalt' && b !== M.node) {
      for (const at of [...a.attributes]) b.setAttribute(at.name, at.value);
      a = a.firstElementChild;
      b = b.firstElementChild;
    }
    const kids = [...tmp.children];
    const i = kids.indexOf(newK);
    const html = (arr) => arr.map(n => n.outerHTML).join('');
    [...app.poster.children].forEach(n => {
      if (n !== oldK && n !== oldHg) n.remove();
    });
    oldK.insertAdjacentHTML('beforebegin', html(kids.slice(0, i)));
    (oldHg || oldK).insertAdjacentHTML('afterend', html(kids.slice(i + 1)));
  } else {
    app.poster.innerHTML = tmp.innerHTML;
    const ph = app.poster.querySelector('#kartenInhalt');
    if (ph) ph.replaceWith(M.node);
    if (oldHg) oldHg.remove();
  }
  const hits = M.hits;
  hits.setAttribute('transform', vT(g));
  // Klickflächen-Gruppe (bleibt ebenfalls bestehen, wenn möglich)
  const cm = document.createElementNS(NS, 'clipPath');
  cm.id = 'cMapHit';
  cm.innerHTML = mapShape(g, 0, ` transform="translate(${g.mx},${g.my})"`);
  app.poster.querySelector('defs').appendChild(cm);
  let hg = app.poster.querySelector('#treffer');
  if (!hg || !hg.contains(hits)) {
    if (hg) hg.remove();
    hg = document.createElementNS(NS, 'g');
    hg.id = 'treffer';
    hg.setAttribute('clip-path', 'url(#cIn)');
    const hg2 = document.createElementNS(NS, 'g');
    hg2.setAttribute('clip-path', 'url(#cMapHit)');
    hg2.appendChild(hits);
    hg.appendChild(hg2);
    app.poster.querySelector('#karte').after(hg);
  }
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
  syncWizard();
  zoom();
  syncTools();
  if (app.S.mode === 'std') scheduleDetail();
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

