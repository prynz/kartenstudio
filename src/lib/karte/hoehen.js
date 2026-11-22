// Höhenlinien aus einem Höhenmodell berechnen.
// Daten: „Terrain Tiles“ (Terrarium-PNG, in Europa aus dem EU-DEM von Copernicus), frei nutzbar mit Quellenangabe.
// Später auch selbst hostbar (gleiches Format).
// Ablauf: Höhenkacheln laden → Höhenraster in Poster-Koordinaten → glätten → Linien per „Marching Squares“.

const URL_T = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const TILES = new Map();

/** Eine Höhenkachel laden und in Meter umrechnen @param {number} z @param {number} x @param {number} y */
async function tile(z, x, y) {
	const k = `${z}/${x}/${y}`;
	if (TILES.has(k)) return TILES.get(k);
	const p = (async () => {
		const r = await fetch(URL_T.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)));
		if (!r.ok) throw new Error('Höhenkachel HTTP ' + r.status);
		const bmp = await createImageBitmap(await r.blob());
		const c = document.createElement('canvas');
		c.width = c.height = 256;
		const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d', { willReadFrequently: true }));
		ctx.drawImage(bmp, 0, 0);
		const d = ctx.getImageData(0, 0, 256, 256).data;
		const h = new Float32Array(256 * 256);
		for (let i = 0; i < h.length; i++) h[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
		return h;
	})();
	TILES.set(k, p);
	p.catch(() => TILES.delete(k));
	return p;
}

/**
 * Höhenlinien für die geladenen Kartendaten berechnen (Ergebnis wird an DATA gemerkt).
 * @param {any} DATA
 * @returns {Promise<{interval:number, min:number, max:number, minor:string, major:string}>}
 */
export async function contours(DATA) {
	if (DATA._contours) return DATA._contours;
	if (DATA._contoursP) return DATA._contoursP;
	DATA._contoursP = (async () => {
		const E = DATA.ext,
			P = DATA.proj;
		// Kartenbereich in Mercator (0–1)
		const mx0 = P.x0 + E.x0 / P.sc,
			mx1 = P.x0 + E.x1 / P.sc,
			my0 = P.y0 + E.y0 / P.sc,
			my1 = P.y0 + E.y1 / P.sc;
		let z = 13;
		const cnt = (/** @type {number} */ zz) => (Math.floor(mx1 * 2 ** zz) - Math.floor(mx0 * 2 ** zz) + 1) * (Math.floor(my1 * 2 ** zz) - Math.floor(my0 * 2 ** zz) + 1);
		while (z > 9 && cnt(z) > 20) z--;
		const n = 2 ** z;
		const tx0 = Math.floor(mx0 * n),
			tx1 = Math.floor(mx1 * n),
			ty0 = Math.floor(my0 * n),
			ty1 = Math.floor(my1 * n);
		/** @type {Map<string, Float32Array>} */
		const T = new Map();
		const jobs = [];
		for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) jobs.push(tile(z, x, y).then((h) => T.set(x + '/' + y, h)));
		await Promise.all(jobs);
		/** Höhe an Mercator-Punkt (bilinear) @param {number} mx @param {number} my */
		const at = (mx, my) => {
			const px = mx * n * 256 - 0.5,
				py = my * n * 256 - 0.5;
			const x0 = Math.floor(px),
				y0 = Math.floor(py),
				fx = px - x0,
				fy = py - y0;
			const g = (/** @type {number} */ X, /** @type {number} */ Y) => {
				const tx = Math.floor(X / 256),
					ty = Math.floor(Y / 256);
				const h = T.get(tx + '/' + ty);
				if (!h) return NaN;
				return h[(Y - ty * 256) * 256 + (X - tx * 256)];
			};
			return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
		};
		// Raster in Poster-Koordinaten
		const W = E.x1 - E.x0,
			H = E.y1 - E.y0;
		const step = Math.max(W, H) / 280;
		const nx = Math.ceil(W / step) + 1,
			ny = Math.ceil(H / step) + 1;
		let G = new Float32Array(nx * ny);
		for (let j = 0; j < ny; j++)
			for (let i = 0; i < nx; i++) {
				const X = E.x0 + i * step,
					Y = E.y0 + j * step;
				G[j * nx + i] = at(P.x0 + X / P.sc, P.y0 + Y / P.sc);
			}
		// Glätten (zweimal 3×3-Mittel) – nimmt Rauschen und Treppenstufen
		for (let pass = 0; pass < 2; pass++) {
			const O = new Float32Array(G.length);
			for (let j = 0; j < ny; j++)
				for (let i = 0; i < nx; i++) {
					let s = 0,
						c = 0;
					for (let dj = -1; dj <= 1; dj++)
						for (let di = -1; di <= 1; di++) {
							const ii = i + di,
								jj = j + dj;
							if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
							const v = G[jj * nx + ii];
							if (Number.isFinite(v)) {
								s += v;
								c++;
							}
						}
					O[j * nx + i] = c ? s / c : NaN;
				}
			G = O;
		}
		let min = Infinity,
			max = -Infinity;
		G.forEach((v) => {
			if (Number.isFinite(v)) {
				if (v < min) min = v;
				if (v > max) max = v;
			}
		});
		// Abstand so wählen, dass etwa 15–35 Linien entstehen
		const range = Math.max(1, max - min);
		const interval = [2, 5, 10, 20, 25, 50, 100, 200].find((i) => range / i <= 35) || 250;
		let minor = '',
			major = '';
		for (let lv = Math.ceil(min / interval) * interval; lv <= max; lv += interval) {
			const d = isoline(G, nx, ny, lv, E.x0, E.y0, step);
			if (Math.round(lv / interval) % 5 === 0) major += d;
			else minor += d;
		}
		const res = { interval, min: Math.round(min), max: Math.round(max), minor, major };
		DATA._contours = res;
		return res;
	})();
	return DATA._contoursP;
}

/**
 * Eine Höhenlinie (Marching Squares), Teilstücke zu Linienzügen verbunden.
 * @param {Float32Array} G @param {number} nx @param {number} ny @param {number} lv
 * @param {number} ox @param {number} oy @param {number} step
 */
function isoline(G, nx, ny, lv, ox, oy, step) {
	/** @type {number[][][]} */
	const segs = [];
	const f = (/** @type {number} */ a, /** @type {number} */ b) => (lv - a) / (b - a);
	for (let j = 0; j < ny - 1; j++)
		for (let i = 0; i < nx - 1; i++) {
			const a = G[j * nx + i],
				b = G[j * nx + i + 1],
				c = G[(j + 1) * nx + i + 1],
				d = G[(j + 1) * nx + i];
			if (!(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && Number.isFinite(d))) continue;
			const k = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
			if (k === 0 || k === 15) continue;
			const T = [i + f(a, b), j],
				R = [i + 1, j + f(b, c)],
				B = [i + f(d, c), j + 1],
				L = [i, j + f(a, d)];
			/** @type {Record<number, number[][][]>} */
			const map = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]], 8: [[L, T]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]] };
			map[k].forEach((s) => segs.push(s));
		}
	// Teilstücke zu Linien verbinden (spart viel Platz im SVG)
	const key = (/** @type {number[]} */ p) => p[0].toFixed(3) + ',' + p[1].toFixed(3);
	/** @type {Map<string, number[]>} */
	const byStart = new Map();
	segs.forEach((s, idx) => {
		[0, 1].forEach((e) => {
			const k = key(s[e]);
			if (!byStart.has(k)) byStart.set(k, []);
			/** @type {number[]} */ (byStart.get(k)).push(idx * 2 + e);
		});
	});
	const used = new Uint8Array(segs.length);
	let out = '';
	const P = (/** @type {number[]} */ p) => (ox + p[0] * step).toFixed(1) + ' ' + (oy + p[1] * step).toFixed(1);
	for (let s0 = 0; s0 < segs.length; s0++) {
		if (used[s0]) continue;
		used[s0] = 1;
		const line = [segs[s0][0], segs[s0][1]];
		// in beide Richtungen verlängern
		for (const dir of [1, 0]) {
			let end = dir ? line[line.length - 1] : line[0];
			for (;;) {
				const cand = (byStart.get(key(end)) || []).find((v) => !used[v >> 1]);
				if (cand === undefined) break;
				const si = cand >> 1;
				used[si] = 1;
				const nxt = segs[si][(cand & 1) ^ 1];
				if (dir) line.push(nxt);
				else line.unshift(nxt);
				end = nxt;
			}
		}
		out += 'M' + line.map(P).join('L');
	}
	return out;
}
