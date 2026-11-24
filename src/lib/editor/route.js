// Route einzeichnen: GPS-Datei (GPX oder GeoJSON) laden, vereinfachen, als Linie aufs Poster.
// Der Kartenausschnitt wird passend um die Route geladen (auch große Strecken bis 40 km).
import { app as appUntyped } from './app.js';
import { change, clampView } from './zustand.js';
import { geo, perspektiveAn } from './zeichnen.js';
import { std3d } from '../karte/raster.js';
import { MW } from './basis.js';
import { netz, fang, weg } from './wege.js';
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
	const titel = (/** @type {string} */ sel) => {
		const el = doc.querySelector(sel);
		return el ? (el.textContent || '').trim() : '';
	};
	// KML (Google Earth, viele Apps): <coordinates>lon,lat[,höhe] …</coordinates>
	const koord = [...doc.getElementsByTagName('coordinates')];
	if (koord.length) {
		const pts = koord
			.flatMap((c) => (c.textContent || '').trim().split(/\s+/))
			.map((p) => p.split(',').map(Number))
			.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))
			.map((p) => [p[0], p[1]]);
		return { pts, name: titel('Document > name, Placemark > name') };
	}
	// TCX (Garmin): <Trackpoint><Position><LatitudeDegrees>…
	const tp = [...doc.getElementsByTagName('Position')];
	if (tp.length) {
		const zahl = (/** @type {Element} */ n, /** @type {string} */ tag) => parseFloat(n.getElementsByTagName(tag)[0]?.textContent || '');
		const pts = tp.map((n) => [zahl(n, 'LongitudeDegrees'), zahl(n, 'LatitudeDegrees')]).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
		return { pts, name: titel('Activity > Notes, Course > Name') };
	}
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

/** Strichmuster der Linie @param {any} R @param {number} w */
export function routeStrich(R, w) {
	if (R.stil === 'strich') return ` stroke-dasharray="${(w * 2.6).toFixed(2)} ${(w * 1.9).toFixed(2)}"`;
	if (R.stil === 'punkt') return ` stroke-dasharray="0.01 ${(w * 2).toFixed(2)}"`;
	return '';
}
/** Route als SVG (Poster-Kartenkoordinaten), Linienstärke unabhängig vom Zoom */
export function routeSVG() {
	const R = app.S.route,
		D = app.DATA;
	if (!R || !R.pts || !R.pts.length || !D || !D.proj) return '';
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
	if (xy.length === 1) {
		const [s] = xy;
		return `<circle id="route" cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" r="${(w * 1.7).toFixed(2)}" fill="${c}" stroke="#fff" stroke-width="${(w * 0.6).toFixed(2)}"/>`;
	}
	let o = `<path id="route" d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="${(w * 1.9).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
	o += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w.toFixed(2)}"${routeStrich(R, w)} stroke-linecap="round" stroke-linejoin="round"/>`;
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
		if (raw.length < 2) throw new Error('Keine Strecke gefunden – passend sind .gpx, .kml, .tcx oder .geojson');
		const km = lengthKm(raw);
		const pts = simplify(raw).map((p) => [+p[0].toFixed(5), +p[1].toFixed(5)]);
		const a = app.S ? app.S.view.a : 0.8805;
		const b = routeBounds(pts, a);
		const nm = (name || file.name.replace(/\.[^.]+$/, '') || 'Meine Route').slice(0, 40);
		const kmTxt = `${km.toFixed(1).replace('.', ',')} km`;
		/** @type {any} */ (window)._place = { name: nm, region: kmTxt, lon: (b.w + b.e) / 2, lat: (b.n + b.s) / 2 };
		if (!(await loadBounds(b, { maxW: 40000 }))) return;
		change(() => {
			const alt = app.S.route || {};
			app.S.route = { pts, name: nm, km: +km.toFixed(2), c: alt.c || '#d64545', w: alt.w || 7, ends: alt.ends !== false, stil: alt.stil || 'voll' };
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
	$('routeRm').onclick = () => {
		zeichnen(false);
		change(() => (app.S.route = null));
	};
	$('routeDraw').onclick = () => zeichnen(true, true);
	$('routeEdit').onclick = () => zeichnen(!app.routeZeichnen);
	$('routeFit').onclick = routeEinpassen;
	$('rtEdFertig').onclick = () => zeichnen(false);
	$('rtEdModus').onclick = () => {
		app.routeFrei = !app.routeFrei;
		syncRoute();
	};
	// Vorschau am PC: Punkt rastet sichtbar auf dem Weg ein
	let rafId = 0;
	const cv = $('canvas');
	cv.addEventListener('pointermove', (e) => {
		if (!app.routeZeichnen || e.pointerType !== 'mouse' || e.buttons) return fangZeigen(null);
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(() => fangZeigen(zielPunkt(e.clientX, e.clientY)));
	});
	cv.addEventListener('pointerleave', () => fangZeigen(null));
	$('rtEdZurueck').onclick = () => {
		const R = app.S.route;
		if (!R || !R.pts.length) return;
		change(() => {
			// ganzes zuletzt gezeichnetes Teilstück zurücknehmen
			const teile = [...(R.teile || [])];
			const n = Math.max(1, Math.min(R.pts.length, teile.pop() || 1));
			R.pts = R.pts.slice(0, -n);
			R.teile = teile;
			R.km = +lengthKm(R.pts).toFixed(2);
		});
	};
	$('routeEnds').addEventListener('change', (e) => change(() => (app.S.route = { ...app.S.route, ends: /** @type {HTMLInputElement} */ (e.target).checked })));
	document.querySelectorAll('#routeStil button').forEach((b) =>
		b.addEventListener('click', () => change(() => (app.S.route = { ...app.S.route, stil: /** @type {HTMLElement} */ (b).dataset.s })))
	);
	// Punkte setzen: kurzes Antippen der Karte (Ziehen verschiebt weiter die Karte)
	/** @type {{x:number,y:number}|null} */
	let unten = null;
	cv.addEventListener('pointerdown', (e) => (unten = app.routeZeichnen && e.isPrimary ? { x: e.clientX, y: e.clientY } : null), true);
	cv.addEventListener(
		'pointerup',
		(e) => {
			if (!unten || !app.routeZeichnen) return;
			const weit = Math.hypot(e.clientX - unten.x, e.clientY - unten.y);
			unten = null;
			const t = /** @type {Element} */ (e.target);
			if (weit > 6 || t.closest('#titel, #untertitel, [data-pin]')) return;
			punktSetzen(e.clientX, e.clientY);
		},
		true
	);
	// GPS-Datei einfach aufs Poster ziehen (Computer)
	const stage = /** @type {HTMLElement} */ (cv.closest('.stage') || cv);
	stage.addEventListener('dragover', (e) => {
		if (e.dataTransfer && [...e.dataTransfer.types].includes('Files') && app.DATA) {
			e.preventDefault();
			stage.classList.add('rt-drop');
		}
	});
	stage.addEventListener('dragleave', () => stage.classList.remove('rt-drop'));
	stage.addEventListener('drop', (e) => {
		stage.classList.remove('rt-drop');
		const f = e.dataTransfer && e.dataTransfer.files[0];
		if (!f || !app.DATA) return;
		e.preventDefault();
		loadFile(f);
	});
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
	$('routeBox').classList.toggle('hidden', !R || !R.pts.length);
	$('routeBtn').textContent = R ? 'Andere Datei laden' : 'GPS-Datei laden';
	$('rtFeat').classList.toggle('an', !!R);
	if (app.routeZeichnen && !R) zeichnen(false);
	const km = R ? String(R.km || 0).replace('.', ',') : '0';
	const stuecke = R ? (R.teile || []).length : 0;
	$('rtEdInfo').textContent = !R || !R.pts.length ? (app.routeFrei ? 'Tippe Punkt für Punkt auf die Karte' : 'Tippe auf einen Weg: dort startet die Route') : stuecke <= 1 && R.pts.length === 1 ? 'Start gesetzt – tippe das nächste Ziel' : `${km} km · ${stuecke} ${stuecke === 1 ? 'Abschnitt' : 'Abschnitte'}`;
	$('routeEdit').classList.toggle('on', !!app.routeZeichnen);
	$('rtEdModus').classList.toggle('an', !app.routeFrei);
	$('rtEdModus').setAttribute('aria-pressed', String(!app.routeFrei));
	$('rtEdModusT').textContent = app.routeFrei ? 'Gerade Linie' : 'Wege folgen';
	if (!R) return;
	$('routeInfo').innerHTML = `<b>${esc(R.name)}</b> · ${km} km`;
	/** @type {HTMLInputElement} */ ($('routeEnds')).checked = R.ends !== false;
	document.querySelectorAll('#routeStil button').forEach((b) => b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.s === (R.stil || 'voll')));
	/** @type {HTMLInputElement} */ ($('routeW')).value = String(R.w || 7);
	document.querySelectorAll('.rt-c').forEach((b) => b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.c === R.c));
}

/** Bildschirmpunkt → Kartenkoordinaten (null außerhalb der Karte); px = Kartenmaß je Bildschirmpixel */
function bildschirmZuKarte(/** @type {number} */ cx, /** @type {number} */ cy) {
	const svg = /** @type {SVGSVGElement|null} */ (document.getElementById('poster'));
	const m = svg && svg.getScreenCTM();
	if (!m || !app.DATA) return null;
	const p = new DOMPoint(cx, cy).matrixTransform(m.inverse());
	const g = geo(),
		v = app.S.view;
	if (p.x < g.mx || p.x > g.mx + MW || p.y < g.my || p.y > g.my + g.MH) return null;
	return { x: (p.x - g.mx - MW / 2) / v.z + v.cx, y: (p.y - g.my - g.MH / 2) / v.z + v.cy, px: 1 / (m.a * v.z) };
}
/** Kartenkoordinaten → Bildschirm */
function karteZuBildschirm(/** @type {number} */ x, /** @type {number} */ y) {
	const svg = /** @type {SVGSVGElement|null} */ (document.getElementById('poster'));
	const m = svg && svg.getScreenCTM();
	if (!m) return null;
	const g = geo(),
		v = app.S.view;
	return new DOMPoint((x - v.cx) * v.z + MW / 2 + g.mx, (y - v.cy) * v.z + g.MH / 2 + g.my).matrixTransform(m);
}
const zuGeo = (/** @type {number} */ x, /** @type {number} */ y) => {
	const P = app.DATA.proj;
	const [lon, lat] = mercInv(x / P.sc + P.x0, y / P.sc + P.y0);
	return [+lon.toFixed(5), +lat.toFixed(5)];
};
const zuKarte = (/** @type {number[]} */ ll) => {
	const P = app.DATA.proj,
		[X, Y] = merc(ll[0], ll[1]);
	return [(X - P.x0) * P.sc, (Y - P.y0) * P.sc];
};

/** Wohin ein Tipp an dieser Stelle führt: eingerastet auf einem Weg (fang) oder frei */
function zielPunkt(/** @type {number} */ cx, /** @type {number} */ cy) {
	const k = bildschirmZuKarte(cx, cy);
	if (!k) return null;
	const N = app.routeFrei ? null : netz(app.DATA);
	// Fangradius ≈ 26 Bildschirmpixel – egal wie weit hineingezoomt ist
	const f = N ? fang(N, k.x, k.y, 26 * k.px) : null;
	return { x: f ? f.x : k.x, y: f ? f.y : k.y, f };
}

/** Punkt am Bildschirm setzen: entlang der Wege bis dorthin, sonst gerade */
function punktSetzen(/** @type {number} */ cx, /** @type {number} */ cy) {
	const Z = zielPunkt(cx, cy);
	if (!Z) return;
	const R = app.S.route;
	/** @type {number[][]} */
	let neu = [[Z.x, Z.y]];
	if (R.pts.length && Z.f) {
		const N = netz(app.DATA);
		const [lx, ly] = zuKarte(R.pts[R.pts.length - 1]);
		const P = fang(N, lx, ly, 1.5);
		const w = P ? weg(N, P, Z.f) : null;
		if (w) neu = w.slice(1);
		else msg('Kein Weg dorthin gefunden – gerade Linie gezeichnet.', 'busy');
	}
	// doppelte Punkte (gleiche Stelle) weglassen
	const ll = neu.map((p) => zuGeo(p[0], p[1])).filter((p, i, a) => !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
	if (!ll.length || R.pts.length + ll.length > 6000) return;
	change(() => {
		const R = app.S.route;
		R.pts = [...R.pts, ...ll];
		R.teile = [...(R.teile || []), ll.length];
		R.km = +lengthKm(R.pts).toFixed(2);
	});
}

/** Fang-Punkt unter der Maus zeigen @param {{x:number,y:number,f:any}|null} Z */
function fangZeigen(Z) {
	const el = $('rtFang');
	const s = Z && karteZuBildschirm(Z.x, Z.y);
	if (!s) {
		el.hidden = true;
		return;
	}
	const r = /** @type {HTMLElement} */ (el.offsetParent || document.body).getBoundingClientRect();
	el.hidden = false;
	el.classList.toggle('frei', !Z.f);
	el.style.transform = `translate(${(s.x - r.left).toFixed(1)}px,${(s.y - r.top).toFixed(1)}px)`;
}

/**
 * Zeichen-Modus an/aus. Neue Route: leere Strecke anlegen. Beim Beenden: < 2 Punkte → weg.
 * @param {boolean} an @param {boolean} [neu]
 */
export function zeichnen(an, neu) {
	if (an && (perspektiveAn() || std3d())) {
		msg('Zum Zeichnen bitte zuerst Perspektive/3D ausschalten (Bereich „Extras“).', 'err');
		return;
	}
	if (an && app.S.motif && app.S.motif !== 'karte') {
		msg('Routen gibt es nur auf Karten – bitte im Bereich „Stil“ eine Karte wählen.', 'err');
		return;
	}
	app.routeZeichnen = an;
	document.body.classList.toggle('rt-zeichnen', an);
	$('rtEditor').hidden = !an;
	if (an) {
		if (neu || !app.S.route)
			change(() => {
				const alt = app.S.route || {};
				app.S.route = { pts: [], teile: [], name: 'Meine Route', km: 0, c: alt.c || '#d64545', w: alt.w || 7, ends: alt.ends !== false, stil: alt.stil || 'voll' };
				if (app.S.multi) app.S.multi.on = false;
			});
		// Wegenetz im Hintergrund vorbereiten (beim ersten Tipp ist es dann fertig)
		setTimeout(() => netz(app.DATA), 30);
		// Handy: Einstellungen zuklappen, damit die Karte frei ist
		if (matchMedia('(max-width: 900px)').matches) document.body.classList.add('sheet-zu');
	} else {
		fangZeigen(null);
		if (app.S.route && app.S.route.pts.length < 2) change(() => (app.S.route = null));
	}
	syncRoute();
}

/** Karte so verschieben/zoomen, dass die ganze Route zu sehen ist (oder Gegend neu laden) */
async function routeEinpassen() {
	const R = app.S.route,
		D = app.DATA;
	if (!R || R.pts.length < 2 || !D) return;
	const P = D.proj;
	let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
	R.pts.forEach((/** @type {number[]} */ p) => {
		const [X, Y] = merc(p[0], p[1]);
		const x = (X - P.x0) * P.sc, y = (Y - P.y0) * P.sc;
		x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
	});
	const e = D.ext;
	if (x0 < e.x0 || y0 < e.y0 || x1 > e.x1 || y1 > e.y1) {
		// Strecke reicht über die geladene Gegend hinaus → passend neu laden
		const keep = { ...R };
		if (await loadBounds(routeBounds(R.pts, app.S.view.a), { maxW: 40000 })) change(() => (app.S.route = keep));
		return;
	}
	change(() => {
		const v = app.S.view;
		v.cx = (x0 + x1) / 2;
		v.cy = (y0 + y1) / 2;
		v.z = Math.min(MW / ((x1 - x0) * 1.2 || 1), (MW * v.a) / ((y1 - y0) * 1.2 || 1));
		clampView(v);
	});
}
