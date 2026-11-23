// @ts-nocheck – SVG-Text wie in zeichnen.js
// Themenwelt „Sunset City“: Spielkarten- und Miami-Abend-Look.
// Bewusst eigene, allgemeine Gestaltung (Plakatschrift, Farbverläufe, Palmen, Retro-Sonne) –
// keine Namen, Logos oder Figuren eines bestimmten Spiels (Marken- und Urheberrecht).
import { app } from '../editor/app.js';
import { CAP, esc } from '../editor/basis.js';
import { coordText, passendeGroesse } from '../editor/zeichnen.js';

const f1 = (n) => (+n).toFixed(1);
/** Verlauf Pink → Orange → Violett (Plaketten) */
const VERLAUF = '<stop offset="0" stop-color="#ff4fa3"/><stop offset=".55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#8b2fc9"/>';

/** Text mit dunkler Kontur (wie auf Spiele-Covern) */
function text(id, t, x, y, size, font, ls, fill, kontur, anchor = 'middle') {
	if (!t) return '';
	const k = kontur ? ` stroke="${kontur}" stroke-width="${f1(Math.max(2, size * 0.09))}" stroke-linejoin="round" paint-order="stroke"` : '';
	return `<text${id ? ` id="${id}"` : ''} x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${font}" font-size="${f1(size)}" letter-spacing="${f1(ls)}" fill="${fill}"${k}>${esc(t)}</text>`;
}
/** Titel und Untertitel passend in eine Breite setzen; liefert Höhe und SVG */
function titelBlock(cx, yTop, breite, kontur, tf = '#ffffff', sf = '#fff3b0') {
	const S = app.S,
		t = S.title,
		u = S.sub;
	let y = yTop,
		o = '';
	if (t.on && t.text) {
		const fs = passendeGroesse(t.text, t.font, t.size, t.ls, breite);
		y += fs * (CAP[t.font] || 0.72);
		o += text('titel', t.text, cx + (t.ls * fs) / t.size / 2, y, fs, t.font, (t.ls * fs) / t.size, tf, kontur);
	}
	if (u.on && u.text) {
		const fs = passendeGroesse(u.text, u.font, u.size, u.ls, breite);
		y += (o ? fs * 0.45 : 0) + fs * (CAP[u.font] || 0.72);
		o += text('untertitel', u.text, cx + (u.ls * fs) / u.size / 2, y, fs, u.font, (u.ls * fs) / u.size, sf, kontur);
	}
	return { o, h: y - yTop };
}

/* ---------- Cover-Raster: Panels + Titel-Plakette ---------- */
export function coverSVG(g) {
	if (g.L.kind !== 'cover') return '';
	const W = g.W,
		H = g.H,
		s = W * 0.014;
	// Stege zwischen den Panels (leicht schräg, verschieden hoch – wie ein Comic-Cover)
	const d = [
		`M${f1(W * 0.355)} 0L${f1(W * 0.33)} ${f1(H)}`,
		`M${f1(W * 0.675)} 0L${f1(W * 0.7)} ${f1(H)}`,
		`M0 ${f1(H * 0.3)}L${f1(W * 0.35)} ${f1(H * 0.33)}`,
		`M0 ${f1(H * 0.66)}L${f1(W * 0.34)} ${f1(H * 0.63)}`,
		`M${f1(W * 0.35)} ${f1(H * 0.2)}L${f1(W * 0.68)} ${f1(H * 0.22)}`,
		`M${f1(W * 0.33)} ${f1(H * 0.8)}L${f1(W * 0.7)} ${f1(H * 0.77)}`,
		`M${f1(W * 0.68)} ${f1(H * 0.42)}L${f1(W)} ${f1(H * 0.39)}`,
		`M${f1(W * 0.69)} ${f1(H * 0.72)}L${f1(W)} ${f1(H * 0.74)}`
	].join('');
	let o = `<g id="panels" pointer-events="none" clip-path="url(#cIn)"><path d="${d}" stroke="#ffffff" stroke-width="${f1(s)}" fill="none"/><rect x="${f1(s / 2)}" y="${f1(s / 2)}" width="${f1(W - s)}" height="${f1(H - s)}" fill="none" stroke="#ffffff" stroke-width="${f1(s)}"/></g>`;
	// Plakette in der Mitte
	const bw = W * 0.46,
		innen = bw * 0.84;
	const T = titelBlock(0, 0, innen, g.L.kontur);
	const pad = bw * 0.1;
	const bh = Math.max(bw * 0.55, T.h + 2 * pad);
	const cx = W / 2,
		cy = H * 0.5;
	o += `<defs><linearGradient id="gPlakette" x1="0" y1="0" x2="1" y2="1">${VERLAUF}</linearGradient></defs>`;
	o += `<g id="plakette" transform="translate(${f1(cx)},${f1(cy)}) rotate(-3)">`;
	o += `<rect x="${f1(-bw / 2)}" y="${f1(-bh / 2)}" width="${f1(bw)}" height="${f1(bh)}" rx="${f1(bw * 0.05)}" fill="url(#gPlakette)" stroke="${g.L.kontur}" stroke-width="${f1(s * 0.9)}"/>`;
	o += `<rect x="${f1(-bw / 2 + s)}" y="${f1(-bh / 2 + s)}" width="${f1(bw - 2 * s)}" height="${f1(bh - 2 * s)}" rx="${f1(bw * 0.04)}" fill="none" stroke="#ffffff" stroke-opacity=".85" stroke-width="${f1(s * 0.35)}"/>`;
	o += `<g transform="translate(0,${f1(-T.h / 2)})">${T.o}</g></g>`;
	return o;
}

/* ---------- Plakette: runder Sticker in der Ecke ---------- */
export function plaketteSVG(g) {
	if (g.L.kind !== 'plakette') return '';
	const W = g.W,
		r = W * 0.19,
		cx = W * 0.05 + r,
		cy = g.my + W * 0.05 + r;
	const T = titelBlock(0, 0, r * 1.55, g.L.kontur);
	let o = `<defs><linearGradient id="gSticker" x1="0" y1="0" x2="1" y2="1">${VERLAUF}</linearGradient></defs>`;
	o += `<g id="plakette" transform="translate(${f1(cx)},${f1(cy)})">`;
	o += `<circle r="${f1(r + W * 0.012)}" fill="#ffffff"/><circle r="${f1(r)}" fill="url(#gSticker)"/>`;
	o += `<g transform="translate(0,${f1(-T.h / 2)})">${T.o}</g></g>`;
	if (app.DATA) o += text('koordinaten', coordText(), cx, cy + r + W * 0.05, W * 0.02, 'SgMD', 2, '#ffffff', g.L.kontur);
	return o;
}

/* ---------- Retro-Himmel: Farbverlauf, gestreifte Sonne, Palmen ---------- */
/** Palme als Silhouette (Stamm + Wedel), Fuß bei (x, y) */
function palme(x, y, h, neig, farbe) {
	const tx = x + neig * h * 0.32,
		ty = y - h;
	let o = `<path d="M${f1(x - h * 0.03)} ${f1(y)}Q${f1(x + neig * h * 0.05)} ${f1(y - h * 0.55)} ${f1(tx - h * 0.012)} ${f1(ty)}L${f1(tx + h * 0.012)} ${f1(ty)}Q${f1(x + neig * h * 0.05 + h * 0.03)} ${f1(y - h * 0.55)} ${f1(x + h * 0.03)} ${f1(y)}Z" fill="${farbe}"/>`;
	const wedel = [-170, -140, -110, -80, -50, -20, 5];
	for (const a0 of wedel) {
		const a = (a0 * Math.PI) / 180,
			L = h * 0.42;
		const ex = tx + Math.cos(a) * L,
			ey = ty + Math.sin(a) * L + L * 0.45;
		const mx = tx + Math.cos(a) * L * 0.55,
			my = ty + Math.sin(a) * L * 0.55 - L * 0.12;
		const b = h * 0.045;
		o += `<path d="M${f1(tx)} ${f1(ty)}Q${f1(mx)} ${f1(my - b)} ${f1(ex)} ${f1(ey)}Q${f1(mx)} ${f1(my + b)} ${f1(tx)} ${f1(ty)}Z" fill="${farbe}"/>`;
	}
	return o;
}
/** Die 10 Farben des Album-Covers (von dunkel nach hell) – das Design „Album“ nutzt nur diese */
export const ALBUM = ['#2c1e3d', '#5d4872', '#6e74a0', '#8d769d', '#9b8bb2', '#b17b9a', '#db93a3', '#e4a9a4', '#ebc5b9', '#fcf1f9'];
/** Skyline als Silhouette am Horizont (feste Abfolge, damit sie immer gleich aussieht) */
function skyline(x0, x1, y, h, farbe) {
	const B = [0.35, 0.62, 0.48, 0.9, 0.55, 0.72, 0.4, 1, 0.66, 0.5, 0.82, 0.38, 0.58, 0.7, 0.45];
	const w = (x1 - x0) / B.length;
	let d = `M${f1(x0)} ${f1(y)}`;
	B.forEach((b, i) => {
		const x = x0 + i * w,
			t = y - h * b;
		d += `L${f1(x)} ${f1(t)}L${f1(x + w * 0.86)} ${f1(t)}L${f1(x + w * 0.86)} ${f1(y - h * b * 0.55)}L${f1(x + w)} ${f1(y - h * b * 0.55)}`;
	});
	return `<path d="${d}L${f1(x1)} ${f1(y)}Z" fill="${farbe}"/>`;
}
/** Album-Abend: Himmel Taubenblau → Lavendel → Rosa → Pfirsich, Skyline, Palmen */
function albumHimmel(g) {
	const W = g.W,
		hh = g.himmelH,
		A = ALBUM;
	let o = `<defs><linearGradient id="gHimmel" x1="0" y1="0" x2="0" y2="${f1(hh)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${A[2]}"/><stop offset=".42" stop-color="${A[4]}"/><stop offset=".78" stop-color="${A[6]}"/><stop offset="1" stop-color="${A[7]}"/></linearGradient>`;
	o += `<radialGradient id="gGlut" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="${A[8]}" stop-opacity=".9"/><stop offset="1" stop-color="${A[8]}" stop-opacity="0"/></radialGradient>`;
	// alles Himmlische bleibt über dem Horizont
	o += `<clipPath id="cHimmel"><rect width="${f1(W)}" height="${f1(hh)}"/></clipPath></defs>`;
	o += `<g id="himmel" clip-path="url(#cHimmel)" pointer-events="none"><rect width="${f1(W)}" height="${f1(hh)}" fill="url(#gHimmel)"/>`;
	o += `<ellipse cx="${f1(W / 2)}" cy="${f1(hh)}" rx="${f1(W * 0.6)}" ry="${f1(hh * 0.45)}" fill="url(#gGlut)"/>`;
	o += skyline(W * 0.2, W * 0.8, hh, hh * 0.32, A[3]) + skyline(W * 0.28, W * 0.7, hh, hh * 0.2, A[1]);
	o += palme(W * 0.06, hh, hh * 0.86, 0.55, A[0]) + palme(W * 0.16, hh, hh * 0.6, 0.35, A[1]) + palme(W * 0.94, hh, hh * 0.78, -0.6, A[0]);
	o += `<rect y="${f1(hh - 3)}" width="${f1(W)}" height="6" fill="${A[0]}"/></g>`;
	return o;
}
export function himmelSVG(g) {
	if (!g.L.himmel || !g.himmelH) return '';
	if (g.L.himmel === 'album') return albumHimmel(g);
	const W = g.W,
		hh = g.himmelH;
	const r = Math.min(W * 0.27, hh * 0.44),
		cx = W / 2,
		cy = hh * 0.74;
	let o = `<defs><linearGradient id="gHimmel" x1="0" y1="0" x2="0" y2="${f1(hh)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2b1055"/><stop offset=".45" stop-color="#7a1fa2"/><stop offset=".8" stop-color="#ff4f8b"/><stop offset="1" stop-color="#ffb36b"/></linearGradient>`;
	o += `<linearGradient id="gSonne" x1="0" y1="${f1(cy - r)}" x2="0" y2="${f1(cy + r)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe66b"/><stop offset=".6" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>`;
	// Sonne in Streifen geschnitten (unten breiter werdende Lücken)
	let streifen = `<rect x="${f1(cx - r)}" y="${f1(cy - r)}" width="${f1(2 * r)}" height="${f1(r * 1.05)}"/>`;
	let y = cy + r * 0.05;
	for (let i = 0; y < Math.min(cy + r, hh); i++) {
		const luecke = r * (0.035 + i * 0.022),
			band = r * Math.max(0.05, 0.16 - i * 0.02);
		y += luecke;
		streifen += `<rect x="${f1(cx - r)}" y="${f1(y)}" width="${f1(2 * r)}" height="${f1(Math.min(band, hh - y))}"/>`;
		y += band;
	}
	o += `<clipPath id="cSonne">${streifen}</clipPath></defs>`;
	o += `<g id="himmel" clip-path="url(#cIn)" pointer-events="none"><rect width="${f1(W)}" height="${f1(hh)}" fill="url(#gHimmel)"/>`;
	o += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="url(#gSonne)" clip-path="url(#cSonne)"/>`;
	o += palme(W * 0.07, hh, hh * 0.82, 0.6, '#1a0b2e') + palme(W * 0.95, hh, hh * 0.62, -0.7, '#1a0b2e') + palme(W * 0.86, hh, hh * 0.45, -0.3, '#24103d');
	o += `<rect y="${f1(hh - 3)}" width="${f1(W)}" height="6" fill="#1a0b2e"/></g>`;
	return o;
}
