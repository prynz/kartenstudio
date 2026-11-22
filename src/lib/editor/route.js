// Route einzeichnen: GPS-Datei (GPX oder GeoJSON) laden, vereinfachen, als Linie aufs Poster.
// Der Kartenausschnitt wird passend um die Route geladen (auch große Strecken bis 40 km).
import { app as appUntyped } from './app.js';
import { change } from './zustand.js';
import { loadBounds } from './laden.js';
import { msg } from './ansicht.js';
import { merc } from '../karte/overpass.js';
import { mercInv } from '../karte/raster.js';
import { esc } from './basis.js';

/** @type {any} */
const app = appUntyped;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/**
 * Punkte aus einer GPS-Datei lesen.
 * @param {string} text
 * @returns {{pts:number[][], name:string}}
 */
export function parseTrack(text) {
	const t = text.trim();
	if (t.startsWith('{')) {
		// GeoJSON: erste Linie (LineString/MultiLineString) nehmen
		const j = JSON.parse(t);
		const feats = j.type === 'FeatureCollection' ? j.features : [j.type === 'Feature' ? j : { geometry: j, properties: {} }];
		for (const f of feats) {
			const g = f.geometry || {};
			if (g.type === 'LineString') return { pts: g.coordinates.map((/** @type {number[]} */ c) => [c[0], c[1]]), name: (f.properties && f.properties.name) || '' };
			if (g.type === 'MultiLineString') return { pts: g.coordinates.flat().map((/** @type {number[]} */ c) => [c[0], c[1]]), name: (f.properties && f.properties.name) || '' };
		}
		return { pts: [], name: '' };
	}
	const doc = new DOMParser().parseFromString(t, 'application/xml');
	let nodes = [...doc.getElementsByTagName('trkpt')];
	if (!nodes.length) nodes = [...doc.getElementsByTagName('rtept')];
	const pts = nodes.map((n) => [parseFloat(n.getAttribute('lon') || ''), parseFloat(n.getAttribute('lat') || '')]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
	const nameEl = doc.querySelector('trk > name, rte > name, metadata > name');
	return { pts, name: nameEl ? (nameEl.textContent || '').trim() : '' };
}

/** Länge in km (Haversine) @param {number[][]} pts */
export function lengthKm(pts) {
	let s = 0;
	for (let i = 1; i < pts.length; i++) {
		const [a, b] = [pts[i - 1], pts[i]];
		const dLat = ((b[1] - a[1]) * Math.PI) / 180,
			dLon = ((b[0] - a[0]) * Math.PI) / 180;
		const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
		s += 2 * 6371 * Math.asin(Math.sqrt(h));
	}
	return s;
}

/**
 * Linie vereinfachen (Douglas-Peucker), damit Poster und gespeicherter Entwurf klein bleiben.
 * @param {number[][]} pts @param {number} maxN
 */
export function simplify(pts, maxN = 1200) {
	if (pts.length <= maxN) return pts;
	const M = pts.map((p) => merc(p[0], p[1]));
	/** @param {number} tol */
	const run = (tol) => {
		const keep = new Uint8Array(pts.length);
		keep[0] = keep[pts.length - 1] = 1;
		const stack = [[0, pts.length - 1]];
		while (stack.length) {
			const [a, b] = /** @type {number[]} */ (stack.pop());
			let best = -1,
				bi = -1;
			const [ax, ay] = M[a],
				[bx, by] = M[b];
			const dx = bx - ax,
				dy = by - ay,
				L = Math.hypot(dx, dy) || 1e-12;
			for (let i = a + 1; i < b; i++) {
				const d = Math.abs((M[i][0] - ax) * dy - (M[i][1] - ay) * dx) / L;
				if (d > best) {
					best = d;
					bi = i;
				}
			}
			if (best > tol && bi > 0) {
				keep[bi] = 1;
				stack.push([a, bi], [bi, b]);
			}
		}
		return pts.filter((_, i) => keep[i]);
	};
	let tol = 1e-7,
		out = run(tol);
	while (out.length > maxN) out = run((tol *= 2));
	return out;
}

/**
 * Kartenausschnitt um die Route im Seitenverhältnis a (Höhe/Breite), mit Rand.
 * @param {number[][]} pts @param {number} a
 */
export function routeBounds(pts, a) {
	const M = pts.map((p) => merc(p[0], p[1]));
	let x0 = Infinity,
		y0 = Infinity,
		x1 = -Infinity,
		y1 = -Infinity;
	M.forEach(([x, y]) => {
		x0 = Math.min(x0, x);
		x1 = Math.max(x1, x);
		y0 = Math.min(y0, y);
		y1 = Math.max(y1, y);
	});
	let w = (x1 - x0) * 1.16,
		h = (y1 - y0) * 1.16;
	const cx = (x0 + x1) / 2,
		cy = (y0 + y1) / 2;
	if (h / w > a) w = h / a;
	else h = w * a;
	// Mindestgröße ≈ 1 km
	const lat = mercInv(cx, cy)[1];
	const minW = 1000 / (40075016.7 * Math.cos((lat * Math.PI) / 180));
	if (w < minW) {
		w = minW;
		h = w * a;
	}
	const [wl, n] = mercInv(cx - w / 2, cy - h / 2),
		[e, s] = mercInv(cx + w / 2, cy + h / 2);
	return { w: wl, n, e, s };
}

/** Route als SVG (Poster-Kartenkoordinaten), Linienstärke unabhängig vom Zoom */
export function routeSVG() {
	const R = app.S.route,
		D = app.DATA;
	if (!R || !R.pts || R.pts.length < 2 || !D || !D.proj) return '';
	const P = D.proj,
		z = app.S.view.z;
	const xy = R.pts.map((/** @type {number[]} */ p) => {
		const [x, y] = merc(p[0], p[1]);
		return [(x - P.x0) * P.sc, (y - P.y0) * P.sc];
	});
	const w = (R.w || 7) / z;
	const c = R.c || '#d64545';
	let d = '';
	xy.forEach((/** @type {number[]} */ p, /** @type {number} */ i) => (d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)));
	let o = `<path id="route" d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${(w * 1.9).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
	o += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
	if (R.ends !== false) {
		const [s, e] = [xy[0], xy[xy.length - 1]];
		o += `<circle cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" r="${(w * 1.7).toFixed(2)}" fill="${c}" stroke="#fff" stroke-width="${(w * 0.6).toFixed(2)}"/>`;
		o += `<circle cx="${e[0].toFixed(1)}" cy="${e[1].toFixed(1)}" r="${(w * 1.7).toFixed(2)}" fill="#fff" stroke="${c}" stroke-width="${(w * 0.9).toFixed(2)}"/>`;
	}
	return o;
}

/** Datei laden → Ausschnitt laden → Route setzen @param {File} file */
async function loadFile(file) {
	try {
		if (file.size > 15e6) throw new Error('Datei zu groß');
		const { pts: raw, name } = parseTrack(await file.text());
		if (raw.length < 2) throw new Error('Keine Strecke in der Datei gefunden');
		const km = lengthKm(raw);
		const pts = simplify(raw).map((p) => [+p[0].toFixed(5), +p[1].toFixed(5)]);
		const a = app.S ? app.S.view.a : 0.8805;
		const b = routeBounds(pts, a);
		const nm = (name || file.name.replace(/\.[^.]+$/, '') || 'Meine Route').slice(0, 40);
		const kmTxt = `${km.toFixed(1).replace('.', ',')} km`;
		/** @type {any} */ (window)._place = { name: nm, region: kmTxt, lon: (b.w + b.e) / 2, lat: (b.n + b.s) / 2 };
		if (!(await loadBounds(b, { maxW: 40000 }))) return;
		change(() => {
			app.S.route = { pts, name: nm, km: +km.toFixed(2), c: (app.S.route && app.S.route.c) || '#d64545', w: (app.S.route && app.S.route.w) || 7, ends: true };
			app.S.motif = 'karte';
			if (app.S.multi) app.S.multi.on = false;
			app.S.title.text = nm.toUpperCase();
			app.S.sub.text = kmTxt;
		});
		msg(`Route geladen: ${kmTxt}`, 'ok');
	} catch (e) {
		msg('Die Datei konnte nicht gelesen werden: ' + (/** @type {Error} */ (e).message || e), 'err');
	}
}

export function initRoute() {
	const inp = /** @type {HTMLInputElement} */ ($('routeFile'));
	$('routeBtn').onclick = () => inp.click();
	inp.addEventListener('change', () => {
		const f = inp.files && inp.files[0];
		if (f) loadFile(f);
		inp.value = '';
	});
	$('routeRm').onclick = () => change(() => (app.S.route = null));
	$('routeW').addEventListener('change', (e) => change(() => (app.S.route = { ...app.S.route, w: +(/** @type {HTMLInputElement} */ (e.target).value) })));
	[
		['#d64545', 'Rot'],
		['#262c3a', 'Navy'],
		['#2f6fe4', 'Blau'],
		['#c9a227', 'Gold'],
		['#1f6f43', 'Grün'],
		['#e8762c', 'Orange']
	].forEach(([c, name]) => {
		const s = document.createElement('button');
		s.type = 'button';
		s.className = 'mk-swatch rt-c';
		s.dataset.c = c;
		s.title = name;
		s.innerHTML = `<i style="background:${c}"></i><span>${name}</span>`;
		s.onclick = () => change(() => (app.S.route = { ...app.S.route, c }));
		$('routeCol').appendChild(s);
	});
}

export function syncRoute() {
	const R = app.S && app.S.route;
	$('routeBox').classList.toggle('hidden', !R);
	$('routeBtn').textContent = R ? 'Andere GPS-Datei laden' : 'GPS-Datei laden (.gpx)';
	if (!R) return;
	$('routeInfo').innerHTML = `<b>${esc(R.name)}</b> · ${String(R.km).replace('.', ',')} km`;
	/** @type {HTMLInputElement} */ ($('routeW')).value = String(R.w || 7);
	document.querySelectorAll('.rt-c').forEach((b) => b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.c === R.c));
}
