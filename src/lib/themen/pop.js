// „Pop-Art“-Themen nach dem Vorbild illustrierter Stadtpläne (Wimmelbild-Stil).
//
// Das System dahinter (statt zufälligem Streuen):
//  1. Symbole stehen in REIHEN ENTLANG DER STRASSEN und sind in Straßenrichtung gedreht.
//  2. Straßen bleiben als gleich breite, saubere Wege frei (Symbole halten Abstand).
//  3. Gefüllt wird nur der BEBAUTE ORT (Nähe zu Gebäuden) – drumherum bleibt frei,
//     so wird die Form des Ortes sichtbar.
//  4. Alle Symbole haben dieselbe Größe; Lücken im Ort werden in einem Raster aufgefüllt,
//     ebenfalls in Richtung der nächsten Straße gedreht.
//  5. Gewässer: kräftiges Band mit freiem Rand.

/** Feste Zufallszahl 0–1 aus ganzen Zahlen. @param {number} a @param {number} b @param {number} c */
export function hash3(a, b, c) {
	let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
	x = Math.imul(x ^ (x >>> 13), 1274126177);
	return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
/** Feste Zufallszahl aus einem Text. @param {string} s */
export function hashStr(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return hash3(h, 7, 11);
}

/** Kreis/Kurve als Punktliste. @param {number} cx @param {number} cy @param {number} r @param {number} n */
const ring = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)]);
/**
 * Symbole als Vielecke um (0,0), Radius ≈ 1, „vorne“ zeigt nach rechts (Straßenrichtung).
 * Als Punktlisten statt SVG-Elementen: So lassen sich alle Symbole einer Farbe zu EINER
 * Form zusammenfassen – tausende Einzelelemente würden den Browser stark ausbremsen.
 * @type {number[][][][]}
 */
const SYMBOLS = [
	[[[-1, 0.3], [0.25, 0.3], [0.25, 0.75], [1, 0], [0.25, -0.75], [0.25, -0.3], [-1, -0.3]]], // Pfeil
	[[[-0.8, 0.8], [-0.8, -0.1], [0, -0.9], [0.8, -0.1], [0.8, 0.8]]], // Haus
	[[[0, -1], [0.87, 0.6], [-0.87, 0.6]]], // Baum
	[Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.42 : 1; return [r * Math.cos(a), r * Math.sin(a)]; })], // Stern
	[Array.from({ length: 18 }, (_, i) => { const t = (i / 18) * 2 * Math.PI; return [(16 * Math.sin(t) ** 3) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]; })], // Herz
	[[[-1, -0.45], [0.55, -0.45], [1, 0], [1, 0.4], [-1, 0.4]], ring(-0.45, 0.45, 0.24, 8), ring(0.5, 0.45, 0.24, 8)], // Auto
	[[[-0.75, -0.75], [0.75, -0.75], [0.75, 0.75], [-0.75, 0.75]]], // Quadrat
	[ring(0, 0, 0.9, 14)], // Kreis
	[[[-0.3, -1], [0.3, -1], [0.3, -0.3], [1, -0.3], [1, 0.3], [0.3, 0.3], [0.3, 1], [-0.3, 1], [-0.3, 0.3], [-1, 0.3], [-1, -0.3], [-0.3, -0.3]]], // Plus
	[[[-1, -0.2], [-0.5, -0.7], [0, -0.2], [0.5, -0.7], [1, -0.2], [1, 0.4], [0.5, -0.1], [0, 0.4], [-0.5, -0.1], [-1, 0.4]]] // Zickzack
];

/** (früher: Symbol-Definitionen) – nicht mehr nötig, Symbole sind direkt als Formen eingebettet */
export function popDefs() {
	return '';
}

/** Pop-Themen zeichnen Häuser nicht als Grundriss – die Symbole stehen für die Bebauung */
export const POP_HIDE = ['haus', 'gruen'];

const ROADS = ['haupt', 'neben', 'bahn'];

/**
 * Maßstabsfaktor: Bei großen Ausschnitten (Städte) werden Symbole und Straßen schmaler,
 * damit Symbole zwischen die Straßen passen. Untergrenze begrenzt die Symbolanzahl
 * (sonst wird es auf dem Handy zäh).
 * @param {any} DATA @param {any} S
 */
export function popK(DATA, S) {
	if (!DATA || !DATA.proj) return 1;
	const P = DATA.proj;
	const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * (P.y0 + (DATA.MH0 || 800) / 2 / P.sc)))) * 180 / Math.PI;
	const mPerUnit = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / P.sc;
	const visW = (1004 / S.view.z) * mPerUnit; // sichtbare Breite in Metern
	return Math.max(0.5, Math.min(1.2, 750 / visW));
}

/**
 * Räumliches Raster für schnelle Nachbarschaftssuche.
 * @param {number} cell
 */
function bins(cell) {
	/** @type {Map<number, any[]>} */
	const m = new Map();
	const key = (/** @type {number} */ i, /** @type {number} */ j) => i * 100003 + j;
	return {
		/** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {any} v */
		add(x0, y0, x1, y1, v) {
			for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++)
				for (let j = Math.floor(y0 / cell); j <= Math.floor(y1 / cell); j++) {
					const k = key(i, j);
					let a = m.get(k);
					if (!a) m.set(k, (a = []));
					a.push(v);
				}
		},
		/** @param {number} x @param {number} y @param {number} r @param {(v:any)=>boolean|void} fn */
		near(x, y, r, fn) {
			for (let i = Math.floor((x - r) / cell); i <= Math.floor((x + r) / cell); i++)
				for (let j = Math.floor((y - r) / cell); j <= Math.floor((y + r) / cell); j++) {
					const a = m.get(key(i, j));
					if (a) for (const v of a) if (fn(v)) return true;
				}
			return false;
		}
	};
}

/** Abstand Punkt–Strecke. */
function segDist(/** @type {number} */ px, /** @type {number} */ py, /** @type {number[]} */ s) {
	const dx = s[2] - s[0],
		dy = s[3] - s[1];
	const L = dx * dx + dy * dy || 1;
	const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / L));
	const qx = s[0] + t * dx - px,
		qy = s[1] + t * dy - py;
	return Math.sqrt(qx * qx + qy * qy);
}

/**
 * Symbol-Ebene für das Poster.
 * @param {any} DATA Kartendaten
 * @param {any} S Editor-Zustand
 * @param {number[]} rect Kartenbereich [x0,y0,x1,y1], der gefüllt wird
 * @param {string[]} pal Farbpalette
 */
export function popSymbols(DATA, S, rect, pal) {
	const k = popK(DATA, S);
	const u = k / S.view.z; // 1 (maßstabsangepasste) Poster-Einheit in Kartenkoordinaten
	const sc = (S.scale * k) / S.view.z;
	const r = 6.2 * u; // Symbolradius
	const step = 2 * r + 3 * u; // Abstand der Symbole
	const M = 60 * u; // Rand um den Bereich
	const R = [rect[0] - M, rect[1] - M, rect[2] + M, rect[3] + M];
	const inR = (/** @type {number} */ x, /** @type {number} */ y) => x >= R[0] && x <= R[2] && y >= R[1] && y <= R[3];

	// Straßen- und Gewässerstrecken sammeln
	const segs = bins(40 * u);
	/** @type {number[][]} */
	const roadSegs = [];
	for (const f of DATA.feats) {
		const isRoad = ROADS.includes(f.k);
		if (!isRoad && f.k !== 'wasser') continue; // Fußwege bekommen keinen eigenen Kanal
		const bx = f.bx;
		if (bx[2] < R[0] || bx[0] > R[2] || bx[3] < R[1] || bx[1] > R[3]) continue;
		const c = S.cls[f.k];
		if (c.h) continue;
		const hw = Math.max(1, c.w * sc) / 2 + (f.k === 'wasser' ? 6 * u : 0);
		const P = f.pts;
		for (let i = 0; i + 3 < P.length; i += 2) {
			const s = [P[i], P[i + 1], P[i + 2], P[i + 3], hw, f.k === 'haupt' ? 0 : f.k === 'neben' ? 1 : 2, f.a && f.k === 'wasser' ? 1 : 0];
			if (Math.hypot(s[2] - s[0], s[3] - s[1]) > 400 * u) continue; // Sprung zwischen Teilstücken
			segs.add(Math.min(s[0], s[2]) - hw, Math.min(s[1], s[3]) - hw, Math.max(s[0], s[2]) + hw, Math.max(s[1], s[3]) + hw, s);
			if (isRoad) roadSegs.push(s);
		}
	}
	// Bebauung (für die Ortsform)
	const near = 26 * u;
	const blds = bins(40 * u);
	/** @type {number[][]} */
	const houses = [];
	for (const f of DATA.feats) {
		if (f.k !== 'haus') continue;
		const b = f.bx;
		if (b[2] < R[0] || b[0] > R[2] || b[3] < R[1] || b[1] > R[3]) continue;
		blds.add(b[0] - near, b[1] - near, b[2] + near, b[3] + near, b);
		houses.push(b);
	}
	// Abstand zum Gebäude (abgerundet), damit der Ortsrand weich statt eckig verläuft
	const built = (/** @type {number} */ x, /** @type {number} */ y) =>
		blds.near(x, y, 0, (b) => Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3])) < near);
	// Abstand zu Straßen/Wasser (true = zu nah)
	// (Strecken sind mit ihrer halben Breite einsortiert → Suchradius = Symbolradius genügt)
	const onRoad = (/** @type {number} */ x, /** @type {number} */ y) => segs.near(x, y, r, (s) => segDist(x, y, s) < s[4] + r * 0.75);
	/** Richtung der nächsten Straße (Bogenmaß) */
	const roadAngle = (/** @type {number} */ x, /** @type {number} */ y) => {
		let best = 1e9,
			ang = 0;
		segs.near(x, y, 45 * u, (s) => {
			if (s[5] > 2) return;
			const d = segDist(x, y, s);
			if (d < best) {
				best = d;
				ang = Math.atan2(s[3] - s[1], s[2] - s[0]);
			}
		});
		return ang;
	};
	const occ = bins(step);
	const taken = (/** @type {number} */ x, /** @type {number} */ y) => occ.near(x, y, step, (p) => Math.hypot(p[0] - x, p[1] - y) < step * 0.9);

	/** @type {Map<string,string[]>} Formen je Farbe */
	const byCol = new Map();
	/** @param {number} x @param {number} y @param {number} ang */
	const put = (x, y, ang) => {
		occ.add(x, y, x, y, [x, y]);
		const hx = Math.round(x / u),
			hy = Math.round(y / u);
		const sym = Math.floor(hash3(hx, hy, 4) * SYMBOLS.length);
		const col = pal[Math.floor(hash3(hx, hy, 5) * pal.length)];
		// Bäume/Häuser stehen „aufrecht“ zur Straße, alles andere zeigt in Fahrtrichtung
		let a = ang + (hash3(hx, hy, 6) < 0.5 ? 0 : Math.PI);
		if (sym === 1 || sym === 2) a -= Math.PI / 2;
		const c = Math.cos(a) * r,
			sn = Math.sin(a) * r;
		let d = '';
		for (const poly of SYMBOLS[sym]) {
			poly.forEach(([px, py], i) => {
				d += (i ? 'L' : 'M') + (x + c * px - sn * py).toFixed(1) + ' ' + (y + sn * px + c * py).toFixed(1);
			});
			d += 'Z';
		}
		let arr = byCol.get(col);
		if (!arr) byCol.set(col, (arr = []));
		arr.push(d);
	};

	// 1) Reihen entlang der Straßen (Hauptstraßen zuerst)
	roadSegs.sort((a, b) => a[5] - b[5]);
	for (const s of roadSegs) {
		const dx = s[2] - s[0],
			dy = s[3] - s[1];
		const L = Math.hypot(dx, dy);
		if (L < 1e-6) continue;
		const tx = dx / L,
			ty = dy / L,
			ang = Math.atan2(dy, dx);
		const cnt = Math.max(1, Math.floor(L / step));
		for (let k = 0; k <= cnt; k++) {
			const bxp = s[0] + tx * k * step,
				byp = s[1] + ty * k * step;
			for (const side of [1, -1])
				for (let row = 0; row < 3; row++) {
					const off = s[4] + r * 0.8 + 1.5 * u + row * step;
					const x = bxp - ty * off * side,
						y = byp + tx * off * side;
					if (!inR(x, y) || !built(x, y) || onRoad(x, y) || taken(x, y)) continue;
					put(x, y, ang);
				}
		}
	}
	// 2) Lücken im bebauten Ort auffüllen (Raster), ebenfalls in Straßenrichtung
	const i0 = Math.floor(R[0] / step),
		i1 = Math.ceil(R[2] / step),
		j0 = Math.floor(R[1] / step),
		j1 = Math.ceil(R[3] / step);
	for (let i = i0; i <= i1; i++)
		for (let j = j0; j <= j1; j++) {
			// leicht versetzt, damit kein starres Raster entsteht
			const x = (i + 0.5 + (hash3(i, j, 8) - 0.5) * 0.3 + (j % 2) * 0.5) * step,
				y = (j + 0.5 + (hash3(i, j, 9) - 0.5) * 0.3) * step;
			if (!built(x, y) || onRoad(x, y) || taken(x, y)) continue;
			put(x, y, roadAngle(x, y));
		}
	let o = '<g id="symbole">';
	byCol.forEach((ds, col) => (o += `<path fill="${col}" d="${ds.join('')}"/>`));
	return o + '</g>';
}

/** Häuserfarbe aus der Palette – fest pro Gebäude (für Vorschaubilder ohne Symbole). @param {string} id @param {string[]} pal */
export function popColor(id, pal) {
	return pal[Math.floor(hashStr(id) * pal.length)];
}
