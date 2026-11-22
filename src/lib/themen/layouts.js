// @ts-nocheck – Zeichenhilfen wie in zeichnen.js (SVG-Text), Typen folgen bei der Überarbeitung.
// Besondere Poster-Aufbauten nach Vorbildern aus Grafikdesign und Kartenkunst:
//  • Fokus     – farbige Fläche „unter“ den Straßen (Japan-Week-Plakat)
//  • Lupe      – Kreis hebt einen Teil hervor, außen gedämpft (Spot-Karten, Dossier)
//  • Tabelle   – Info-Leiste mit 4 Feldern unter der Karte (Studie „movement“)
//  • Steckbrief– Kopfzeile, Titel links, Nordpfeil, Faktenliste (Serie „Ciudades de Bolivia“)
//  • Kasten    – Textraster mitten auf der Karte („Am Puls“, Designmonat Graz)
//  • Raster    – feines Koordinatengitter über dem ganzen Poster
// Alles wird als SVG-Text gebaut und landet im Poster wie Rahmen und Titel.
import { app } from '../editor/app.js';
import { MW, CAP, esc } from '../editor/basis.js';
import { coordText, passendeGroesse } from '../editor/zeichnen.js';
import { dms, viewCenterLL } from '../editor/seitenleiste.js';
import { multiOn } from '../editor/mehrere.js';
import { lum } from './designs.js';

const FARBE = /^#[0-9a-f]{3,8}$/i;
const f1 = (n) => (+n).toFixed(1);

/** Eigene Zusatztexte des Posters (Kopfzeile, Nummer, Zeile über dem Titel, Fakten, Fokusfarbe) */
export const info = () => ({ kopf: '', nr: '', kicker: '', fakten: '', fokus: '', ...((app.S && app.S.info) || {}) });

/** Papierfarbe außerhalb der Karte */
export const papier = (S) => (S.lay && S.lay.papier) || (S.bg === 'none' ? '#ffffff' : S.bg);

function kontrast(a, b) {
	const x = lum(a), y = lum(b);
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Akzentfarbe für Fokus-Fläche: eigene Wahl, sonst Balkenfarbe des Themas, sonst Rot */
export function akzent(S) {
	const i = S.info && S.info.fokus;
	if (i && FARBE.test(i)) return i;
	const c = S.bar && S.bar.color;
	if (c && FARBE.test(c) && kontrast(c, papier(S)) > 1.8) return c;
	return '#d23a2c';
}

const karteMotiv = () => (!app.S.motif || app.S.motif === 'karte') && !multiOn();

/** Breite der sichtbaren Kartenfläche in Metern */
export function sichtMeter() {
	if (!app.DATA || !app.DATA.proj) return 0;
	const lat = viewCenterLL()[1];
	return (MW * 40075016.686 * Math.cos((lat * Math.PI) / 180)) / app.DATA.proj.sc / app.S.view.z;
}
const km = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',')} km`);

/* ---------- Fokus: farbige Fläche unter den Straßen ---------- */
/** Organische Kreisform (leicht gewellt wie ein ausgemaltes Viertel) */
function blob(cx, cy, r, welle) {
	let d = '';
	for (let i = 0; i <= 96; i++) {
		const a = (i / 96) * Math.PI * 2;
		const k = 1 + welle * (0.05 * Math.sin(3 * a + 0.6) + 0.035 * Math.sin(7 * a + 1.9) + 0.02 * Math.sin(13 * a));
		d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * r * k) + ' ' + f1(cy + Math.sin(a) * r * k);
	}
	return d + 'Z';
}
/** Liegt zwischen Papier und Karte: Straßen in Papierfarbe schneiden sie in „Blöcke“ */
export function fokusSVG(g) {
	if (!g.L.fokus || !karteMotiv()) return '';
	const r = g.L.fokus * Math.min(MW, g.MH);
	return `<path id="fokus" d="${blob(g.mx + MW / 2, g.my + g.MH * 0.42, r, 1)}" fill="${akzent(app.S)}" clip-path="url(#cIn)"/>`;
}

/* ---------- Lupe: Kreis hervorheben, außen dämpfen ---------- */
export function lupeSVG(g) {
	if (!g.L.lupe || !karteMotiv()) return '';
	const cx = g.mx + MW / 2,
		cy = g.my + g.MH * 0.44,
		r = g.L.lupe * Math.min(MW, g.MH);
	const p = papier(app.S),
		dunkel = lum(p) < 0.3;
	const d = `M0 0H${f1(g.W)}V${f1(g.H)}H0Z M${f1(cx - r)} ${f1(cy)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
	const ring = dunkel ? '#ffffff' : app.S.title.color;
	const strich = g.L.lupeStrich ? ` stroke-dasharray="22 14" stroke-opacity=".75"` : '';
	// Dossier (gestrichelt): außen abdunkeln, damit nur das Innere leuchtet; sonst außen aufhellen
	const aussen = g.L.lupeStrich && dunkel ? ['#000000', 0.62] : dunkel ? ['#ffffff', 0.2] : [p, 0.62];
	return (
		`<path id="lupe" d="${d}" fill="${aussen[0]}" fill-opacity="${aussen[1]}" fill-rule="evenodd" clip-path="url(#cIn)" pointer-events="none"/>` +
		`<circle id="lupenring" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="none" stroke="${ring}" stroke-width="${g.L.lupeStrich ? 5 : 8}"${strich} pointer-events="none"/>`
	);
}

/* ---------- Koordinatengitter über dem Poster ---------- */
export function gitterSVG(g) {
	if (!g.L.gitter) return '';
	const n = 8,
		s = g.W / n,
		col = app.S.title.color;
	let d = '';
	for (let i = 1; i < n; i++) d += `M${f1(i * s)} 0V${f1(g.H)}`;
	for (let y = s; y < g.H; y += s) d += `M0 ${f1(y)}H${f1(g.W)}`;
	return `<path id="gitter" d="${d}" stroke="${lum(papier(app.S)) < 0.3 ? '#ffffff' : col}" stroke-opacity=".13" stroke-width="1.4" fill="none" clip-path="url(#cIn)" pointer-events="none"/>`;
}

/** Kleiner Kompass (Kreis mit Nordstrich) oben rechts – für das Dossier-Design */
export function kompassSVG(g) {
	if (!g.L.kompass) return '';
	const y = g.sw + 58,
		x = g.W - g.sw - 58,
		c = app.S.title.color;
	return `<g id="kompass" fill="none" stroke="${c}" stroke-opacity=".8" stroke-width="2"><circle cx="${f1(x)}" cy="${f1(y)}" r="20"/><path d="M${f1(x)} ${f1(y - 20)}V${f1(y + 4)}"/></g>`;
}

/* ---------- Tabelle: Info-Leiste unter der Karte ---------- */
/** „Schöne“ Maßstabslänge (1, 2, 5 × 10ⁿ Meter) */
function schoen(m) {
	const e = Math.pow(10, Math.floor(Math.log10(m)));
	return [5, 2, 1].map((k) => k * e).find((x) => x <= m) || e;
}
export function tabelleSVG(g) {
	if (g.L.foot !== 'tabelle') return '';
	const S = app.S,
		ink = S.title.color,
		y0 = g.footY,
		h = g.footH,
		x0 = g.mx,
		w = MW / 4;
	let o = `<g id="tabelle" font-family="SgMD" fill="${ink}">`;
	// Zierlinie unter dem kleinen Titel oben
	if (S.title.on && S.title.text) o += `<line x1="${f1(g.W / 2 - 34)}" x2="${f1(g.W / 2 + 34)}" y1="${f1(g.yT + 30)}" y2="${f1(g.yT + 30)}" stroke="${ink}" stroke-width="2"/>`;
	o += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${MW}" height="${h}" fill="none" stroke="${ink}" stroke-width="1.4"/>`;
	for (let i = 1; i < 4; i++) o += `<line x1="${f1(x0 + i * w)}" x2="${f1(x0 + i * w)}" y1="${f1(y0 + 16)}" y2="${f1(y0 + h - 16)}" stroke="${ink}" stroke-width="1.2"/>`;
	const kopf = (i, t) => {
		const x = x0 + i * w + 20;
		return `<text x="${f1(x)}" y="${f1(y0 + 32)}" font-size="12.5" letter-spacing="2.6" fill-opacity=".8">${esc(t.toUpperCase())}</text><line x1="${f1(x)}" x2="${f1(x + 24)}" y1="${f1(y0 + 42)}" y2="${f1(y0 + 42)}" stroke="${ink}" stroke-width="1.6"/>`;
	};
	const zeile = (i, k, t, size = 17, font = 'SgMD') =>
		`<text x="${f1(x0 + i * w + 20)}" y="${f1(y0 + 72 + k * 25)}" font-size="${size}" font-family="${font}" letter-spacing="1">${esc(t)}</text>`;
	// 1 Ort
	o += kopf(0, 'Ort');
	const t1 = [S.title.on ? S.title.text : '', S.sub.on ? S.sub.text : ''].filter(Boolean);
	t1.slice(0, 2).forEach((t, k) => {
		const fs = passendeGroesse(t, 'SgMD', 17, 1, w - 36);
		o += zeile(0, k, t, +fs.toFixed(1));
	});
	// 2 Koordinaten
	o += kopf(1, 'Koordinaten');
	if (app.DATA) {
		const [lon, lat] = viewCenterLL();
		o += zeile(1, 0, dms(lat, 'N', 'S')) + zeile(1, 1, dms(lon, 'O', 'W'));
	}
	// 3 Legende: Linienmuster auf der Kartenfarbe
	o += kopf(2, 'Legende');
	const grund = S.bg === 'none' ? '#ffffff' : S.bg;
	[['haupt', 'Straßen'], ['wasser', 'Gewässer']].forEach(([k, name], j) => {
		const c = S.cls[k];
		if (!c || c.h) return;
		const farbe = c.s !== 'none' ? c.s : c.f;
		const x = x0 + 2 * w + 20,
			y = y0 + 60 + j * 26;
		o += `<rect x="${f1(x)}" y="${f1(y)}" width="38" height="16" rx="3" fill="${grund}" stroke="${ink}" stroke-opacity=".25"/><line x1="${f1(x + 5)}" x2="${f1(x + 33)}" y1="${f1(y + 8)}" y2="${f1(y + 8)}" stroke="${farbe}" stroke-width="${k === 'wasser' ? 5 : 3}" stroke-linecap="round"/><text x="${f1(x + 50)}" y="${f1(y + 13)}" font-size="15">${name}</text>`;
	});
	// 4 Widmung oder Maßstab
	const note = S.note && S.note.on !== false && S.note.text;
	if (note) {
		o += kopf(3, 'Widmung');
		const fs = passendeGroesse(note, 'SgXB', 22, 0.5, w - 36);
		o += zeile(3, 0, note, +fs.toFixed(1), 'SgXB');
	} else if (app.DATA) {
		o += kopf(3, 'Maßstab');
		const mpu = sichtMeter() / MW,
			m = schoen((w - 60) * mpu),
			len = m / mpu,
			x = x0 + 3 * w + 20,
			y = y0 + 74;
		o += `<path d="M${f1(x)} ${f1(y - 7)}V${f1(y)}H${f1(x + len)}V${f1(y - 7)}M${f1(x + len / 2)} ${f1(y)}V${f1(y - 4)}" fill="none" stroke="${ink}" stroke-width="2"/><text x="${f1(x)}" y="${f1(y + 24)}" font-size="15">${km(m)}</text>`;
	}
	return o + '</g>';
}

/* ---------- Steckbrief ---------- */
/** Fakten: eigene Zeilen oder automatisch aus dem Ort */
export function fakten() {
	const I = info();
	if (I.fakten && I.fakten.trim()) return I.fakten.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 6);
	if (!app.DATA) return [];
	const S = app.S,
		[lon, lat] = viewCenterLL(),
		m = sichtMeter();
	return [
		S.sub.on && S.sub.text ? `Region: ${S.sub.text}` : '',
		`Breite: ${lat.toFixed(4).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'}`,
		`Länge: ${lon.toFixed(4).replace('.', ',')}° ${lon < 0 ? 'W' : 'O'}`,
		m ? `Ausschnitt: ${km(m)} × ${km(m * S.view.a)}` : '',
		`Gezeichnet: ${new Date().getFullYear()}`
	].filter(Boolean);
}
export function steckbriefSVG(g) {
	if (g.L.kind !== 'steckbrief') return '';
	const S = app.S,
		I = info(),
		ink = S.title.color,
		x0 = g.mx,
		x1 = g.mx + MW;
	const rand = 20 + g.sw;
	let o = `<rect id="innenrand" x="${rand}" y="${rand}" width="${f1(g.W - 2 * rand)}" height="${f1(g.H - 2 * rand)}" fill="none" stroke="${ink}" stroke-opacity=".5" stroke-width="1.6"/>`;
	o += `<g id="steckbrief" font-family="SgMD" fill="${ink}">`;
	// Kopfzeile: Serie links (mit vier Punkten), Nummer rechts
	const yK = g.my - 30;
	const kopf = I.kopf || (S.sub.on && S.sub.text) || '';
	if (kopf) {
		[0, 1].forEach((a) => [0, 1].forEach((b) => (o += `<circle cx="${f1(x0 + 4 + a * 10)}" cy="${f1(yK - 13 + b * 10)}" r="3"/>`)));
		o += `<text x="${f1(x0 + 28)}" y="${f1(yK)}" font-size="21" letter-spacing="2.5">${esc(kopf.toUpperCase())}</text>`;
	}
	if (I.nr) o += `<text x="${f1(x1)}" y="${f1(yK)}" text-anchor="end" font-size="18" letter-spacing="1.5" fill-opacity=".8">${esc(I.nr)}</text>`;
	// Zeile über dem Titel: erstes Wort kräftig, Rest heller (wie „TRAMA URBANA“)
	const yA = g.my + g.MH + 62;
	const kicker = (I.kicker || 'Stadtplan').toUpperCase().split(' ');
	o += `<text x="${f1(x0)}" y="${f1(yA)}" font-size="27" letter-spacing="2.5"><tspan>${esc(kicker[0])}</tspan>${kicker.length > 1 ? `<tspan fill-opacity=".6"> ${esc(kicker.slice(1).join(' '))}</tspan>` : ''}</text>`;
	o += '</g>';
	// Titel links, groß und fett
	const t = S.title;
	let yT = yA + 18;
	if (t.on && t.text) {
		const fs = passendeGroesse(t.text, t.font, t.size, t.ls, MW * 0.8);
		yT += fs * (CAP[t.font] || 0.73);
		o += `<text id="titel" x="${f1(x0 - 3)}" y="${f1(yT)}" font-family="${t.font}" font-size="${f1(fs)}" letter-spacing="${f1((t.ls * fs) / t.size)}" fill="${ink}">${esc(t.text)}</text>`;
	}
	if (app.DATA) o += `<text id="koordinaten" x="${f1(x0)}" y="${f1(yT + 34)}" font-family="SgMD" font-size="18" letter-spacing="1.5" fill="${ink}">${esc(coordText())}</text>`;
	// Kästchen: Nordpfeil + Untertitel in Schreibschrift (wie ein Signet)
	const yB = yT + 62,
		bh = 112;
	o += `<g fill="none" stroke="${ink}" stroke-opacity=".7" stroke-width="1.6"><rect x="${f1(x0)}" y="${f1(yB)}" width="${bh}" height="${bh}"/></g>`;
	o += `<text x="${f1(x0 + bh / 2)}" y="${f1(yB + 36)}" text-anchor="middle" font-family="SgXB" font-size="26" fill="${ink}">N</text><path d="M${f1(x0 + bh / 2)} ${f1(yB + 46)}L${f1(x0 + bh / 2 + 18)} ${f1(yB + 96)}L${f1(x0 + bh / 2)} ${f1(yB + 84)}L${f1(x0 + bh / 2 - 18)} ${f1(yB + 96)}Z" fill="${ink}"/>`;
	const u = S.sub;
	if (u.on && u.text) {
		const bw = MW * 0.27;
		o += `<rect x="${f1(x0 + bh + 10)}" y="${f1(yB)}" width="${f1(bw)}" height="${bh}" fill="none" stroke="${ink}" stroke-opacity=".7" stroke-width="1.6"/>`;
		const fs = passendeGroesse(u.text, 'SgSC', 40, 0, bw - 28);
		o += `<text id="untertitel" x="${f1(x0 + bh + 10 + bw / 2)}" y="${f1(yB + bh / 2 + fs * 0.3)}" text-anchor="middle" font-family="SgSC" font-size="${f1(fs)}" fill="${ink}">${esc(u.text)}</text>`;
	}
	// Faktenliste rechts
	const F = fakten(),
		xF = x0 + MW * 0.58;
	F.forEach((z, i) => {
		const k = z.indexOf(':');
		const lab = k > 0 ? z.slice(0, k + 1) : '',
			val = k > 0 ? z.slice(k + 1) : z;
		const fs = passendeGroesse(z.toUpperCase(), 'SgMD', 17, 1, x1 - xF);
		o += `<text x="${f1(xF)}" y="${f1(yB + 14 + i * 23 + (6 - F.length) * 6)}" font-family="SgMD" font-size="${f1(fs)}" letter-spacing="1" fill="${ink}">${lab ? `<tspan>${esc(lab.toUpperCase())}</tspan>` : ''}<tspan fill-opacity=".72">${esc(val.toUpperCase())}</tspan></text>`;
	});
	return o;
}

/* ---------- Kasten: Textraster mitten auf der Karte ---------- */
export function kastenSVG(g) {
	if (g.L.kind !== 'kasten') return '';
	const S = app.S,
		I = info(),
		ink = S.title.color;
	const bw = MW * 0.52,
		x = g.W / 2 - bw / 2;
	const h1 = bw * 0.2,
		h2 = bw * 0.44,
		h3 = bw * 0.22,
		h4 = bw * 0.12;
	const note = S.note && S.note.on !== false && S.note.text;
	const H = h1 + h2 + h3 + h4;
	const y = g.my + g.MH / 2 - H / 2;
	const sw = 3.5;
	let o = `<g id="kasten" fill="${ink}" font-family="SgMD">`;
	o += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw)}" height="${f1(H)}" fill="${papier(S)}" fill-opacity=".28" stroke="${ink}" stroke-width="${sw}"/>`;
	const L = (x1, y1, x2, y2) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${ink}" stroke-width="${sw}"/>`;
	o += L(x, y + h1, x + bw, y + h1) + L(x, y + h1 + h2, x + bw, y + h1 + h2) + L(x, y + h1 + h2 + h3, x + bw, y + h1 + h2 + h3);
	o += L(x + h1, y, x + h1, y + h1) + L(x + bw / 2, y + h1 + h2, x + bw / 2, y + h1 + h2 + h3);
	// Zeile 1: Herz | Untertitel
	const hz = h1 * 0.3;
	o += `<path transform="translate(${f1(x + h1 / 2)},${f1(y + h1 / 2 + 2)}) scale(${(hz / 17).toFixed(3)})" d="M0 15C-9 8-17 1-17-8C-17-14-12-18-7-18C-3-18-1-16 0-13C1-16 3-18 7-18C12-18 17-14 17-8C17 1 9 8 0 15Z"/>`;
	if (S.sub.on && S.sub.text) {
		const fs = passendeGroesse(S.sub.text, 'SgXB', h1 * 0.3, 0, bw - h1 - 36);
		o += `<text id="untertitel" x="${f1(x + bw - 18)}" y="${f1(y + h1 / 2 + fs * 0.36)}" text-anchor="end" font-family="SgXB" font-size="${f1(fs)}">${esc(S.sub.text)}</text>`;
	}
	// Zeile 2: kleine Zeile + großer Titel
	if (I.kicker) o += `<text x="${f1(x + 20)}" y="${f1(y + h1 + 34)}" font-size="${f1(bw * 0.04)}" letter-spacing="3">${esc(I.kicker.toUpperCase())}</text>`;
	const t = S.title;
	if (t.on && t.text) {
		const fs = passendeGroesse(t.text, t.font, bw * 0.24, bw * 0.02, bw - 44);
		o += `<text id="titel" x="${f1(g.W / 2 + bw * 0.01)}" y="${f1(y + h1 + h2 * 0.58 + fs * 0.36)}" text-anchor="middle" font-family="${t.font}" font-size="${f1(fs)}" letter-spacing="${f1(bw * 0.02 * (fs / (bw * 0.24)))}">${esc(t.text)}</text>`;
	}
	// Zeile 3: Breite | Länge
	if (app.DATA) {
		const [lon, lat] = viewCenterLL();
		const y3 = y + h1 + h2;
		const fsl = bw * 0.032,
			fsv = bw * 0.072;
		[[`Breite`, `${lat.toFixed(3).replace('.', ',')}° ${lat < 0 ? 'S' : 'N'}`, x + 18, 'start'], ['Länge', `${lon.toFixed(3).replace('.', ',')}° ${lon < 0 ? 'W' : 'O'}`, x + bw - 18, 'end']].forEach(([lab, val, xx, an]) => {
			o += `<text x="${f1(xx)}" y="${f1(y3 + h3 * 0.34)}" text-anchor="${an}" font-size="${f1(fsl)}" letter-spacing="2">${lab.toUpperCase()}</text>`;
			o += `<text x="${f1(xx)}" y="${f1(y3 + h3 * 0.8)}" text-anchor="${an}" font-size="${f1(fsv)}">${esc(val)}</text>`;
		});
	}
	// Zeile 4: Widmung oder Koordinaten
	const z4 = note || (app.DATA ? coordText() : '');
	if (z4) {
		const fs = passendeGroesse(z4.toUpperCase(), 'SgMD', bw * 0.04, 2, bw - 36);
		o += `<text x="${f1(x + 18)}" y="${f1(y + H - h4 / 2 + fs * 0.36)}" font-size="${f1(fs)}" letter-spacing="2">${esc(z4.toUpperCase())}</text>`;
	}
	return o + '</g>';
}

/** Lichtschein in der Mitte (Effekt „Leuchten“) – wie Stadtlichter bei Nacht */
export function leuchtenSVG(g) {
	if (!(app.S.fx && app.S.fx.glow) || !karteMotiv()) return '';
	const c = app.S.cls.haupt.s && app.S.cls.haupt.s !== 'none' ? app.S.cls.haupt.s : '#f5c66b';
	return (
		`<defs><radialGradient id="gGlow" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="${c}" stop-opacity=".42"/><stop offset=".45" stop-color="${c}" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>` +
		`<g clip-path="url(#cIn)" pointer-events="none"><g transform="translate(${g.mx},${g.my})"><g clip-path="url(#cMap)"><rect id="leuchten" width="${MW}" height="${f1(g.MH)}" fill="url(#gGlow)" style="mix-blend-mode:screen"/></g></g></g>`
	);
}
