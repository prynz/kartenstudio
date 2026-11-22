// Druckfertig: feste Druckgrößen, Qualitäts-Ampel und PDF mit Beschnittzugabe.
// Das PDF wird komplett im Browser erzeugt (kein fremder Dienst, keine Bibliothek).
import { app as appUntyped } from './app.js';
import { CLS, MW } from './basis.js';
import { buildSVG, geo } from './zeichnen.js';
import { RASTER, rasterKey, detailRaster } from '../karte/raster.js';
import { popK } from '../themen/pop.js';
import { DESIGNS } from '../themen/designs.js';

/** @type {any} */
const app = appUntyped;

/** Druckgrößen in cm (Breite × Höhe im Hochformat) */
export const SIZES = {
	a4: { name: 'A4', w: 21, h: 29.7 },
	a3: { name: 'A3', w: 29.7, h: 42 },
	a2: { name: 'A2', w: 42, h: 59.4 },
	'30x40': { name: '30 × 40', w: 30, h: 40 },
	'50x70': { name: '50 × 70', w: 50, h: 70 },
	'70x100': { name: '70 × 100', w: 70, h: 100 },
	'30x30': { name: '30 × 30', w: 30, h: 30 },
	'50x50': { name: '50 × 50', w: 50, h: 50 }
};
/** Beschnittzugabe je Seite in mm (Standard bei Druckereien) */
export const BLEED = 3;

/**
 * Papiermaße in cm für den aktuellen Zustand (oder null = freies Format).
 * @param {any} S
 * @returns {{w:number,h:number,name:string}|null}
 */
export function paper(S) {
	const p = S && S.print;
	const z = p && /** @type {Record<string,{name:string,w:number,h:number}>} */ (SIZES)[p.k];
	if (!z) return null;
	return p.q && z.w !== z.h ? { w: z.h, h: z.w, name: z.name + ' quer' } : { w: z.w, h: z.h, name: z.name };
}

/** Größe für Anzeige/Export – im freien Format 50 cm breit angenommen. @param {any} S */
export function paperOrFree(S) {
	const p = paper(S);
	if (p) return p;
	const g = geo();
	return { w: 50, h: +(50 * g.H / g.W).toFixed(1), name: 'frei' };
}

/** @template T @param {any} S @param {() => T} fn @returns {T} */
function withState(S, fn) {
	const keep = app.S;
	app.S = S;
	try {
		return fn();
	} finally {
		app.S = keep;
	}
}

/**
 * Seitenverhältnis der Karte so wählen, dass das ganze Poster genau aufs Papier passt.
 * (Bei Formen mit festem Verhältnis – Kreis, Herz … – bleibt die Karte, das PDF bekommt dann Rand.)
 * @param {any} S
 */
export function fitPrint(S) {
	const P = paper(S);
	if (!P || !S || (S.design && /** @type {any} */ (DESIGNS)[S.design] && /** @type {any} */ (DESIGNS)[S.design].aspect)) return;
	const g = withState(S, geo);
	const a = (g.W * (P.h / P.w) - (g.H - g.MH)) / MW;
	if (Number.isFinite(a)) S.view.a = Math.max(0.4, Math.min(2.4, +a.toFixed(4)));
}

/* ---------- Qualitäts-Ampel ---------- */
/**
 * @returns {{level:'ok'|'warn'|'bad', items:{level:'ok'|'warn'|'bad', text:string}[], dpi:number}}
 */
export function quality() {
	const S = app.S;
	const P = paperOrFree(S);
	const g = geo();
	const mmPerUnit = Math.min((P.w * 10) / g.W, (P.h * 10) / g.H);
	/** @type {{level:'ok'|'warn'|'bad', text:string}[]} */
	const items = [];
	if (S.mode === 'std') {
		// Bildauflösung der fertigen Landkarte im Druck
		const R = detailRaster() || RASTER.get(rasterKey());
		if (R && R.pxPerUnit) {
			const dpi = Math.round(R.pxPerUnit / (mmPerUnit / 25.4));
			if (dpi < 100) items.push({ level: 'bad', text: `Kartenbild nur ca. ${dpi} dpi – wirkt im Druck unscharf. Weiter herauszoomen oder kleineres Format wählen.` });
			else if (dpi < 150) items.push({ level: 'warn', text: `Kartenbild ca. ${dpi} dpi – aus der Nähe leicht weich, aus Betrachtungsabstand gut.` });
			else items.push({ level: 'ok', text: `Kartenbild ca. ${Math.min(dpi, 300)} dpi – scharf.` });
		}
	} else {
		// Dünnste sichtbare Linie in Millimetern
		const pk = S.pop ? popK(app.DATA, S) : 1;
		let thin = Infinity,
			who = '';
		Object.keys(CLS).forEach((k) => {
			const c = S.cls[k];
			if (!c || c.h || !(c.w > 0) || !app.DATA.feats.some((/** @type {any} */ f) => f.k === k)) return;
			const mm = c.w * S.scale * pk * mmPerUnit;
			if (mm < thin) {
				thin = mm;
				who = /** @type {Record<string,string>} */ (CLS)[k];
			}
		});
		if (thin < Infinity) {
			const t = thin.toFixed(2).replace('.', ',');
			if (thin < 0.08) items.push({ level: 'bad', text: `${who}: Linien nur ${t} mm – im Druck kaum sichtbar. Unter „Erweitert → Stil“ die Linienstärke erhöhen.` });
			else if (thin < 0.12) items.push({ level: 'warn', text: `${who}: sehr feine Linien (${t} mm) – druckbar, aber zart.` });
			else items.push({ level: 'ok', text: `Linien ab ${t} mm – gut druckbar.` });
		}
	}
	const neon = neonColors(S);
	if (neon.length) items.push({ level: 'warn', text: `Leuchtende Farben (${neon.slice(0, 3).join(', ')}) wirken im Druck etwas matter als am Bildschirm. Mit „Druckfarben simulieren“ siehst du es vorab.` });
	const small = S.attr && S.attr.on ? 11 * mmPerUnit : 99;
	if (small < 1.6) items.push({ level: 'warn', text: 'Die Quellenangabe wird sehr klein gedruckt.' });
	const dpi = exportDpi(P);
	if (dpi < 150) items.push({ level: 'warn', text: `Auf diesem Gerät wird das PDF mit ${dpi} dpi erstellt. Für dieses Format besser am PC erzeugen oder SVG nutzen.` });
	const order = { ok: 0, warn: 1, bad: 2 };
	const level = items.reduce((/** @type {'ok'|'warn'|'bad'} */ l, i) => (order[i.level] > order[l] ? i.level : l), 'ok');
	return { level, items, dpi };
}

/** Erreichbare Auflösung beim Export (Handys haben weniger Grafikspeicher) @param {{w:number,h:number}} P */
export function exportDpi(P) {
	const mobile = matchMedia('(pointer: coarse)').matches;
	const maxPx = mobile ? 16e6 : 40e6;
	const inch = ((P.w + (2 * BLEED) / 10) / 2.54) * ((P.h + (2 * BLEED) / 10) / 2.54);
	return Math.max(72, Math.min(300, Math.floor(Math.sqrt(maxPx / inch))));
}

/* ---------- PDF mit Beschnittzugabe ---------- */
/** Poster-SVG als Bild laden */
async function posterImage() {
	const url = URL.createObjectURL(new Blob([buildSVG(true)], { type: 'image/svg+xml' }));
	const img = new Image();
	await new Promise((res, rej) => {
		img.onload = res;
		img.onerror = rej;
		img.src = url;
	});
	try {
		await img.decode();
	} catch (e) {}
	await new Promise((r) => setTimeout(r, 120));
	return { img, url };
}

/**
 * Druck-PDF: Seite = Endformat + 3 mm Beschnitt rundum, Poster mittig im Endformat,
 * Beschnitt in Papierfarbe. TrimBox/BleedBox sind gesetzt, damit die Druckerei weiß, wo geschnitten wird.
 */
export async function buildPDF() {
	const S = app.S;
	const P = paperOrFree(S);
	const dpi = exportDpi(P);
	const mm = (/** @type {number} */ v) => (v * 72) / 25.4; // mm → PDF-Punkte
	const pw = P.w * 10 + 2 * BLEED,
		ph = P.h * 10 + 2 * BLEED; // Seite in mm
	const W = Math.round((pw / 25.4) * dpi),
		H = Math.round((ph / 25.4) * dpi);
	const { img, url } = await posterImage();
	const cv = document.createElement('canvas');
	cv.width = W;
	cv.height = H;
	const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
	ctx.fillStyle = S.bg && S.bg !== 'none' ? S.bg : '#ffffff';
	ctx.fillRect(0, 0, W, H);
	const g = geo();
	const pxmm = W / pw;
	const fit = Math.min((P.w * 10) / g.W, (P.h * 10) / g.H);
	const dw = g.W * fit * pxmm,
		dh = g.H * fit * pxmm;
	ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
	URL.revokeObjectURL(url);
	const jpg = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
	if (!jpg) throw new Error('Bild konnte nicht erstellt werden');
	const data = new Uint8Array(await jpg.arrayBuffer());
	cv.width = cv.height = 1; // Speicher freigeben (wichtig am Handy)

	const PW = mm(pw).toFixed(2),
		PH = mm(ph).toFixed(2),
		b = mm(BLEED).toFixed(2);
	const trim = `[${b} ${b} ${(mm(pw) - mm(BLEED)).toFixed(2)} ${(mm(ph) - mm(BLEED)).toFixed(2)}]`;
	const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
	const enc = new TextEncoder();
	/** @type {(string|Uint8Array)[][]} */
	const objs = [
		['<< /Type /Catalog /Pages 2 0 R >>'],
		['<< /Type /Pages /Kids [3 0 R] /Count 1 >>'],
		[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /BleedBox [0 0 ${PW} ${PH}] /TrimBox ${trim} /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`],
		[`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>\nstream\n`, data, '\nendstream'],
		[`<< /Length ${content.length} >>\nstream\n${content}\nendstream`],
		[`<< /Title (Kartenstudio - ${pdfStr(String(app.DATA.place || 'Karte'))}) /Producer (Kartenstudio) >>`]
	];
	/** @type {Uint8Array[]} */
	const parts = [];
	let len = 0;
	const push = (/** @type {string|Uint8Array} */ x) => {
		const u = typeof x === 'string' ? enc.encode(x) : x;
		parts.push(u);
		len += u.length;
	};
	push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
	/** @type {number[]} */
	const offs = [];
	objs.forEach((o, i) => {
		offs.push(len);
		push(`${i + 1} 0 obj\n`);
		o.forEach(push);
		push('\nendobj\n');
	});
	const xref = len;
	push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join(''));
	push(`trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
	return { blob: new Blob(/** @type {BlobPart[]} */ (parts), { type: 'application/pdf' }), dpi, paper: P };
}

/** Text für PDF-Metadaten (nur einfache Zeichen) @param {string} s */
function pdfStr(s) {
	return s.replace(/[^\x20-\x7e]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' })[c] || '').replace(/[()\\]/g, '');
}

/** Sehr kräftige Bildschirmfarben, die im Druck (CMYK) nicht ganz erreicht werden @param {any} S */
export function neonColors(S) {
	/** @type {Set<string>} */
	const cols = new Set();
	const add = (/** @type {any} */ c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) && cols.add(c.toLowerCase());
	add(S.bg);
	add(S.bar && S.bar.on && S.bar.color);
	add(S.frame && S.frame.w > 0 && S.frame.color);
	add(S.title && S.title.color);
	if (S.mode !== 'std') Object.values(S.cls || {}).forEach((/** @type {any} */ c) => c && !c.h && (add(c.s), add(c.f)));
	(S.pop && S.pop.pal ? S.pop.pal : []).forEach(add);
	return [...cols].filter((c) => {
		const r = parseInt(c.slice(1, 3), 16) / 255,
			g = parseInt(c.slice(3, 5), 16) / 255,
			b = parseInt(c.slice(5, 7), 16) / 255;
		const mx = Math.max(r, g, b),
			mn = Math.min(r, g, b),
			l = (mx + mn) / 2,
			s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
		// Grob: sehr gesättigt + mittelhell (Neon-Grün/-Pink/-Cyan, reines RGB-Blau …)
		return s > 0.85 && l > 0.38 && l < 0.72 && (g > 0.75 || (b > 0.8 && r < 0.4) || (r > 0.85 && b > 0.6));
	});
}
