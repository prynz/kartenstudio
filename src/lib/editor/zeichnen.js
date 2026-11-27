// @ts-nocheck – aus dem Prototyp übernommen; Typen folgen bei der Überarbeitung.
// Poster-Geometrie, SVG bauen, zeichnen, Auswahl anzeigen
// Aus dem Prototyp übernommen (prototyp/src/script.js).
import { app } from './app.js';
import { $, CAP, CLS, CLS1, FONTDATA, MW, NS, ORDER, esc } from './basis.js';
import { BASES } from '../themen/standard.js';
import { RASTER, rasterKey, detailRaster, scheduleDetail, std3d, kameraBild, kameraKey, scheduleKamera } from '../karte/raster.js';
import { fitPrint } from './druck.js';
import { clampView } from './zustand.js';
import { SICHTBAR_MAX, dichte, eff, vT, visRect } from './zustand.js';
import { dms, panel, viewCenterLL } from './seitenleiste.js';
import { LAY_DEFAULT, lum } from '../themen/designs.js';
import { syncWizard } from './assistent.js';
import { popDefs, popSymbols, popColor, popK } from '../themen/pop.js';
import { loadSky, skyReady, skySVG } from '../themen/himmel.js';
import { koordSVG } from '../themen/koordinaten.js';
import { wolkeSVG } from '../themen/wolke.js';
import { inkColor } from '../themen/designs.js';
import { formOk, formPfad, textForm } from './silhouette.js';
import { coverSVG, plaketteSVG, himmelSVG } from '../themen/sunset.js';
import { einsatzSVG, absatzSVG, fokusSVG, lupeSVG, gitterSVG, kompassSVG, tabelleSVG, steckbriefSVG, kastenSVG, leuchtenSVG } from '../themen/layouts.js';
import { multiKey, multiOn, multiSVG } from './mehrere.js';
import { routeSVG, routeStrich } from './route.js';
import { contours, reliefBild } from '../karte/hoehen.js';
import { syncTools } from './bedienung.js';
import { nachladenPruefen } from './nachladen.js';
import { msg, zoom } from './ansicht.js';

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
  // Koordinaten-Poster: der Ortsname steht groß im Motiv, nicht noch einmal darunter
  const koord = S.motif === 'koord';
  // Tabelle/Steckbrief/Kasten zeichnen Untertitel, Koordinaten und Widmung selbst
  const eigen = L.foot === 'tabelle' || L.kind === 'steckbrief' || L.kind === 'kasten' || L.kind === 'cover' || L.kind === 'plakette';
  const capT = t.on && t.text && !koord ? t.size * CAP[t.font] : 0,
    capS = u.on && u.text && !eigen && !L.ohneSub ? u.size * CAP[u.font] : 0;
  const cSize = Math.round(Math.max(16, (u.size || 34) * 0.62));
  const capC = L.coords && app.DATA && !koord && !eigen ? cSize * CAP.SgMD : 0;
  const nt = S.note && S.note.on !== false && S.note.text && !eigen ? S.note.text : '';
  const nSize = Math.round(Math.max(18, (u.size || 34) * 0.72));
  const capN = nt ? nSize * CAP.SgMD : 0;
  const gap = capT && capS ? S.bar.gap : 0,
    gapC = capC && (capT || capS) ? Math.round(S.bar.gap * 0.8) : 0,
    gapN = capN && (capT || capS || capC) ? Math.max(14, Math.round(S.bar.gap * 0.8)) : 0;
  const block = capT + gap + capS + gapC + capC + gapN + capN;
  let himmelH = 0;
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
  } else if (L.kind === 'top' && L.himmel) {
    // Retro-Himmel über der Karte, Text unten im Himmel
    const tp = Math.max(L.textPad, p);
    // Album: niedrigerer Himmel, damit das ganze Poster quadratisch wird
    himmelH = Math.max(block + 2 * tp, MW * (L.himmel === 'album' ? 0.42 : 0.55));
    top = sw + himmelH - tp * 0.7 - block;
    my = sw + himmelH;
    barTop = my + MH;
    H = my + MH + p + sw;
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
  } else if (L.kind === 'steckbrief') {
    // Kopfzeile oben, Karte, darunter Titel links + Kästchen + Fakten
    my = sw + p + 74;
    barTop = my + MH;
    H = my + MH + 430 + sw;
    top = my + MH;
  } else if (L.kind === 'over' || L.kind === 'typo' || L.kind === 'kasten' || L.kind === 'cover' || L.kind === 'plakette') {
    my = sw + p;
    barTop = my + MH;
    H = my + MH + p + sw;
    top = L.oben ? my + Math.max(60, MH * 0.05) : my + MH - Math.max(56, MH * 0.07) - block - (L.kompass === 'unten' ? 70 : 0);
  } else {
    // 'bar' – Text im Farbbalken unter der Karte (Ursprungsdesign)
    my = sw + p;
    if (S.bar.on || block > 0) barH = S.bar.auto ? Math.round(block + 60 + sw / 2) : S.bar.h;
    barTop = my + MH + p;
    H = barTop + (barH > 0 ? barH : sw);
    top = barTop + (barH - sw / 2 - block) / 2;
  }
  // Info-Leiste (Tabelle) unter der Karte
  let footY = 0, footH = 0;
  if (L.foot === 'tabelle') {
    footH = 132;
    footY = my + MH + Math.max(56, p);
    H = footY + footH + Math.max(48, p) + sw;
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
  return { W, H, sw, p, mx, my, MH, barTop, barH, yT, yS, yC, yN, nSize, note: nt, top, block, cSize, L, footY, footH, himmelH };
}
/** Eigene Form: hochgeladen, sonst der Anfangsbuchstabe des Titels */
export function aktuelleForm(S) {
  if (S.form && formOk(S.form)) return S.form;
  if (typeof document === 'undefined') return null;
  const t = ((S.title && S.title.text) || (app.DATA && app.DATA.place) || 'A').trim();
  return textForm([...t][0] ? [...t][0].toUpperCase() : 'A');
}
/** Koordinaten der Kartenmitte als Textzeile. */
export function coordText(kurz) {
  const [lon, lat] = viewCenterLL();
  // Kurzform wie auf klassischen Stadtplan-Postern: 53°33′ N  10°00′ O
  if (kurz) {
    const k = (v, pos, neg) => {
      const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60);
      return `${d}°${String(m).padStart(2, '0')}′ ${v < 0 ? neg : pos}`;
    };
    return `${k(lat, 'N', 'S')}   ${k(lon, 'O', 'W')}`;
  }
  return `${dms(lat, 'N', 'S')}  ·  ${dms(lon, 'O', 'W')}`;
}
/** Umriss der Kartenfläche (Rechteck oder Kreis), optional um `grow` vergrößert. */
function mapShape(g, grow, attrs) {
  const sh = g.L.shape;
  // Eigene Form (hochgeladenes Bild oder Buchstabe), eingepasst in die Kartenfläche
  if (sh === 'eigen') {
    const F = aktuelleForm(app.S);
    if (F) return `<path d="${formPfad(F, MW, g.MH, grow)}" fill-rule="evenodd" clip-rule="evenodd"${attrs}/>`;
    const r = Math.min(MW, g.MH) / 2 + grow;
    return `<circle cx="${MW / 2}" cy="${(g.MH / 2).toFixed(1)}" r="${r.toFixed(1)}"${attrs}/>`;
  }
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
  if (sh === 'house') return `<path d="M${P(.5, 0)} L${P(1, .4)} L${P(1, 1)} L${P(0, 1)} L${P(0, .4)} Z"${attrs}/>`;
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
/* ---------- 3D-Effekte ---------- */
/** Kippwinkel der Perspektive in Grad (0 = von oben). Nur für gezeichnete Karten. */
export function kippWinkel() {
  const S = app.S;
  const k = S && S.fx ? +S.fx.kipp || 0 : 0;
  if (!k || S.mode === 'std' || (S.motif && S.motif !== 'karte') || multiOn()) return 0;
  return Math.min(60, Math.max(0, k));
}
/** Gezeichnete Karte gekippt oder gedreht? */
export function perspektiveAn() {
  const S = app.S;
  if (!S || !S.fx || S.mode === 'std' || (S.motif && S.motif !== 'karte') || multiOn()) return false;
  return +S.fx.kipp > 0 || !!+S.fx.dreh;
}
/** Umrechnung Kartenpunkt → Kartenfeld (nur wenn gekippt/gedreht/3D-Ansicht), sonst null */
export function feldProjektion() {
  if (perspektiveAn()) {
    const P = kippProj(kippWinkel());
    return (x, y) => P.f(x, y);
  }
  return null;
}
/**
 * Perspektive: Die Karte liegt wie ein Tisch vor dem Betrachter und wird nach hinten gekippt.
 * f(x,y) → Punkt im Kartenfeld (0…MW, 0…MH) und Vergrößerung s; rect = sichtbarer Boden in Kartenkoordinaten.
 */
function kippProj(deg) {
  const v = app.S.view, z = v.z, MH = MW * v.a;
  const t = deg * Math.PI / 180, st = Math.sin(t), ct = Math.cos(t);
  // Drehung (Kompassrichtung oben), wie bei einer Landkarte, die man auf dem Tisch dreht
  const b = (+(app.S.fx && app.S.fx.dreh) || 0) * Math.PI / 180, cb = Math.cos(b), sb = Math.sin(b);
  const D = 1.25 * Math.max(MW, MH);
  const f = (x, y) => {
    const X0 = (x - v.cx) * z, Y0 = (y - v.cy) * z;
    const X = X0 * cb + Y0 * sb, Y = -X0 * sb + Y0 * cb;
    const s = D / Math.max(0.25 * D, D - Y * st);
    return [X * s + MW / 2, Y * ct * s + MH / 2, s];
  };
  const inv = (X, Y) => {
    X -= MW / 2; Y -= MH / 2;
    const Yg = Y * D / (D * ct + Y * st);
    const s = D / (D - Yg * st);
    const Xg = X / s;
    return [(Xg * cb - Yg * sb) / z + v.cx, (Xg * sb + Yg * cb) / z + v.cy];
  };
  const E = app.DATA.ext, m = 20;
  const c = [inv(-m, -m), inv(MW + m, -m), inv(-m, MH + m), inv(MW + m, MH + m)];
  const rect = [Math.max(E.x0, Math.min(...c.map(q => q[0]))), Math.max(E.y0, Math.min(...c.map(q => q[1]))), Math.min(E.x1, Math.max(...c.map(q => q[0]))), Math.min(E.y1, Math.max(...c.map(q => q[1])))];
  return { f, rect, z };
}
const PAAR = /(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g;
/** Fertigen Karteninhalt in die Perspektive umrechnen (Pfade, Linienstärken, Kachel-Ausschnitte) */
function kippen(o, P, extra = '') {
  const v = app.S.view;
  const pd = (d) => d.replace(PAAR, (m, a, b) => {
    const q = P.f(+a, +b);
    return q[0].toFixed(1) + ' ' + q[1].toFixed(1);
  });
  o = o.replace(/<path\b[^>]*>/g, el => {
    let sm = 1;
    el = el.replace(/ d="([^"]*)"/, (m, d) => {
      let n = 0, acc = 0;
      const nd = d.replace(PAAR, (mm, a, b) => {
        const q = P.f(+a, +b);
        acc += q[2]; n++;
        return q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      });
      if (n) sm = acc / n;
      return ` d="${nd}"`;
    });
    // Linien hinten dünner, vorne kräftiger
    return el.replace(/stroke-width="([\d.]+)"/, (m, w) => `stroke-width="${(+w * P.z * sm).toFixed(3)}"`);
  });
  // Kachel-Ausschnitte mitkippen
  const used = new Set();
  o = o.replace(/clip-path="url\(#tc(\d+)\)"/g, (m, i) => {
    used.add(+i);
    return `clip-path="url(#tk${i})"`;
  });
  let defs = '';
  used.forEach(i => {
    const r = app.DATA.tiles[i];
    if (!r) return;
    defs += `<clipPath id="tk${i}"><path d="${pd(`M${r[0]} ${r[1]}L${r[0] + r[2]} ${r[1]}L${r[0] + r[2]} ${r[1] + r[2]}L${r[0]} ${r[1] + r[2]}Z`)}"/></clipPath>`;
  });
  return `<g id="perspektive" transform="translate(${(v.cx - MW / 2 / v.z).toFixed(3)},${(v.cy - MW * v.a / 2 / v.z).toFixed(3)}) scale(${(1 / v.z).toFixed(6)})">` + (defs ? `<defs>${defs}</defs>` : '') + o + extra + '</g>';
}
/** Farbe abdunkeln (k > 0) oder aufhellen (k < 0); nur Hex-Farben */
function mischen(c, k) {
  let h = String(c || '').trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (!/^#[0-9a-f]{6}$/i.test(h)) return c;
  const n = parseInt(h.slice(1), 16), z = k > 0 ? 0 : 255, a = Math.abs(k);
  const ch = (v) => Math.round(v + (z - v) * a).toString(16).padStart(2, '0');
  return '#' + ch(n >> 16 & 255) + ch(n >> 8 & 255) + ch(n & 255);
}
/** Zufällige, aber feste Zahl 0…1 je Gebäude */
function zufall(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}
/**
 * 3D-Häuser: Grundriss wird nach oben gezogen (Wände + Dach), Häuser hinten zuerst gezeichnet.
 * Ohne Perspektive als Schrägansicht, mit Perspektive passend zum Kippwinkel.
 * Ergebnis in Kartenfeld-Koordinaten (0…MW, 0…MH).
 */
function haeuser3d(liste, P, forExport) {
  const v = app.S.view, z = v.z, MH = MW * v.a, D = app.DATA;
  const pr = P ? P.f : (x, y) => [(x - v.cx) * z + MW / 2, (y - v.cy) * z + MH / 2, 1];
  // Meter je Kartenfeld-Punkt
  const my = D.proj.y0 + (D.ext.y0 + D.ext.y1) / 2 / D.proj.sc;
  const mpu = 40075016.686 * Math.cos(Math.atan(Math.sinh(Math.PI * (1 - 2 * my)))) / D.proj.sc / z;
  // Höhen überhöhen, damit sie im Poster wirken (große Städte stärker)
  const ueber = Math.max(2, Math.min(4.5, 2 * mpu / 1.1));
  const winkel = Math.max(kippWinkel(), 35) * Math.PI / 180;
  const k = ueber / mpu * Math.sin(winkel);
  const paper = app.S.bg !== 'none' ? app.S.bg : '#ffffff';
  const sw = app.S.scale;
  const H = [];
  liste.forEach(({ ft, e }) => {
    const rings = [];
    ft.d.split('M').forEach(r => {
      if (!r) return;
      const pts = [];
      r.replace(PAAR, (m, a, b) => {
        pts.push(pr(+a, +b));
        return m;
      });
      if (pts.length > 2) rings.push(pts);
    });
    if (!rings.length) return;
    let hm = ft.h || 0;
    if (hm <= 5.5) hm = 5 + zufall(ft.id) * 4; // unbekannt: Wohnhaus 5–9 m
    let maxY = -1e9;
    rings[0].forEach(q => (maxY = Math.max(maxY, q[1])));
    H.push({ rings, hm, maxY, e });
  });
  H.sort((a, b) => a.maxY - b.maxY);
  let o = '';
  H.forEach(({ rings, hm, e }) => {
    const roof = e.f && e.f !== 'none' ? e.f : paper;
    const lw = +(e.w * sw * 0.8).toFixed(3);
    let sued = '', ost = '', west = '', dach = '';
    const sign0 = Math.sign(flaeche(rings[0])) || 1;
    rings.forEach((R, ri) => {
      // Löcher (Innenhöfe) laufen andersherum; dort liegt das Haus außerhalb des Rings
      const sr = Math.sign(flaeche(R)) || 1;
      const sg = ri && sr !== sign0 ? -sr : sr;
      const n = R.length;
      for (let i = 0; i < n; i++) {
        const a = R[i], b = R[(i + 1) % n];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const ny = -dx * sg; // Außennormale (y-Anteil); > 0 = zeigt zum Betrachter
        if (ny <= 0) continue;
        if (!forExport && Math.abs(dx) + Math.abs(dy) < 0.4) continue; // winzige Wandstücke: am Bildschirm unsichtbar
        const ha = hm * k * a[2], hb = hm * k * b[2];
        const q = `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${b[0].toFixed(1)} ${(b[1] - hb).toFixed(1)}L${a[0].toFixed(1)} ${(a[1] - ha).toFixed(1)}Z`;
        const nx = dy * sg;
        if (Math.abs(nx) < ny * 0.6) sued += q; else if (nx > 0) ost += q; else west += q;
      }
      dach += R.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + (q[1] - hm * k * q[2]).toFixed(1)).join('') + 'Z';
    });
    const st = `stroke="${e.s}" stroke-width="${lw}" stroke-linejoin="round"`;
    if (west) o += `<path d="${west}" fill="${mischen(roof, 0.12)}" ${st}/>`;
    if (sued) o += `<path d="${sued}" fill="${mischen(roof, 0.22)}" ${st}/>`;
    if (ost) o += `<path d="${ost}" fill="${mischen(roof, 0.34)}" ${st}/>`;
    o += `<path d="${dach}" fill="${roof}" fill-rule="evenodd" ${st}/>`;
  });
  return o;
}
/** Vorzeichenbehaftete Fläche eines Rings (Bildschirm-Koordinaten) */
function flaeche(R) {
  let a = 0;
  for (let i = 0, n = R.length; i < n; i++) {
    const p = R[i], q = R[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}
/** Hülle, die Kartenfeld-Koordinaten in die Kartenansicht setzt */
function feldGruppe(id, inhalt) {
  const v = app.S.view;
  return `<g id="${id}" transform="translate(${(v.cx - MW / 2 / v.z).toFixed(3)},${(v.cy - MW * v.a / 2 / v.z).toFixed(3)}) scale(${(1 / v.z).toFixed(6)})">${inhalt}</g>`;
}

/** Höhendaten laden (für Höhenlinien und Relief) – liefert sie, sobald sie da sind */
function hoehenDaten() {
  const D = app.DATA;
  if (D._contours) return D._contours;
  if (!D._contoursErr && !D._contoursP) contours(D).then(() => render()).catch(e => {
    D._contoursErr = true;
    console.warn('Höhendaten', e);
    msg('Höhendaten konnten nicht geladen werden', 'err');
  });
  return null;
}

/**
 * Vorschaubild: SVG einmalig in ein kleines Bild umrechnen. Ein fertiges kleines Bild kostet beim
 * Bildschirm-Neuzeichnen fast nichts – eine volle Karte als SVG-Bild dagegen jedes Mal sehr viel.
 * @returns {Promise<string>} Blob-URL (PNG)
 */
export async function alsBild(svg, w = 240) {
  const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = u;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.max(1, Math.round(w * (img.naturalHeight || 1) / (img.naturalWidth || 1)));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const b = await new Promise(r => c.toBlob(r, 'image/png'));
    return URL.createObjectURL(b);
  } finally {
    URL.revokeObjectURL(u);
  }
}
/** SVG für ein Vorschaubild: winzige Details (im kleinen Bild unsichtbar) werden weggelassen */
export function vorschauSVG() {
  app.vorschau = true;
  try {
    return buildSVG(true);
  } finally {
    app.vorschau = false;
  }
}

export function mapContent(forExport, vr) {
  let o = '';
  // Mehrere Orte: Kreise nebeneinander (TCP.p ≠ 'tc' heißt: wir zeichnen gerade einen der Orte)
  if (multiOn() && TCP.p === 'tc') return multiSVG(forExport);
  // Koordinaten-Poster statt Karte (fest im Poster, unabhängig vom Kartenausschnitt)
  if (app.S.motif === 'koord' && app.S.koord) {
    const v = app.S.view,
      MH = MW * v.a,
      K = app.S.koord;
    return `<g transform="translate(${(v.cx - MW / 2 / v.z).toFixed(3)},${(v.cy - MH / 2 / v.z).toFixed(3)}) scale(${(1 / v.z).toFixed(6)})">` + koordSVG({ lat: K.lat, lon: K.lon, name: app.S.title.text || '', text: K.text || '', ink: inkColor(app.S), bg: app.S.bg, align: K.align }, MW, MH) + '</g>';
  }
  // Wortwolke statt Karte
  if (app.S.motif === 'wolke' && app.S.wolke) {
    const v = app.S.view,
      MH = MW * v.a,
      S = app.S;
    const bg = S.bg === 'none' ? '#ffffff' : S.bg;
    const farben = [...new Set([inkColor(S), S.cls.haupt.s, S.bar.color, S.frame.color, S.cls.wasser.s, S.cls.wasser.f])].filter(c => c && c !== 'none' && c !== bg && kontrast(c, bg) >= 1.9).slice(0, 3);
    if (!farben.length) farben.push(lum(bg) > 0.4 ? '#1b1f2a' : '#ffffff');
    return `<g transform="translate(${(v.cx - MW / 2 / v.z).toFixed(3)},${(v.cy - MH / 2 / v.z).toFixed(3)}) scale(${(1 / v.z).toFixed(6)})">` + (S.bg !== 'none' ? `<rect width="${MW}" height="${MH.toFixed(1)}" fill="${S.bg}"/>` : '') + wolkeSVG({ text: S.wolke.text, form: S.wolke.form, schrift: !!S.wolke.schrift, farben }, MW, MH) + '</g>';
  }
  // Sternenhimmel statt Karte: Kreis füllt die Kartenfläche, unabhängig vom Kartenausschnitt
  if (app.S.motif === 'sterne' && app.S.sky) {
    const v = app.S.view,
      R = Math.min(MW, MW * v.a) / 2 / v.z;
    if (!skyReady()) loadSky().then(() => render());
    return skySVG(app.S.sky, v.cx, v.cy, R, forExport ? 'hx' : 'hv');
  }
  const sc = app.S.scale * (app.S.pop && app.S.pop.pal ? 1 : strichFaktor()) / app.S.view.z;
  if (app.S.mode === 'std' && std3d()) {
    const K = kameraBild();
    // 2 Punkte Überstand, damit an den Rändern keine Lücke durchblitzt
    if (K) return feldGruppe('kamera', `<image href="${K.url}" x="-2" y="-2" width="${MW + 4}" height="${(MW * app.S.view.a + 4).toFixed(2)}" preserveAspectRatio="none"/>`);
    if (!forExport) scheduleKamera(60);
  }
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
  const fx = app.S.fx || {};
  const P = perspektiveAn() ? kippProj(kippWinkel()) : null;
  if (P) vr = P.rect;
  // Relief (Berge schattiert): über Wiesen/Wasser, unter Wegen, Straßen und Häusern
  let relief = '';
  if (fx.relief && !P) {
    const C = hoehenDaten();
    const R = C && reliefBild(app.DATA);
    if (R) relief = `<image id="relief" href="${R.url}" x="${R.x.toFixed(2)}" y="${R.y.toFixed(2)}" width="${R.w.toFixed(2)}" height="${R.h.toFixed(2)}" preserveAspectRatio="none"/>`;
  }
  const pop = app.S.pop && app.S.pop.pal;
  if (pop) o += `<defs>${popDefs()}</defs>` + popSymbols(app.DATA, app.S, vr, pop);
  // Pop-Art: Straßen/Wasser im selben Maßstab wie die Symbole
  const pk = pop ? popK(app.DATA, app.S) : 1;
  // Höhenlinien als unterste Ebene (Hauptlinien jede 5. Linie kräftiger)
  const HO = app.S.hoehen;
  if (HO && HO.on) {
    const C = hoehenDaten();
    if (C) {
      const col = HO.c || app.S.cls.haupt.s;
      const w = (HO.w || 1) * app.S.scale / app.S.view.z;
      o += `<g id="hoehenlinien" fill="none" stroke="${col}" stroke-linejoin="round" stroke-linecap="round"><path d="${C.minor}" stroke-width="${(0.55 * w).toFixed(3)}" stroke-opacity=".42"/><path d="${C.major}" stroke-width="${(1.15 * w).toFixed(3)}" stroke-opacity=".62"/></g>`;
    }
  }
  // Schatten der Häuser: Licht von links oben, Schatten fällt nach rechts unten
  const h3d = !!fx.h3d && !pop;
  const klein = app.vorschau ? 5 / app.S.view.z : 0;
  const winzig = !forExport && !app.vorschau ? 1.1 / app.S.view.z : 0;
  // Bildschirm, nur umfärbbar: ausgeblendete Klassen unsichtbar mitzeichnen (Stilwechsel ohne Neuaufbau)
  const farbModus = !forExport && !klein && TCP.p === 'tc' && nurFarbe();
  /** @type {{ft:any, e:any}[]} */
  const haus3 = [];
  const schatten = fx.schatten && !h3d ? new Map() : null;
  const su = (P ? app.S.scale : app.S.scale / app.S.view.z) * 2.6;
  ORDER.forEach(k => {
    if (k === 'weg') o += relief;
    const groups = new Map();
    app.DATA.feats.forEach(ft => {
      if (ft.k !== k) return;
      const e = eff(ft);
      const ovH = app.S.ov[ft.id] && app.S.ov[ft.id].h != null;
      if (e.h && (forExport || ovH || !farbModus)) return;
      const bx = ft.bx;
      if (bx[2] < vr[0] || bx[0] > vr[2] || bx[3] < vr[1] || bx[1] > vr[3]) return;
      // Vorschaubild: Teile unter ~5 Poster-Punkten sind dort kleiner als ein Bildpunkt
      if (klein && Math.max(bx[2] - bx[0], bx[3] - bx[1]) < klein) return;
      // Bildschirm, weit herausgezoomt: Häuser unter ~1 Poster-Punkt sind kleiner als ein Pixel → weglassen (Export zeichnet alle)
      if (winzig && k === 'haus' && Math.max(bx[2] - bx[0], bx[3] - bx[1]) < winzig) return;
      if (h3d && k === 'haus') {
        // Vorschau am Bildschirm: Häuser unter ~2 Poster-Punkten sind kleiner als ein Bildpunkt → weglassen (Export zeichnet alle)
        if (ft.a && (forExport || Math.max(bx[2] - bx[0], bx[3] - bx[1]) * app.S.view.z >= 2)) haus3.push({ ft, e });
        return;
      }
      const lc = k === 'haus' ? 'stroke-linejoin="miter"' : 'stroke-linecap="round" stroke-linejoin="round"';
      let fill = ft.a ? e.f : 'none';
      // Pop-Art: jedes Haus bekommt eine feste Zufallsfarbe (außer es wurde einzeln umgefärbt)
      if (pop && k === 'haus' && !(app.S.ov[ft.id] && app.S.ov[ft.id].f)) fill = popColor(ft.id, pop);
      // Mit Schatten: leere Häuser mit Papierfarbe füllen, sonst scheint der Schatten durch
      if (schatten && k === 'haus' && ft.a && fill === 'none') fill = app.S.bg !== 'none' ? app.S.bg : '#ffffff';
      const p = `<path id="${ft.fid}" d="${ft.d}" fill="${fill}" fill-rule="evenodd" stroke="${e.s}" stroke-width="${+(e.w * sc * pk).toFixed(3)}" ${lc}${forExport ? '' : ' data-k="' + k + '" data-g="' + ft.id + '"' + (ft.a ? ' data-a="1"' : '') + (e.h ? ' display="none"' : '')}/>`;
      const t = ft.t ?? -1;
      if (!groups.has(t)) groups.set(t, []);
      groups.get(t).push(p);
      if (schatten && k === 'haus' && ft.a) {
        if (!schatten.has(t)) schatten.set(t, []);
        schatten.get(t).push(`<path d="${ft.d}"/>`);
      }
    });
    if (schatten && k === 'haus' && schatten.size) {
      const dunkel = app.S.bg !== 'none' && lum(app.S.bg) < 0.35;
      o += `<g id="schatten" fill="#000" fill-opacity="${dunkel ? 0.55 : 0.22}" fill-rule="evenodd" transform="translate(${su.toFixed(3)},${(su * 1.25).toFixed(3)})">`;
      schatten.forEach((arr, t) => {
        o += t >= 0 ? `<g clip-path="url(#${TCP.p}${t})">${arr.join('')}</g>` : arr.join('');
      });
      o += '</g>';
    }
    groups.forEach((arr, t) => {
      o += t >= 0 ? `<g clip-path="url(#${TCP.p}${t})">${arr.join('')}</g>` : arr.join('');
    });
  });
  // 3D-Häuser zuletzt: sie verdecken Straßen dahinter
  const h3 = haus3.length ? haeuser3d(haus3, P, forExport) : '';
  if (P) o = kippen(o, P, h3 ? `<g id="haeuser3d">${h3}</g>` : '');
  else if (h3) o += feldGruppe('haeuser3d', h3);
  }
  return o;
}

/** Kennung der Kachel-Ausschnitte (bei mehreren Orten je Ort eigene) */
export const TCP = { p: 'tc' };
/** Viele Linien im Poster (Stadt)? Dann teure Effekte wie Überblendungen weglassen */
export function karteSchwer() {
  return !!(MC.node && MC.node.getElementsByTagName('path').length > 6000);
}

/* ---------- Zwischenspeicher für die Karte ----------
   Text-, Rahmen- oder Designänderungen bauen die Karte nicht neu auf: Der fertige
   Karten-Knoten wird wiederverwendet. Beim Verschieben wird nur die Ansicht versetzt. */
const MC = { key: '', node: null, hits: null, rect: null, z: 0 };
function mapKey() {
  const S = app.S;
  return JSON.stringify([app.DATA && app.DATA.place, app.DATA && app.DATA.feats.length, app.DATA && app.DATA.ext, S.cls, S.ov, S.scale, S.mode, S.base, S.labels, S.pop, S.view.z, S.motif, S.hoehen, !!(app.DATA && app.DATA._contours), multiKey(), multiOn() ? [S.view.cx, S.view.cy, S.view.a, S.bg, S.title.color, S.sub.font] : 0, S.motif === 'sterne' ? [S.sky, S.view.cx, S.view.cy, S.view.a, skyReady()] : 0, S.motif === 'wolke' || S.motif === 'koord' ? schriftenBereit() : 0, S.motif === 'wolke' ? [S.wolke, S.bg, S.cls.haupt.s, S.bar.color, S.frame.color, S.view.cx, S.view.cy, S.view.a] : 0, S.motif === 'koord' ? [S.koord, S.title.text, S.bg, S.view.cx, S.view.cy, S.view.a, S.cls.haupt.s, S.bar.color, S.frame.color] : 0, S.mode === 'std' ? [!!RASTER.get(rasterKey()), detailRaster() ? detailRaster().url.length + detailRaster().rect.join() : 0] : 0, S.fx ? [S.fx.schatten, S.fx.relief, S.fx.kipp, S.fx.h3d, S.fx.dreh, S.fx.gelaende] : 0, perspektiveAn() || (S.fx && S.fx.h3d) ? [S.view.cx, S.view.cy, S.view.a] : 0, std3d() ? [kameraKey(), !!kameraBild()] : 0, !!(app.DATA && app.DATA._relief)]);
}
/** Sichtbarer Bereich plus großzügiger Rand, damit Verschieben ohne Neuzeichnen geht */
function cullRect() {
  const v = visRect(), w = v[2] - v[0], h = v[3] - v[1], E = app.DATA.ext;
  // Vorrat rundherum (zum Ziehen): 60 % je Seite – in dichten Städten weniger, damit nicht ein
  // Vielfaches des Sichtbaren gezeichnet wird (höchstens ≈ 2,6 × so viele Elemente wie sichtbar erlaubt)
  const sicht = dichte() * w * h;
  const r = sicht > 0 ? Math.max(0.2, Math.min(0.6, (Math.sqrt((SICHTBAR_MAX() * 2.6) / sicht) - 1) / 2)) : 0.6;
  return [Math.max(E.x0, v[0] - w * r), Math.max(E.y0, v[1] - h * r), Math.min(E.x1, v[2] + w * r), Math.min(E.y1, v[3] + h * r)];
}
function cacheCovers() {
  if (!MC.node || !MC.rect) return false;
  const v = visRect(), r = MC.rect, E = app.DATA.ext, eps = 0.5;
  return (v[0] >= r[0] - eps || r[0] <= E.x0 + eps) && (v[1] >= r[1] - eps || r[1] <= E.y0 + eps) && (v[2] <= r[2] + eps || r[2] >= E.x1 - eps) && (v[3] <= r[3] + eps || r[3] >= E.y1 - eps);
}
/** Kartenknoten (und Klickflächen) holen – aus dem Zwischenspeicher oder neu bauen */
/** Zwischenspeicher-Schlüssel ohne Farben/Linienstärken (nur, was sichtbar ist) */
function formKey() {
  // nur für gezeichnete Karten ohne Sonderfälle – Textmotive brauchen die Farben im Schlüssel
  if (!nurFarbe()) return null;
  const S = app.S;
  const cls = S.cls;
  S.cls = {};
  try {
    return mapKey();
  } finally {
    S.cls = cls;
  }
}
/** Darf die vorhandene Karte nur umgefärbt werden? (keine Einzelfarben, Pop-Art, Schatten, 3D …) */
function nurFarbe() {
  const S = app.S, fx = S.fx || {};
  return S.mode === 'art' && (!S.motif || S.motif === 'karte') && !multiOn() && !(S.pop && S.pop.pal) && !Object.keys(S.ov || {}).length && !fx.schatten && !fx.h3d && !perspektiveAn() && !(S.hoehen && S.hoehen.on);
}
/**
 * Stilwechsel: Statt die ganze Karte neu aufzubauen (tausende Häuser), nur Farben und
 * Linienstärken der vorhandenen Linien ändern – viel schneller, vor allem in Städten.
 */
function umfaerben(node) {
  const S = app.S, sc = S.scale * strichFaktor() / S.view.z;
  const wert = {};
  Object.entries(S.cls).forEach(([k, c]) => (wert[k] = [c.s, c.f, String(+(c.w * sc).toFixed(3)), !!c.h]));
  for (const p of node.querySelectorAll('path[data-k]')) {
    const w = wert[p.dataset.k];
    if (!w) continue;
    p.setAttribute('stroke', w[0]);
    p.setAttribute('fill', p.dataset.a ? w[1] : 'none');
    p.setAttribute('stroke-width', w[2]);
    if (w[3]) p.setAttribute('display', 'none');
    else p.removeAttribute('display');
  }
}
function mapNodes() {
  const key = mapKey();
  // Klickflächen (unsichtbare breite Linien) braucht nur das Auswahl-Werkzeug – im Assistenten
  // (Verschieben) wären es bei Städten zehntausende überflüssige Elemente
  const klick = app.tool !== 'move';
  const passt = cacheCovers() && (MC.klick || !klick);
  if (key === MC.key && passt) return MC;
  const fk = formKey();
  if (fk && MC.node && fk === MC.fk && MC.farbe && passt) {
    umfaerben(MC.node);
    MC.key = key;
    return MC;
  }
  const rect = cullRect();
  // Einlesen über den HTML-Parser (template) – rund 3,5× schneller als DOMParser mit XML
  const tpl = document.createElement('template');
  tpl.innerHTML = `<svg xmlns="${NS}"><g id="kartenInhalt">${mapContent(false, rect)}</g></svg>`;
  const node = document.adoptNode(tpl.content.firstChild.firstChild);
  // Klickflächen: breite unsichtbare Linien, damit man dünne Straßen gut trifft
  const hits = document.createElementNS(NS, 'g');
  const hw = (12 / app.S.view.z).toFixed(2);
  // In der Perspektive passen die Klickflächen nicht zur Ansicht → dann keine
  if (klick && !perspektiveAn() && !(app.S.fx && app.S.fx.h3d)) node.querySelectorAll('path[data-k]:not([display])').forEach(p => {
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
  Object.assign(MC, { key, fk, farbe: nurFarbe(), node, hits, rect, z: app.S.view.z, klick });
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
  // 3D-Ansicht (Landkarte): neues Kamerabild kurz nach dem Loslassen
  if (std3d()) scheduleKamera();
  // Auch gekippt/3D: während des Ziehens das fertige Bild nur verschieben (flüssig),
  // die genaue Perspektive wird 140 ms nach der letzten Bewegung neu berechnet.
  // Mitten im Ziehen nie neu aufbauen (bei Städten ≈ 0,5 s Stillstand): der Rand bleibt kurz leer
  // und wird nach dem Loslassen gefüllt – wie bei Online-Karten
  const zieht = !!app.drag || (app.PTS && app.PTS.size > 1);
  if (!inner || !MC.node || (!cacheCovers() && !zieht)) {
    render();
    return;
  }
  const g = geo();
  const t = vT(g);
  // Linienstärken sind für den alten Zoom berechnet – bis zum Neuzeichnen proportional mitskalieren.
  // CSS-Transform auf der eigenen Kartenebene: der Browser verschiebt das fertige Bild (kein Neumalen).
  if (inner.style.willChange) inner.style.transform = vTcss(g);
  else inner.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  const pa = app.poster.querySelector('#pinsAnsicht');
  if (pa) pa.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  const ea = app.poster.querySelector('#einsatzAnsicht');
  if (ea) ea.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  const oa = app.poster.querySelector('#orteAnsicht');
  if (oa) oa.setAttribute('transform', t.replace(/^translate\([^)]*\) /, ''));
  // Klickflächen: mit eigener Kartenebene erst beim Neuzeichnen (während des Ziehens klickt niemand)
  if (MC.hits && !inner.style.willChange) MC.hits.setAttribute('transform', t);
  if (app.sel.size || app.selCls) drawSel();
  syncTools();
  nachladenPruefen();
  clearTimeout(fullTimer);
  fullTimer = window.setTimeout(vollNachZiehen, 140);
}
/** Volles Neuzeichnen nach der Bewegung – solange noch gezogen wird, warten */
function vollNachZiehen() {
  if (app.drag || (app.PTS && app.PTS.size > 1)) {
    fullTimer = window.setTimeout(vollNachZiehen, 120);
    return;
  }
  app.einblenden = true;
  render();
}
/** Schriftbreite messen (Schriften sind im Dokument geladen) */
let MESS = null;
export function passendeGroesse(text, font, size, ls, maxW) {
  if (typeof document === 'undefined') return size;
  if (!MESS) MESS = document.createElement('canvas').getContext('2d');
  MESS.font = `${size}px ${font}`;
  const w = MESS.measureText(text).width + ls * [...text].length;
  return w > maxW && w > 0 ? size * maxW / w : size;
}
/** Sind die Schriften geladen? (Textmotive messen damit – vorher gemessen = falsche Umbrüche) */
export function schriftenBereit() {
  try {
    return ['SgXB', 'SgMD', 'SgSC', 'SgBR', 'SgBE'].map(f => document.fonts.check('30px ' + f)).join('');
  } catch (e) {
    return '';
  }
}

/** Kontrastverhältnis zweier Farben (1 = gleich, 21 = schwarz/weiß) */
function kontrast(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/* ---------- Typografie-Design: riesige Buchstaben über der Karte ---------- */
/** Einstellungen der Typografie: eigene Wahl (S.typo) vor Vorgabe des Designs */
export function typoOpt() {
  const L = { ...LAY_DEFAULT, ...(app.S.lay || {}) },
    T = app.S.typo || {};
  const zahl = (v, d) => (v === '' || v == null || Number.isNaN(+v) ? d : +v);
  return {
    stil: T.stil || L.typoStil || 'voll',
    schrift: T.schrift || L.typoSchrift || 'SgXB',
    zeilen: zahl(T.zeilen, L.typoZeilen || 0),
    farbe: /^#[0-9a-f]{3,8}$/i.test(T.farbe || '') ? T.farbe : '',
    deck: zahl(T.deck, -1)
  };
}
/** Schreib- und Pinselschriften wirken in normaler Schreibweise, Blockschriften in Großbuchstaben */
const FEIN = { SgBR: 1, SgSC: 1, SgFR: 1 };
/** Ortsname in 1–4 Zeilen gleichmäßig aufteilen (BARCELONA → BAR/CEL/ONA) */
export function typoLines(text, zeilen, schrift) {
  const fein = schrift && FEIN[schrift];
  const roh = String(text || '').trim();
  if (!roh) return [];
  // Schreibschrift: ganze Wörter behalten
  if (fein) {
    const w = roh.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase()).split(/\s+/);
    const n = Math.max(1, Math.min(w.length, zeilen || (w.length > 2 ? 2 : w.length)));
    const out = [];
    for (let r = 0, i = 0; r < n; r++) {
      const k = Math.ceil((w.length - i) / (n - r));
      out.push(w.slice(i, i + k).join(' '));
      i += k;
    }
    return out;
  }
  const t = [...roh.replace(/\s+/g, '').toUpperCase()];
  const n = Math.max(1, Math.min(4, zeilen || Math.ceil(t.length / 3)));
  const out = [];
  let i = 0;
  for (let r = 0; r < n; r++) {
    const k = Math.ceil((t.length - i) / (n - r));
    out.push(t.slice(i, i + k).join(''));
    i += k;
  }
  return out.filter(Boolean);
}
/** Buchstaben als <text>-Elemente (für Füllung, Umriss und als Schnittmaske) */
export function typoTexte(g) {
  const S = app.S;
  if (!S.title.on || !S.title.text) return null;
  const O = typoOpt();
  const lines = typoLines(S.title.text, O.zeilen, O.schrift);
  if (!lines.length) return null;
  const fein = !!FEIN[O.schrift];
  // Breite je Zeile messen (Schriften sind verschieden breit)
  const breit = lines.map(l => breite(l, O.schrift) + (fein ? 0 : 0.06 * [...l].length));
  const wmax = Math.max(...breit);
  const lf = fein ? 1.08 : 0.98;
  const size = Math.min((MW * 0.86) / wmax, (g.MH * 0.8) / (lines.length * lf), g.MH * 0.62);
  const lh = size * lf;
  const ls = fein ? 0 : size * 0.06;
  const cap = size * (CAP[O.schrift] || 0.72);
  const blockH = cap + lh * (lines.length - 1);
  const y0 = g.my + (g.MH - blockH) / 2 + cap - g.MH * 0.03;
  const at = `font-family="${O.schrift}" font-size="${size.toFixed(1)}" letter-spacing="${ls.toFixed(1)}" text-anchor="middle"`;
  const texte = lines.map((l, i) => `<text ${at} x="${(g.W / 2 + ls / 2).toFixed(1)}" y="${(y0 + i * lh).toFixed(1)}">${esc(l)}</text>`).join('');
  return { texte, O, size };
}
/** Breite eines Textes relativ zur Schriftgröße 1 */
function breite(t, font) {
  if (typeof document === 'undefined') return [...t].length * 0.7;
  if (!MESS) MESS = document.createElement('canvas').getContext('2d');
  MESS.font = `100px ${font}`;
  return MESS.measureText(t).width / 100;
}
function typoSVG(g) {
  const S = app.S;
  const T = typoTexte(g);
  if (!T) return '';
  const { O, size } = T;
  const paper = S.bg === 'none' ? '#ffffff' : S.bg;
  const light = lum(paper) < 0.45;
  const col = O.farbe || (light ? '#ffffff' : S.cls.haupt.s);
  const op = O.deck >= 0 ? O.deck : light ? 0.86 : 0.8;
  let o;
  if (O.stil === 'umriss') o = `<g id="titel" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${Math.max(2, size * 0.022).toFixed(1)}" stroke-linejoin="round">${T.texte}</g>`;
  else if (O.stil === 'schnitt') o = `<g id="titel" fill="none" stroke="${O.farbe || typoTinte()}" stroke-width="${Math.max(1.5, size * 0.008).toFixed(1)}" stroke-opacity=".9">${T.texte}</g>`;
  else o = `<g id="titel" fill="${col}" fill-opacity="${op}">${T.texte}</g>`;
  // Untertitel / Koordinaten klein am unteren Kartenrand
  const bits = [S.sub.on && S.sub.text ? S.sub.text : '', g.L.coords ? coordText() : '', g.note || ''].filter(Boolean);
  const bc = O.stil === 'schnitt' ? typoTinte() : col;
  if (bits.length) o += `<text id="untertitel" x="${(g.W / 2 + 1.5).toFixed(1)}" y="${(g.my + g.MH - Math.max(26, g.MH * 0.035)).toFixed(1)}" text-anchor="middle" font-family="SgMD" font-size="${Math.round(Math.max(18, (S.sub.size || 30) * 0.8))}" letter-spacing="3" fill="${bc}" fill-opacity="${O.stil === 'schnitt' ? 0.9 : op}">${esc(bits.join('  ·  '))}</text>`;
  return o;
}
/** „Karte in Buchstaben“: Papier außerhalb der Buchstaben und Schriftfarbe darauf */
export function typoPapier() {
  const bg = app.S.bg === 'none' ? '#ffffff' : app.S.bg;
  return lum(bg) > 0.7 ? '#1d2230' : '#ffffff';
}
function typoTinte() {
  return lum(typoPapier()) > 0.5 ? (lum(app.S.bg === 'none' ? '#fff' : app.S.bg) < 0.5 ? app.S.bg : '#1b1f2a') : '#ffffff';
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
  if (kippWinkel() && app.S.bg !== 'none' && !std3d()) {
    const h = g.MH * (0.12 + kippWinkel() / 60 * 0.16);
    o += `<defs><linearGradient id="gDunst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${app.S.bg}" stop-opacity=".95"/><stop offset="1" stop-color="${app.S.bg}" stop-opacity="0"/></linearGradient></defs>`;
    o += `<g clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><rect id="dunst" width="${MW}" height="${h.toFixed(1)}" fill="url(#gDunst)"/></g></g></g>`;
  }
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
/** Route im Kartenfeld (gekippt/gedreht oder 3D-Ansicht) */
function routeFeld(K, pf) {
  const R = app.S.route;
  if (!R || !R.pts || R.pts.length < 2) return '';
  let xy = K ? K.route : null;
  if (!K && pf) {
    const P = app.DATA.proj;
    xy = R.pts.map(p => {
      const mx = (p[0] + 180) / 360, s = Math.sin(p[1] * Math.PI / 180);
      const my = 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
      return pf((mx - P.x0) * P.sc, (my - P.y0) * P.sc);
    });
  }
  if (!xy || xy.length < 2) return '';
  const w = R.w || 7, c = R.c || '#d64545';
  const d = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  return `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${(w * 1.9).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}"${routeStrich(R, w)} stroke-linecap="round" stroke-linejoin="round"/>`;
}
/**
 * Linien passend zum Maßstab: Die Strichstärken der Stile sind für ein Dorf (≈1,2 km Ausschnitt)
 * gemacht. Zeigt das Poster mehr Fläche (Stadt, „Mit Umgebung“), liegen die Straßen dichter –
 * dann werden alle Linien feiner (wie bei gedruckten Karten), höchstens bis 40 %.
 */
export function strichFaktor() {
  const D = app.DATA, S = app.S;
  if (!D || !D.proj || !S || !(S.view.z > 0)) return 1;
  const lat = (D.center && D.center[1]) || 50;
  const meter = (MW / S.view.z) * 40075016.7 * Math.cos(lat * Math.PI / 180) / D.proj.sc;
  if (!(meter > 0)) return 1;
  return Math.max(0.4, Math.min(1, Math.pow(1200 / meter, 0.65)));
}
/** Ortsnamen an? (nur gezeichnete Karte – Landkarten-Stile bringen eigene Beschriftung mit) */
export function ortsnamenAn() {
  const S = app.S;
  return !!(S.ortsnamen && S.mode !== 'std' && app.DATA && app.DATA.orte && app.DATA.orte.length && (!S.motif || S.motif === 'karte') && !multiOn() && !(S.fx && S.fx.h3d));
}
const ORT_GR = [0, 30, 22, 15, 11.5];
/** Ortsnamen in eigener Ebene über der Karte – Schriftgröße auf dem Poster fest, Überlappungen werden weggelassen */
function ortsnamenSVG(g) {
  if (!ortsnamenAn()) return '';
  const S = app.S, k = 1 / S.view.z, r = visRect(), pf = feldProjektion();
  const farbe = (S.cls.haupt && !S.cls.haupt.h && S.cls.haupt.s) || S.title.color || '#262c3a';
  const grund = S.bg && S.bg !== 'none' ? S.bg : '#ffffff';
  const selbst = String(app.DATA.place || '').toLowerCase();
  const platz = [];
  let o = '';
  app.DATA.orte
    .filter(q => q.x > r[0] && q.x < r[2] && q.y > r[1] && q.y < r[3] && q.n.toLowerCase() !== selbst)
    .sort((a, b) => a.c - b.c)
    .slice(0, 80)
    .forEach(q => {
      const gr = ORT_GR[q.c] * (pf ? 1 : k), ls = gr * 0.12;
      const w = q.n.length * (gr * 0.68 + ls) / 2 + gr * 0.4, h = gr * 0.75;
      const box = [q.x - w, q.y - h, q.x + w, q.y + h];
      // ganz im sichtbaren Bereich, sonst am Rand abgeschnitten
      if (!pf && (box[0] < r[0] || box[2] > r[2] || box[1] < r[1] || box[3] > r[3])) return;
      if (platz.some(b => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return;
      platz.push(box);
      const xy = pf ? pf(q.x, q.y) : [q.x, q.y];
      if (!xy) return;
      o += `<text x="${xy[0].toFixed(1)}" y="${xy[1].toFixed(1)}" font-size="${gr.toFixed(2)}" letter-spacing="${ls.toFixed(2)}"${q.c >= 4 ? ' font-style="italic"' : ''}>${esc(q.c <= 3 ? q.n.toUpperCase() : q.n)}</text>`;
    });
  if (!o) return '';
  const sw = (pf ? 1 : k) * 3.2;
  const kopf = `<g font-family="SgMD" text-anchor="middle" dominant-baseline="central" fill="${farbe}" stroke="${grund}" stroke-width="${sw.toFixed(2)}" stroke-linejoin="round" paint-order="stroke">`;
  if (pf) return `<g id="orte" clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)">${kopf}${o}</g></g></g></g>`;
  return `<g id="orte" clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g id="orteAnsicht" transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">${kopf}${o}</g></g></g></g></g>`;
}
/** Pins als SVG – in eigener Ebene über der Karte, Größe unabhängig vom Zoom */
function pinsSVG(g, forExport) {
  const pins = app.S.pins || [];
  const route = app.S.route ? routeSVG() : '';
  if ((!pins.length && !route) || app.S.motif === 'sterne' || app.S.motif === 'koord' || app.S.motif === 'wolke' || multiOn()) return '';
  const v = app.S.view,
    k = 1 / v.z,
    sz = (app.S.pinSize || 1) * 1.25;
  const col = app.S.pinColor || '#d64545';
  // Gekippt/gedreht oder 3D-Ansicht: Markierungen ins Kartenfeld umrechnen (dort nicht verschiebbar)
  const K = std3d() ? kameraBild() : null;
  const pf = K ? null : feldProjektion();
  if (std3d() || pf) {
    if (std3d() && !K) return '';
    let q = `<g id="pins" clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)">`;
    q += routeFeld(K, pf);
    pins.forEach((p, i) => {
      const xy = K ? K.pins[i] : pf(+p.x, +p.y);
      if (!xy) return;
      const S = PIN_SHAPES[p.i] || PIN_SHAPES.herz;
      q += `<g transform="translate(${xy[0].toFixed(2)},${xy[1].toFixed(2)}) scale(${sz.toFixed(4)})"><path d="${S.d}" fill="${col}" fill-rule="evenodd" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"/></g>`;
    });
    return q + '</g></g></g>';
  }
  let o = `<g id="pins" clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g id="pinsAnsicht" transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">` + route;
  pins.forEach((p, i) => {
    const S = PIN_SHAPES[p.i] || PIN_SHAPES.herz;
    const s = (k * sz).toFixed(4);
    o += `<g transform="translate(${(+p.x).toFixed(2)},${(+p.y).toFixed(2)}) scale(${s})"${forExport ? '' : ` data-pin="${i}" style="cursor:grab"`}>`;
    if (!forExport) o += `<circle r="26" cy="${p.i === 'pin' ? -20 : 0}" fill="transparent"/>`;
    o += `<path d="${S.d}" fill="${col}" fill-rule="evenodd" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" paint-order="stroke"/></g>`;
  });
  return o + '</g></g></g></g>';
}

/** Eigene Kartenebene am Bildschirm? Nur im Verschieben-Werkzeug (Assistent). Beim Auswählen
 * (erweiterte Einstellungen) bleibt der klassische Beschnitt – dort sollen Klicks außerhalb der
 * Kartenform keine verdeckten Häuser treffen. */
export function kartenEbene() {
  return app.tool === 'move';
}
/** Ansicht der Karte als CSS-Transform (Einheiten = Poster-Punkte) – wird beim Ziehen nur verschoben */
export function vTcss(g) {
  const v = app.S.view;
  return `translate(${MW / 2}px,${(g.MH / 2).toFixed(2)}px) scale(${v.z.toFixed(5)}) translate(${(-v.cx).toFixed(2)}px,${(-v.cy).toFixed(2)}px)`;
}
/**
 * Passepartout über der Karte (nur Bildschirm): deckt alles außerhalb der Kartenform mit dem ab,
 * was dort sonst zu sehen ist (Vorschau-Hintergrund + Papier). Ersetzt den Beschnitt der Karte.
 */
function kartenMaske(g, schnitt, papierF, verlauf, R) {
  const f = app.S.frame;
  let loch;
  if (schnitt) {
    const T = typoTexte(g);
    loch = T ? `<g fill="#000">${T.texte}</g>` : '';
  } else loch = `<g clip-path="url(#cIn)"><g transform="translate(${g.mx},${g.my})">${mapShape(g, 0, ' fill="#000"')}</g></g>`;
  const pv = app.previewBg || '#ffffff';
  let o = `<defs><mask id="mKarte" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${(g.W + 20).toFixed(1)}" height="${(g.H + 20).toFixed(1)}"><rect x="-10" y="-10" width="${(g.W + 20).toFixed(1)}" height="${(g.H + 20).toFixed(1)}" fill="#fff"/>${loch}</mask></defs>`;
  o += `<g id="kartenmaske" mask="url(#mKarte)" pointer-events="none">`;
  o += `<rect id="vorschauMaske" x="-10" y="-10" width="${(g.W + 20).toFixed(1)}" height="${(g.H + 20).toFixed(1)}" fill="${pv === 'checker' ? 'url(#pvChecker)' : pv}"/>`;
  const papier = schnitt ? typoPapier() : papierF !== 'none' ? (verlauf && !g.L.papier ? 'url(#gBg)' : papierF) : '';
  if (papier) o += `<rect x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${papier}"/>`;
  return o + '</g>';
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
  if (multiOn()) ['SgXB', 'SgMD', app.S.sub.font].forEach(f => fonts.add(f));
  if (ortsnamenAn()) fonts.add('SgMD');
  const schnitt = g.L.kind === 'typo' && typoOpt().stil === 'schnitt' && app.S.title.on && app.S.title.text;
  if (g.L.kind === 'typo') fonts.add(typoOpt().schrift), fonts.add('SgMD');
  if (g.L.kind === 'steckbrief' || g.L.kind === 'kasten' || g.L.foot) ['SgXB', 'SgMD', 'SgSC'].forEach(f => fonts.add(f));
  if (g.L.kind === 'steckbrief' || g.L.absatz) fonts.add('SgMD');
  if (app.S.motif === 'koord') ['SgXB', 'SgMD'].forEach(f => fonts.add(f));
  if (app.S.motif === 'wolke') ['SgXB', 'SgMD', 'SgSC'].forEach(f => fonts.add(f));
  if (app.S.attr.on || g.L.coords || g.note || (app.S.motif === 'sterne' && app.S.sky && (app.S.sky.names || app.S.sky.grid))) fonts.add('SgMD');
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
    // Kacheln überlappen minimal (Kachelpuffer liegt darunter) – sonst bleibt an der Kante eine helle Naht
    const ue = Math.max(0.25, r[2] * 0.0015);
    o += `<clipPath id="tc${i}"><rect x="${(r[0] - ue).toFixed(2)}" y="${(r[1] - ue).toFixed(2)}" width="${(r[2] + 2 * ue).toFixed(2)}" height="${(r[2] + 2 * ue).toFixed(2)}"/></clipPath>`;
  });
  o += `<clipPath id="cOut"><rect x="0" y="0" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" rx="${R + f.w / 2}" ry="${R + f.w / 2}"/></clipPath></defs>`;
  const papierF = g.L.papier || app.S.bg;
  const verlauf = app.S.bg2 && /^#[0-9a-f]{3,8}$/i.test(app.S.bg2) && app.S.bg !== 'none';
  if (verlauf) o += `<defs><linearGradient id="gBg" x1="0" y1="0" x2="${app.S.bgV ? 0 : 1}" y2="1"><stop offset="0" stop-color="${app.S.bg}"/><stop offset="1" stop-color="${app.S.bg2}"/></linearGradient></defs>`;
 if (schnitt) {
    // Karte nur in den Buchstaben: Maske aus den Buchstaben, außen Papier
    const T = typoTexte(g);
    o += `<defs><clipPath id="cTypo">${T ? T.texte : ''}</clipPath></defs>`;
    o += `<rect id="kartenhintergrund" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${typoPapier()}"/>`;
    if (app.S.bg !== 'none') o += `<g clip-path="url(#cTypo)"><rect id="kartenflaeche" width="${g.W.toFixed(1)}" height="${g.H.toFixed(1)}" fill="${verlauf ? 'url(#gBg)' : app.S.bg}"/></g>`;
  } else if (papierF !== 'none') o += `<rect id="kartenhintergrund" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="${verlauf && !g.L.papier ? 'url(#gBg)' : papierF}"/>`;
  // Eigenes Papier außerhalb der Karte (z. B. weiß um einen dunklen Kartenkreis)
  if (g.L.papier && app.S.bg !== 'none') o += mapShape(g, 0, ` id="kartenflaeche" transform="translate(${g.mx},${g.my})" fill="${verlauf ? 'url(#gBg)' : app.S.bg}"`);
  o += fokusSVG(g);
  // Am Bildschirm: Karte als eigene Ebene OHNE Beschnittgruppe darüber – nur so kann der Browser sie
  // beim Ziehen einfach verschieben, statt bei jedem Bild zehntausende Linien neu zu malen.
  // Den Beschnitt übernimmt eine Maske in Papierfarbe darüber (wie ein Passepartout).
  if (!forExport && kartenEbene()) {
    o += `<g id="karte" data-ebene="1"><g transform="translate(${g.mx},${g.my})"><g id="kartenAnsicht" style="will-change:transform;transform:${vTcss(g)}"><g id="kartenInhalt"/></g></g></g>`;
    o += kartenMaske(g, schnitt, papierF, verlauf, R);
  } else {
    o += `<g id="karte" clip-path="url(#${schnitt ? 'cTypo' : 'cIn'})"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><g id="kartenAnsicht" transform="${vT(g).replace(/^translate\([^)]*\) /, '')}">`;
    o += mapContent(true, visRect());
    o += '</g></g></g></g>';
  }
  const ink = app.S.title.color;
  o += fxSVG(g);
  o += leuchtenSVG(g);
  o += lupeSVG(g);
  o += einsatzSVG(g, vT(g).replace(/^translate\([^)]*\) /, ''));
  o += gitterSVG(g);
  o += absatzSVG(g);
  o += ortsnamenSVG(g);
  o += pinsSVG(g, forExport);
  if (g.L.inner > 0) o += mapShape(g, g.L.innerGap + g.L.inner / 2, ` id="innenlinie" transform="translate(${g.mx},${g.my})" fill="none" stroke="${f.w > 0 ? f.color : ink}" stroke-width="${g.L.inner}"`);
  if (g.L.kind === 'over' && g.L.fade && g.block > 0) {
    const paper = g.L.fadeFarbe || (app.S.bg !== 'none' ? app.S.bg : '#ffffff');
    if (g.L.oben) {
      const y1 = g.top + g.block + 170;
      o += `<defs><linearGradient id="gFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paper}" stop-opacity=".9"/><stop offset=".5" stop-color="${paper}" stop-opacity=".6"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></linearGradient></defs>`;
      o += `<rect id="verlauf" x="${g.mx}" y="${g.my.toFixed(1)}" width="${MW}" height="${(y1 - g.my).toFixed(1)}" fill="url(#gFade)" clip-path="url(#cIn)"/>`;
    } else {
      const y0 = Math.max(g.my, g.top - 150);
      o += `<defs><linearGradient id="gFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${paper}" stop-opacity="0"/><stop offset=".55" stop-color="${paper}" stop-opacity=".82"/><stop offset="1" stop-color="${paper}" stop-opacity=".95"/></linearGradient></defs>`;
      o += `<rect id="verlauf" x="${g.mx}" y="${y0.toFixed(1)}" width="${MW}" height="${(g.my + g.MH - y0).toFixed(1)}" fill="url(#gFade)" clip-path="url(#cIn)"/>`;
    }
  }
  o += himmelSVG(g);
  if (g.L.kind === 'bartop' && g.barH > 0) o += `<rect id="balken" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.barH).toFixed(1)}" fill="${app.S.bar.color}" clip-path="url(#cOut)"/>`;
  if (g.L.kind === 'bar' && app.S.bar.on && g.barH > 0) o += `<rect id="balken" x="${f.w / 2}" y="${g.barTop.toFixed(1)}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - g.barTop).toFixed(1)}" fill="${app.S.bar.color}" clip-path="url(#cOut)"/>`;
  if (f.w > 0) o += `<rect id="rahmen" x="${f.w / 2}" y="${f.w / 2}" width="${(g.W - f.w).toFixed(1)}" height="${(g.H - f.w).toFixed(1)}" rx="${R}" ry="${R}" fill="none" stroke="${f.color}" stroke-width="${f.w}"/>`;
  const typo = g.L.kind === 'typo' || g.L.kind === 'steckbrief' || g.L.kind === 'kasten' || g.L.kind === 'cover' || g.L.kind === 'plakette';
  if (g.L.kind === 'typo') o += typoSVG(g);
  o += steckbriefSVG(g) + kastenSVG(g) + tabelleSVG(g) + kompassSVG(g) + coverSVG(g) + plaketteSVG(g);
  [['title', g.yT], ['sub', g.yS]].forEach(([k, y]) => {
    const t = app.S[k];
    if (typo) return;
    if (k === 'title' && app.S.motif === 'koord') return;
    if (k === 'sub' && (g.L.foot === 'tabelle' || g.L.ohneSub)) return;
    if (!t.on || !t.text) return;
    // Lange Namen (z. B. „Rothenburg ob der Tauber“) automatisch verkleinern, damit sie ins Poster passen
    const fs = passendeGroesse(t.text, t.font, t.size, t.ls, g.W - 2 * (g.sw + Math.max(g.p, 24)));
    o += `<text id="${k === 'title' ? 'titel' : 'untertitel'}" x="${(g.W / 2 + t.ls * fs / t.size / 2).toFixed(2)}" y="${y.toFixed(2)}" text-anchor="middle" font-family="${t.font}" font-size="${+fs.toFixed(2)}" letter-spacing="${+(t.ls * fs / t.size).toFixed(2)}" fill="${(k === 'title' ? g.L.titelFarbe : g.L.subFarbe) || t.color}"${g.L.kontur ? ` stroke="${g.L.kontur}" stroke-width="${(fs * 0.08).toFixed(1)}" stroke-linejoin="round" paint-order="stroke"` : ''}>${esc(t.text)}</text>`;
  });
  if (!typo && g.L.rule && app.S.title.on && app.S.title.text && app.S.sub.on && app.S.sub.text) {
    const yr = (g.yT + (g.yS - app.S.sub.size * CAP[app.S.sub.font])) / 2;
    o += `<line id="zierlinie" x1="${(g.W / 2 - 70).toFixed(1)}" x2="${(g.W / 2 + 70).toFixed(1)}" y1="${yr.toFixed(1)}" y2="${yr.toFixed(1)}" stroke="${app.S.title.color}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (!typo && g.L.coords && app.DATA) o += `<text id="koordinaten" x="${(g.W / 2 + 1.5).toFixed(2)}" y="${g.yC.toFixed(2)}" text-anchor="middle" font-family="SgMD" font-size="${g.cSize}" letter-spacing="${g.L.koordKurz ? 1.5 : g.L.koordFarbe ? 4 : 3}" fill="${g.L.koordFarbe || app.S.sub.color}" fill-opacity="${g.L.koordKurz ? 0.6 : 0.85}">${esc(coordText(g.L.koordKurz))}</text>`;
  if (!typo && g.note) o += `<text id="widmung" x="${(g.W / 2 + 1).toFixed(2)}" y="${g.yN.toFixed(2)}" text-anchor="middle" font-family="SgMD" font-size="${g.nSize}" letter-spacing="2" fill="${app.S.sub.color}">${esc(g.note)}</text>`;
  if (app.S.attr.on && app.S.motif !== 'sterne' && app.S.motif !== 'koord' && app.S.motif !== 'wolke') {
    const inBar = g.L.kind === 'bar' && app.S.bar.on && g.barH > 0;
    const onPaper = (!inBar && g.L.kind !== 'top' && g.L.kind !== 'bartop') || !!g.L.papier;
    const col = inBar || onPaper ? app.S.title.color : app.S.mode === 'std' ? BASES[app.S.base].sat || app.S.base === 'dark' || app.S.base === 'fiord' ? '#ffffff' : '#333333' : app.S.cls.haupt.s;
    const x = g.W - g.sw - g.p - 4 - (g.L.kind === 'steckbrief' ? 10 : 0);
    const y = inBar ? g.H - g.sw - 8 : g.L.kind === 'below' || g.L.foot || g.L.kind === 'steckbrief' ? g.H - g.sw - Math.min(14, g.p / 2 + 4) - (g.L.kind === 'steckbrief' ? 18 : 0) : g.my + g.MH - 6;
    let at = app.S.mode === 'std' ? BASES[app.S.base].sat ? 'Luftbild © Bayer. Vermessungsverwaltung (CC BY 4.0) · © OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenMapTiles · © OpenStreetMap-Mitwirkende' : '© OpenStreetMap-Mitwirkende';
    if (((app.S.hoehen && app.S.hoehen.on) || (app.S.fx && app.S.fx.relief && !perspektiveAn())) && app.S.mode !== 'std') at += ' · Höhen © EU-DEM';
    if (std3d() && (app.S.fx.relief || app.S.fx.gelaende)) at += ' · Höhen © EU-DEM';
    o += `<text id="quelle" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="end" font-family="SgMD" font-size="11" fill="${col}" fill-opacity="0.75">${at}</text>`;
  }
  return o + '</svg>';
}
export function render() {
  if (!app.DATA) return;
  clearTimeout(fullTimer);
  nachladenPruefen();
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
  // Vorschau zeigt Papier (weiß) – das Karomuster für „durchsichtig“ wirkte unfertig
  const pv = app.previewBg || '#ffffff';
  const bgFill = pv === 'checker' ? 'url(#pvChecker)' : pv;
  const tdefs = tmp.querySelector('defs');
  if (pv === 'checker') tdefs.insertAdjacentHTML('beforeend', '<pattern id="pvChecker" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fff"/><rect width="12" height="12" fill="#ececec"/><rect x="12" y="12" width="12" height="12" fill="#ececec"/></pattern>');
  tdefs.insertAdjacentHTML('afterend', `<rect id="vorschau" x="0" y="0" width="100%" height="100%" fill="${bgFill}" clip-path="url(#cOut)" pointer-events="none"/>`);
  const g = geo();
  const before = MC.node;
  const M = mapNodes();
  const oldK = app.poster.querySelector('#karte');
  const oldHg = app.poster.querySelector('#treffer');
  // Schneller Weg nur bei gleichem Aufbau (eigene Kartenebene ja/nein)
  const gleich = !!oldK && oldK.dataset.ebene === (tmp.querySelector('#karte').dataset.ebene);
  // Neu aufgebaute Karte nach Verschieben/Nachladen: über die alte legen und weich einblenden
  // (wie Kacheln bei Online-Karten) – vorhandene Teile bleiben stehen, neue erscheinen sanft
  const einblenden = app.einblenden;
  app.einblenden = false;
  const tausch = gleich && einblenden && M.node !== before && !!before && oldK.contains(before) && kartenEbene() && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (gleich && (M.node === before ? oldK.contains(M.node) : tausch)) {
    // Schneller Weg: Karte bleibt im Poster, nur alles drumherum wird ersetzt.
    // (Herausnehmen und Wiedereinsetzen würde den Browser zwingen, jedes Haus neu zu vermessen.)
    const newK = tmp.querySelector('#karte');
    let a = newK, b = oldK;
    while (a && b && a.id !== 'kartenInhalt' && b !== M.node && b !== before) {
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
    if (M.node !== before) {
      const alt = before;
      alt.parentNode.appendChild(M.node);
      M.node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' }).finished.catch(() => {}).finally(() => alt.remove());
    }
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
  // Sobald alle Schriften geladen sind, einmal neu zeichnen (Textbreiten werden gemessen)
  if (document.fonts) document.fonts.ready.then(() => app.DATA && render());
}

