// Koordinaten-Poster: statt einer Karte große Koordinaten, der Ortsname und ein eigener Text
// (z. B. eine kleine Geschichte zum Ort). Beliebt zum Einzug, zur Hochzeit oder als Firmengeschenk.

/** Breiten-/Längengrad als 48° 08′ 06″ N @param {number} v @param {string} pos @param {string} neg */
export function grad(v, pos, neg) {
	const s = v < 0 ? neg : pos;
	v = Math.abs(v);
	const d = Math.floor(v),
		m = Math.floor((v - d) * 60),
		sec = Math.round(((v - d) * 60 - m) * 60);
	return `${d}° ${String(m).padStart(2, '0')}′ ${String(Math.min(59, sec)).padStart(2, '0')}″ ${s}`;
}

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;
/** Textbreite in SVG-Einheiten (Schriften sind im Dokument geladen) @param {string} t @param {string} font @param {number} size */
function breite(t, font, size) {
	if (!ctx) ctx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
	ctx.font = `${size}px ${font}`;
	return ctx.measureText(t).width;
}

/**
 * Fließtext in Zeilen umbrechen.
 * @param {string} text @param {string} font @param {number} size @param {number} max
 */
export function umbrechen(text, font, size, max) {
	/** @type {string[]} */
	const out = [];
	String(text || '')
		.split(/\n/)
		.forEach((abs) => {
			let z = '';
			abs.split(/\s+/)
				.filter(Boolean)
				.forEach((w) => {
					const t = z ? z + ' ' + w : w;
					if (breite(t, font, size) > max && z) {
						out.push(z);
						z = w;
					} else z = t;
				});
			out.push(z);
		});
	return out;
}

/** @param {string} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Koordinaten-Poster in der Kartenfläche (Breite W, Höhe H, Ursprung oben links).
 * @param {{lat:number, lon:number, name:string, text:string, ink:string, bg:string, align?:string}} o
 * @param {number} W @param {number} H
 */
export function koordSVG(o, W, H) {
	const pad = W * 0.1;
	const big = W * 0.072,
		name = W * 0.115,
		body = W * 0.024;
	const left = o.align !== 'mitte';
	const x = left ? pad : W / 2;
	const anchor = left ? 'start' : 'middle';
	let r = o.bg && o.bg !== 'none' ? `<rect width="${W}" height="${H.toFixed(1)}" fill="${o.bg}"/>` : '';
	const zeilen = umbrechen(o.text, 'SgMD', body, W - 2 * pad);
	const lh = body * 1.55;
	const block = big * 0.73 + big * 1.25 + name * 1.05 + big * 1.0 + (zeilen.length ? big * 0.9 + lh * zeilen.length : 0);
	let y = Math.max(pad, (H - block) / 2) + big * 0.73;
	r += `<g fill="${o.ink}" text-anchor="${anchor}">`;
	r += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="SgXB" font-size="${big.toFixed(1)}">${esc(grad(o.lat, 'N', 'S'))}</text>`;
	y += name * 1.12;
	// Ortsname groß – bei langen Namen automatisch kleiner, damit er in die Breite passt
	let ns = name;
	const nw = breite(o.name.toUpperCase(), 'SgXB', ns);
	if (nw > W - 2 * pad) ns *= (W - 2 * pad) / nw;
	r += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="SgXB" font-size="${ns.toFixed(1)}">${esc(o.name.toUpperCase())}</text>`;
	y += big * 1.25;
	r += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="SgXB" font-size="${big.toFixed(1)}">${esc(grad(o.lon, 'O', 'W'))}</text>`;
	if (zeilen.length) {
		y += big * 0.9 + lh * 0.4;
		r += `<g font-family="SgMD" font-size="${body.toFixed(1)}" fill-opacity=".82">`;
		zeilen.forEach((z, i) => (r += `<text x="${x.toFixed(1)}" y="${(y + i * lh).toFixed(1)}">${esc(z)}</text>`));
		r += '</g>';
	}
	return r + '</g>';
}

export const STORY_BEISPIEL =
	'Hier haben wir uns kennengelernt, hier haben wir gelacht, gestritten und uns wieder vertragen. Hier sind unsere Kinder groß geworden und hier kommen wir immer wieder gern nach Hause. Ein Ort, viele Geschichten – und das Beste kommt noch.';
