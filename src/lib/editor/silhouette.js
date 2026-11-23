// Eigene Form: Aus einem hochgeladenen Bild (Silhouette, Logo, freigestelltes Foto) oder aus
// einem Buchstaben wird eine Umrisslinie berechnet – die Karte wird dann genau in diese Form geschnitten.
//
// Warum Vektor statt Bildmaske? Die Umrisslinie bleibt in jeder Druckgröße scharf, funktioniert
// auch im Vektor-PDF und passt als Zahlenliste in den gespeicherten Entwurf und den Teilen-Link.
//
// Ablauf: Bild verkleinern → Schwarz/Weiß-Maske (Transparenz, sonst Helligkeit mit automatischer
// Schwelle; Vorder-/Hintergrund an den Bildecken erkannt) → Umrisse finden (Marching Squares)
// → vereinfachen (Douglas-Peucker) → leicht glätten → auf 0…1000 normieren.

/** @typedef {{ ringe: number[][], a: number, quelle?: string }} Form */

/** Zuletzt benutzte Schwelle (für den Schieberegler; −1 = Bild hat Transparenz) */
export const zuletzt = { schwelle: -1 };
const MAX = 360; // Rechenauflösung (längste Seite in Pixeln)
const PUNKTE = 2400; // höchstens so viele Punkte insgesamt (Speicher/Teilen-Link)

/**
 * Pixel → Maske (1 = gehört zur Form)
 * @param {ImageData} img @param {{schwelle?: number, umkehren?: boolean}} o
 */
export function maske(img, o = {}) {
	const { width: w, height: h, data: d } = img;
	const n = w * h;
	// Hat das Bild echte Transparenz? Dann ist die Form alles, was nicht durchsichtig ist.
	let durch = 0;
	for (let i = 3; i < d.length; i += 4) if (d[i] < 128) durch++;
	const m = new Uint8Array(n);
	if (durch > n * 0.02) {
		zuletzt.schwelle = -1;
		for (let i = 0; i < n; i++) m[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
	} else {
		const L = new Float32Array(n);
		const hist = new Array(256).fill(0);
		for (let i = 0; i < n; i++) {
			const v = 0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2];
			L[i] = v;
			hist[Math.round(v)]++;
		}
		const t = o.schwelle != null && o.schwelle >= 0 ? o.schwelle : otsu(hist, n);
		zuletzt.schwelle = t;
		// Hintergrund = Farbe der Bildecken
		const ecken = [0, w - 1, n - w, n - 1].map((i) => L[i]);
		const hellerGrund = ecken.filter((v) => v > t).length >= 2;
		for (let i = 0; i < n; i++) m[i] = (L[i] > t) !== hellerGrund ? 1 : 0;
	}
	if (o.umkehren) for (let i = 0; i < n; i++) m[i] = 1 - m[i];
	return m;
}
/** Automatische Schwelle (Otsu): trennt hell und dunkel bestmöglich @param {number[]} hist @param {number} n */
function otsu(hist, n) {
	let sum = 0;
	for (let i = 0; i < 256; i++) sum += i * hist[i];
	let sB = 0, wB = 0, best = 0, t = 128;
	for (let i = 0; i < 256; i++) {
		wB += hist[i];
		if (!wB) continue;
		const wF = n - wB;
		if (!wF) break;
		sB += i * hist[i];
		const mB = sB / wB, mF = (sum - sB) / wF;
		const v = wB * wF * (mB - mF) ** 2;
		if (v > best) (best = v), (t = i);
	}
	return t;
}

/**
 * Umrisse der Maske als geschlossene Linienzüge (Marching Squares).
 * @param {Uint8Array} m @param {number} w @param {number} h @returns {number[][]}
 */
export function umrisse(m, w, h) {
	// Rand von 1 Pixel, damit jeder Umriss geschlossen ist
	const W = w + 2, H = h + 2;
	const p = new Uint8Array(W * H);
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) p[(y + 1) * W + x + 1] = m[y * w + x];
	/** Kanten → Punkte: Schlüssel je Kantenmitte */
	const nach = new Map();
	const key = (/** @type {number} */ x, /** @type {number} */ y) => x * 2 + ',' + y * 2;
	/** @param {number[]} a @param {number[]} b */
	const seg = (a, b) => nach.set(key(a[0], a[1]), b);
	for (let y = 0; y < H - 1; y++) {
		for (let x = 0; x < W - 1; x++) {
			const tl = p[y * W + x], tr = p[y * W + x + 1], br = p[(y + 1) * W + x + 1], bl = p[(y + 1) * W + x];
			const c = (tl << 3) | (tr << 2) | (br << 1) | bl;
			if (c === 0 || c === 15) continue;
			const T = [x + 0.5, y], R = [x + 1, y + 0.5], B = [x + 0.5, y + 1], L = [x, y + 0.5];
			// Richtung so, dass die Form immer links liegt (ergibt saubere, geschlossene Ringe)
			switch (c) {
				case 1: seg(B, L); break;
				case 2: seg(R, B); break;
				case 3: seg(R, L); break;
				case 4: seg(T, R); break;
				case 5: seg(T, R); seg(B, L); break;
				case 6: seg(T, B); break;
				case 7: seg(T, L); break;
				case 8: seg(L, T); break;
				case 9: seg(B, T); break;
				case 10: seg(L, T); seg(R, B); break;
				case 11: seg(R, T); break;
				case 12: seg(L, R); break;
				case 13: seg(B, R); break;
				case 14: seg(L, B); break;
			}
		}
	}
	/** @type {number[][]} */
	const ringe = [];
	const besucht = new Set();
	for (const [k0, erst] of nach) {
		if (besucht.has(k0)) continue;
		const [sx, sy] = k0.split(',').map((/** @type {string} */ v) => +v / 2);
		const r = [sx - 1, sy - 1];
		besucht.add(k0);
		let cur = erst;
		for (let i = 0; i < 200000; i++) {
			const k = key(cur[0], cur[1]);
			if (k === k0 || besucht.has(k)) break;
			besucht.add(k);
			r.push(cur[0] - 1, cur[1] - 1);
			cur = nach.get(k);
			if (!cur) break;
		}
		if (r.length >= 8) ringe.push(r);
	}
	return ringe;
}

/** Fläche eines Rings (mit Vorzeichen) @param {number[]} r */
const flaeche = (r) => {
	let s = 0;
	for (let i = 0, n = r.length; i < n; i += 2) {
		const j = (i + 2) % n;
		s += r[i] * r[j + 1] - r[j] * r[i + 1];
	}
	return s / 2;
};
/** Douglas-Peucker für geschlossene Ringe @param {number[]} r @param {number} tol */
function vereinfachen(r, tol) {
	const pts = [];
	for (let i = 0; i < r.length; i += 2) pts.push([r[i], r[i + 1]]);
	if (pts.length < 8) return r;
	const keep = new Uint8Array(pts.length);
	keep[0] = keep[pts.length - 1] = 1;
	// Ring an der Mitte teilen, sonst fällt er auf eine Linie zusammen
	const mitte = Math.floor(pts.length / 2);
	keep[mitte] = 1;
	const st = [[0, mitte], [mitte, pts.length - 1]];
	while (st.length) {
		const [a, b] = /** @type {number[]} */ (st.pop());
		const [ax, ay] = pts[a], [bx, by] = pts[b];
		const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
		let best = -1, bi = -1;
		for (let i = a + 1; i < b; i++) {
			const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / l;
			if (d > best) (best = d), (bi = i);
		}
		if (best > tol) {
			keep[bi] = 1;
			st.push([a, bi], [bi, b]);
		}
	}
	const out = [];
	for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i][0], pts[i][1]);
	return out;
}
/** Ecken weicher machen (Chaikin, eine Runde) @param {number[]} r */
function glaetten(r) {
	const out = [];
	const n = r.length;
	for (let i = 0; i < n; i += 2) {
		const j = (i + 2) % n;
		out.push(0.75 * r[i] + 0.25 * r[j], 0.75 * r[i + 1] + 0.25 * r[j + 1], 0.25 * r[i] + 0.75 * r[j], 0.25 * r[i + 1] + 0.75 * r[j + 1]);
	}
	return out;
}

/**
 * Maske → fertige Form (normiert auf Breite 1000).
 * @param {Uint8Array} m @param {number} w @param {number} h @returns {Form|null}
 */
export function formAusMaske(m, w, h) {
	let ringe = umrisse(m, w, h);
	if (!ringe.length) return null;
	// Winzige Krümel weglassen
	const fl = ringe.map((r) => Math.abs(flaeche(r)));
	const gross = Math.max(...fl);
	ringe = ringe.filter((_, i) => fl[i] > gross * 0.004 && fl[i] > 6);
	let tol = 0.6;
	let v = ringe.map((r) => vereinfachen(r, tol));
	while (v.reduce((s, r) => s + r.length / 2, 0) > PUNKTE / 2 && tol < 8) {
		tol *= 1.4;
		v = ringe.map((r) => vereinfachen(r, tol));
	}
	v = v.filter((r) => r.length >= 6).map(glaetten);
	if (!v.length) return null;
	let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
	v.forEach((r) => {
		for (let i = 0; i < r.length; i += 2) {
			x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]);
			y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
		}
	});
	const bw = x1 - x0 || 1, bh = y1 - y0 || 1;
	const k = 1000 / bw;
	return {
		ringe: v.map((r) => r.map((c, i) => Math.round((i % 2 ? c - y0 : c - x0) * k))),
		a: Math.round((bh / bw) * 1000) / 1000
	};
}

/** Bild (Datei) in eine verkleinerte Leinwand laden @param {Blob} datei @returns {Promise<ImageData>} */
export async function bildLaden(datei) {
	const url = URL.createObjectURL(datei);
	try {
		const img = new Image();
		img.src = url;
		await img.decode();
		const s = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
		const w = Math.max(8, Math.round(img.naturalWidth * s)), h = Math.max(8, Math.round(img.naturalHeight * s));
		const c = document.createElement('canvas');
		c.width = w;
		c.height = h;
		const x = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }));
		x.drawImage(img, 0, 0, w, h);
		return x.getImageData(0, 0, w, h);
	} finally {
		URL.revokeObjectURL(url);
	}
}

/** @type {Map<string, Form>} */
const TEXTE = new Map();
/** Text (z. B. Anfangsbuchstabe oder Jahreszahl) als Form @param {string} text @param {string} [schrift] */
export function textForm(text, schrift = 'SgXB') {
	const t = String(text || 'A').trim().slice(0, 8) || 'A';
	const k = t + '|' + schrift;
	if (TEXTE.has(k)) return TEXTE.get(k);
	const c = document.createElement('canvas');
	const x = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }));
	const size = 260;
	x.font = `${size}px ${schrift}`;
	const w = Math.ceil(x.measureText(t).width) + 40, h = Math.round(size * 1.25);
	c.width = Math.min(1400, w);
	c.height = h;
	x.font = `${size}px ${schrift}`;
	x.fillStyle = '#000';
	x.textBaseline = 'middle';
	x.fillText(t, 20, h / 2);
	const img = x.getImageData(0, 0, c.width, h);
	const f = formAusMaske(maske(img), c.width, h);
	// erst merken, wenn die Schrift geladen ist (sonst Ersatzschrift)
	if (f && document.fonts.check(`30px ${schrift}`)) TEXTE.set(k, f);
	return f;
}

/**
 * Form als SVG-Pfad, eingepasst (Seitenverhältnis bleibt) in w × h, optional um `grow` größer.
 * @param {Form} F @param {number} w @param {number} h @param {number} [grow]
 */
export function formPfad(F, w, h, grow = 0) {
	const s0 = Math.min(w / 1000, h / (1000 * F.a));
	const fw = 1000 * s0, fh = 1000 * F.a * s0;
	const sx = (fw + 2 * grow) / 1000, sy = (fh + 2 * grow) / (1000 * F.a);
	const ox = (w - fw) / 2 - grow, oy = (h - fh) / 2 - grow;
	return F.ringe
		.map((r) => {
			let d = '';
			for (let i = 0; i < r.length; i += 2) d += (i ? 'L' : 'M') + (ox + r[i] * sx).toFixed(1) + ' ' + (oy + r[i + 1] * sy).toFixed(1);
			return d + 'Z';
		})
		.join('');
}

/** Gültige Form? (Entwurf/Teilen-Link kommen von außen) @param {any} F */
export const formOk = (F) =>
	!!F && Array.isArray(F.ringe) && F.ringe.length > 0 && F.ringe.length < 400 && F.ringe.every((/** @type {any} */ r) => Array.isArray(r) && r.length >= 6 && r.length <= 4800 && r.every((v) => Number.isFinite(v))) && Number.isFinite(F.a) && F.a > 0.05 && F.a < 20;
