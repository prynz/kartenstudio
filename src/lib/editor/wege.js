// Wegenetz aus den Kartendaten: Route „folgt den Wegen“ beim Zeichnen.
// Straßen/Wege (Haupt-, Nebenstraßen, Feldwege) werden zu einem Graphen verbunden – auch dort, wo sich
// Linien kreuzen, ohne einen gemeinsamen Punkt zu haben (Kacheln vereinfachen die Linien), und dort, wo
// ein Weg knapp vor einer Straße endet. Danach sucht Dijkstra den kürzesten Weg zwischen zwei Punkten.
// Alles läuft im Browser, ohne fremden Routing-Dienst.

const KLASSEN = new Set(['haupt', 'neben', 'weg']);
const ZELLE = 24; // Rastergröße (Kartenkoordinaten) für die schnelle Suche
const FANG = 1.2; // Weg-Enden, die so nah an einer anderen Linie liegen, werden angeschlossen

/** @type {WeakMap<object, any>} */
const CACHE = new WeakMap();

/** Linien aus einem SVG-Pfad (M/L) lesen @param {string} d */
function linien(d) {
	/** @type {number[][]} */
	const out = [];
	/** @type {number[]|null} */
	let cur = null;
	const re = /([ML])\s*(-?[\d.]+)[ ,](-?[\d.]+)/g;
	let m;
	while ((m = re.exec(d))) {
		if (m[1] === 'M') {
			cur = [];
			out.push(cur);
		}
		/** @type {number[]} */ (cur).push(+m[2], +m[3]);
	}
	return out.filter((l) => l.length >= 4);
}

/** Wegenetz für die geladenen Daten (einmal je Datensatz) @param {any} D */
export function netz(D) {
	if (!D || !D.feats) return null;
	let N = CACHE.get(D);
	// nach dem Nachladen weiterer Karte (mehr Linien) neu aufbauen
	if (N && N.n === D.feats.length) return N;
	// 1) Segmente sammeln
	/** @type {number[][]} [x1,y1,x2,y2] */
	const seg = [];
	for (const f of D.feats) {
		if (f.a || !KLASSEN.has(f.k)) continue;
		for (const l of linien(f.d))
			for (let i = 0; i + 3 < l.length; i += 2) if (l[i] !== l[i + 2] || l[i + 1] !== l[i + 3]) seg.push([l[i], l[i + 1], l[i + 2], l[i + 3]]);
	}
	// 2) Raster für die Nachbarsuche
	/** @type {Map<string, number[]>} */
	const raster = new Map();
	seg.forEach((s, i) => {
		const x0 = Math.floor((Math.min(s[0], s[2]) - FANG) / ZELLE),
			x1 = Math.floor((Math.max(s[0], s[2]) + FANG) / ZELLE),
			y0 = Math.floor((Math.min(s[1], s[3]) - FANG) / ZELLE),
			y1 = Math.floor((Math.max(s[1], s[3]) + FANG) / ZELLE);
		for (let x = x0; x <= x1; x++)
			for (let y = y0; y <= y1; y++) {
				const k = x + ',' + y;
				const a = raster.get(k);
				if (a) a.push(i);
				else raster.set(k, [i]);
			}
	});
	// 3) Schnittpunkte und angeschlossene Enden → Teilungsstellen je Segment (t von 0..1)
	/** @type {number[][]} */
	const teil = seg.map(() => []);
	const gesehen = new Set();
	for (const ids of raster.values()) {
		for (let a = 0; a < ids.length; a++)
			for (let b = a + 1; b < ids.length; b++) {
				const i = ids[a],
					j = ids[b];
				const key = i < j ? i * 1e7 + j : j * 1e7 + i;
				if (gesehen.has(key)) continue;
				gesehen.add(key);
				const S = seg[i],
					T = seg[j];
				const rx = S[2] - S[0],
					ry = S[3] - S[1],
					sx = T[2] - T[0],
					sy = T[3] - T[1];
				const den = rx * sy - ry * sx;
				if (Math.abs(den) > 1e-9) {
					const qx = T[0] - S[0],
						qy = T[1] - S[1];
					const t = (qx * sy - qy * sx) / den,
						u = (qx * ry - qy * rx) / den;
					if (t > 1e-6 && t < 1 - 1e-6 && u > -1e-6 && u < 1 + 1e-6) teil[i].push(t);
					if (u > 1e-6 && u < 1 - 1e-6 && t > -1e-6 && t < 1 + 1e-6) teil[j].push(u);
				}
				// Enden knapp neben der anderen Linie (Einmündungen)
				anschluss(S, T, teil[j]);
				anschluss(T, S, teil[i]);
			}
	}
	// 4) Knoten + Kanten
	/** @type {Map<string, number>} */
	const idx = new Map();
	/** @type {number[]} */
	const xy = [];
	/** @type {number[][]} je Knoten: [nachbar, länge, nachbar, länge …] */
	const adj = [];
	const knoten = (/** @type {number} */ x, /** @type {number} */ y) => {
		const k = Math.round(x * 2) + ',' + Math.round(y * 2);
		let n = idx.get(k);
		if (n === undefined) {
			n = adj.length;
			idx.set(k, n);
			xy.push(x, y);
			adj.push([]);
		}
		return n;
	};
	/** @type {number[][]} Kanten für die Fangsuche: [a, b] je Teilstück */
	const kanten = [];
	seg.forEach((s, i) => {
		const ts = [0, ...teil[i].sort((a, b) => a - b), 1];
		let prev = knoten(s[0], s[1]);
		for (let k = 1; k < ts.length; k++) {
			if (ts[k] - ts[k - 1] < 1e-6) continue;
			const x = s[0] + (s[2] - s[0]) * ts[k],
				y = s[1] + (s[3] - s[1]) * ts[k];
			const n = knoten(x, y);
			if (n !== prev) {
				const L = Math.hypot(xy[2 * n] - xy[2 * prev], xy[2 * n + 1] - xy[2 * prev + 1]);
				adj[prev].push(n, L);
				adj[n].push(prev, L);
				kanten.push([prev, n]);
			}
			prev = n;
		}
	});
	// Raster der Kanten für die Fangsuche
	/** @type {Map<string, number[]>} */
	const kr = new Map();
	kanten.forEach(([a, b], i) => {
		const x0 = Math.floor(Math.min(xy[2 * a], xy[2 * b]) / ZELLE),
			x1 = Math.floor(Math.max(xy[2 * a], xy[2 * b]) / ZELLE),
			y0 = Math.floor(Math.min(xy[2 * a + 1], xy[2 * b + 1]) / ZELLE),
			y1 = Math.floor(Math.max(xy[2 * a + 1], xy[2 * b + 1]) / ZELLE);
		for (let x = x0; x <= x1; x++)
			for (let y = y0; y <= y1; y++) {
				const k = x + ',' + y;
				const l = kr.get(k);
				if (l) l.push(i);
				else kr.set(k, [i]);
			}
	});
	N = { xy, adj, kanten, kr, n: D.feats.length };
	CACHE.set(D, N);
	return N;
}

/** Endpunkte von S, die nahe an T liegen → T dort teilen @param {number[]} S @param {number[]} T @param {number[]} tt */
function anschluss(S, T, tt) {
	for (const [px, py] of [
		[S[0], S[1]],
		[S[2], S[3]]
	]) {
		const p = proj(px, py, T);
		if (p.t > 1e-6 && p.t < 1 - 1e-6 && p.d < FANG) tt.push(p.t);
	}
}

/** Punkt auf Strecke projizieren @param {number} px @param {number} py @param {number[]} s */
function proj(px, py, s) {
	const dx = s[2] - s[0],
		dy = s[3] - s[1],
		L2 = dx * dx + dy * dy || 1e-12;
	const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / L2));
	const x = s[0] + dx * t,
		y = s[1] + dy * t;
	return { t, x, y, d: Math.hypot(px - x, py - y) };
}

/**
 * Nächster Punkt auf einem Weg (innerhalb von tol).
 * @param {any} N @param {number} x @param {number} y @param {number} tol
 * @returns {{x:number,y:number,a:number,b:number}|null}
 */
export function fang(N, x, y, tol) {
	if (!N) return null;
	const { xy, kanten, kr } = N;
	let best = null,
		bd = tol;
	const r = Math.ceil(tol / ZELLE);
	const cx = Math.floor(x / ZELLE),
		cy = Math.floor(y / ZELLE);
	const gepr = new Set();
	for (let i = -r; i <= r; i++)
		for (let j = -r; j <= r; j++) {
			const l = kr.get(cx + i + ',' + (cy + j));
			if (!l) continue;
			for (const e of l) {
				if (gepr.has(e)) continue;
				gepr.add(e);
				const [a, b] = kanten[e];
				const p = proj(x, y, [xy[2 * a], xy[2 * a + 1], xy[2 * b], xy[2 * b + 1]]);
				if (p.d < bd) {
					bd = p.d;
					best = { x: p.x, y: p.y, a, b };
				}
			}
		}
	return best;
}

/** Kleiner Binär-Heap für Dijkstra */
class Heap {
	constructor() {
		/** @type {number[]} */ this.k = [];
		/** @type {number[]} */ this.v = [];
	}
	get size() {
		return this.k.length;
	}
	/** @param {number} key @param {number} val */
	push(key, val) {
		const k = this.k,
			v = this.v;
		let i = k.length;
		k.push(key);
		v.push(val);
		while (i > 0) {
			const p = (i - 1) >> 1;
			if (k[p] <= key) break;
			k[i] = k[p];
			v[i] = v[p];
			i = p;
		}
		k[i] = key;
		v[i] = val;
	}
	pop() {
		const k = this.k,
			v = this.v;
		const top = v[0],
			lk = /** @type {number} */ (k.pop()),
			lv = /** @type {number} */ (v.pop());
		if (k.length) {
			let i = 0;
			for (;;) {
				let c = 2 * i + 1;
				if (c >= k.length) break;
				if (c + 1 < k.length && k[c + 1] < k[c]) c++;
				if (k[c] >= lk) break;
				k[i] = k[c];
				v[i] = v[c];
				i = c;
			}
			k[i] = lk;
			v[i] = lv;
		}
		return top;
	}
}

/**
 * Kürzester Weg zwischen zwei gefangenen Punkten.
 * @param {any} N @param {{x:number,y:number,a:number,b:number}} P @param {{x:number,y:number,a:number,b:number}} Q
 * @returns {number[][]|null} Punkte [x,y] von P bis Q (Kartenkoordinaten)
 */
export function weg(N, P, Q) {
	const { xy, adj } = N;
	const pt = (/** @type {number} */ n) => [xy[2 * n], xy[2 * n + 1]];
	// gleiche Kante → gerade
	if ((P.a === Q.a && P.b === Q.b) || (P.a === Q.b && P.b === Q.a))
		return [
			[P.x, P.y],
			[Q.x, Q.y]
		];
	const dist = new Map(),
		vor = new Map();
	const h = new Heap();
	for (const n of [P.a, P.b]) {
		const d = Math.hypot(xy[2 * n] - P.x, xy[2 * n + 1] - P.y);
		if (!(dist.get(n) <= d)) {
			dist.set(n, d);
			vor.set(n, -1);
			h.push(d, n);
		}
	}
	const ziel = new Map([
		[Q.a, Math.hypot(xy[2 * Q.a] - Q.x, xy[2 * Q.a + 1] - Q.y)],
		[Q.b, Math.hypot(xy[2 * Q.b] - Q.x, xy[2 * Q.b + 1] - Q.y)]
	]);
	let bestE = -1,
		bestD = Infinity;
	// Luftlinie als Grenze: nicht ewig suchen (Umweg höchstens ~8×)
	const grenze = Math.max(400, 8 * Math.hypot(Q.x - P.x, Q.y - P.y));
	const fertig = new Set();
	while (h.size) {
		const n = h.pop();
		if (fertig.has(n)) continue;
		fertig.add(n);
		const d = dist.get(n);
		if (d >= bestD || d > grenze) break;
		const z = ziel.get(n);
		if (z !== undefined && d + z < bestD) {
			bestD = d + z;
			bestE = n;
		}
		const A = adj[n];
		for (let i = 0; i < A.length; i += 2) {
			const m = A[i],
				nd = d + A[i + 1];
			if (nd < (dist.get(m) ?? Infinity)) {
				dist.set(m, nd);
				vor.set(m, n);
				h.push(nd, m);
			}
		}
	}
	if (bestE < 0) return null;
	const pfad = [];
	for (let n = bestE; n !== -1; n = vor.get(n)) pfad.push(pt(n));
	pfad.reverse();
	return [[P.x, P.y], ...pfad, [Q.x, Q.y]];
}
