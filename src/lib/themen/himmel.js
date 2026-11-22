// Sternenhimmel: berechnet, wie der Himmel über einem Ort zu einem Zeitpunkt aussah.
// Alles wird im Browser gerechnet (keine fremden Dienste). Sterndaten: himmel-daten.js.
//
// Rechenweg (vereinfacht, für ein Poster mehr als genau genug):
// 1. Datum + Uhrzeit (Ortszeit) → Weltzeit → Sternzeit am Ort
// 2. Für jeden Stern: Höhe über dem Horizont und Himmelsrichtung
// 3. Stereografische Projektion: Zenit in der Mitte, Horizont = Kreisrand,
//    Norden oben, Osten links (so sieht man den Himmel, wenn man nach oben schaut).

/** @typedef {{stars:number[], lines:Record<string,number[][][]>, names:Record<string,string>, mw:{l:number,p:number[][]}[]}} SkyData */

/** @type {SkyData|null} */
let DATA = null;
/** @type {Promise<SkyData>|null} */
let loading = null;
/** Sterndaten nachladen (nur einmal) */
export function loadSky() {
	if (DATA) return Promise.resolve(DATA);
	if (!loading) loading = import('./himmel-daten.js').then((m) => (DATA = /** @type {SkyData} */ (m.default)));
	return loading;
}
export const skyReady = () => !!DATA;

/** Farbschemata für den Himmel */
export const SKY_THEMES = {
	nacht: { name: 'Nacht', bg: '#141b2d', star: '#ffffff', line: '#ffffff', mw: '#ffffff' },
	navy: { name: 'Navy', bg: '#262c3a', star: '#ffffff', line: '#ffffff', mw: '#ffffff' },
	tiefblau: { name: 'Tiefblau', bg: '#0d2550', star: '#ffffff', line: '#bcd2ff', mw: '#bcd2ff' },
	schwarz: { name: 'Schwarz', bg: '#0a0a0c', star: '#ffffff', line: '#ffffff', mw: '#ffffff' },
	gold: { name: 'Gold', bg: '#141b2d', star: '#ecd08a', line: '#ecd08a', mw: '#ecd08a' },
	hell: { name: 'Hell', bg: '#ffffff', star: '#1c2233', line: '#1c2233', mw: '#1c2233' }
};

/** Standardwerte für den Himmel @param {number} lat @param {number} lon */
export function defaultSky(lat, lon) {
	const d = new Date();
	return {
		date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
		min: 22 * 60, // 22:00 Uhr
		theme: 'nacht',
		lines: true,
		names: false,
		grid: false,
		mw: true,
		lat: +lat.toFixed(4),
		lon: +lon.toFixed(4)
	};
}

/**
 * Zeitverschiebung des Orts in Minuten. In Mitteleuropa exakt über die Zeitzone
 * Europe/Berlin (inkl. Sommerzeit), sonst grob nach Längengrad.
 * @param {number} lat @param {number} lon @param {Date} d
 */
export function tzOffset(lat, lon, d) {
	if (lon > -10 && lon < 25 && lat > 35 && lat < 72) {
		try {
			const a = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
			const b = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
			return Math.round((a.getTime() - b.getTime()) / 60000);
		} catch (e) {}
	}
	return Math.round(lon / 15) * 60;
}

/** Zeitpunkt (UTC-Millisekunden) aus Ortsdatum und -uhrzeit @param {any} sky */
export function skyTime(sky) {
	const m = String(sky.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
	const [y, mo, da] = m ? [+m[1], +m[2], +m[3]] : [2024, 6, 21];
	const local = Date.UTC(y, mo - 1, da, 0, 0) + (sky.min || 0) * 60000;
	const off = tzOffset(sky.lat, sky.lon, new Date(local));
	return local - off * 60000;
}

const RAD = Math.PI / 180;

/**
 * Projektor für Ort + Zeit: liefert für (Rektaszension°, Deklination°) die Lage im Kreis
 * (Einheitskreis, Horizont = 1) oder null, wenn weit unter dem Horizont.
 * @param {any} sky
 */
export function projector(sky) {
	const t = skyTime(sky);
	const jd = t / 86400000 + 2440587.5;
	const gmst = (280.46061837 + 360.98564736629 * (jd - 2451545)) % 360;
	const lst = gmst + sky.lon;
	const phi = sky.lat * RAD,
		sp = Math.sin(phi),
		cp = Math.cos(phi);
	/** @param {number} ra @param {number} dec @param {number} [limit] */
	return (ra, dec, limit = -0.35) => {
		const H = (lst - ra) * RAD,
			d = dec * RAD;
		const sd = Math.sin(d),
			cd = Math.cos(d),
			cH = Math.cos(H);
		const z = sp * sd + cp * cd * cH; // sin(Höhe)
		if (z < limit) return null;
		const x = -cd * Math.sin(H); // Osten
		const y = sd * cp - cd * cH * sp; // Norden
		const h = Math.hypot(x, y) || 1e-9;
		const r = Math.sqrt((1 - z) / (1 + z)); // tan(Zenitdistanz/2)
		// Blick nach oben: Norden oben, Osten links
		return [(-r * x) / h, (-r * y) / h, z];
	};
}

/** Kreis als Pfadstück @param {number} x @param {number} y @param {number} r */
const dot = (x, y, r) => `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;

/** Sternfarbe aus dem Farbindex (für „echte Farben“) @param {number} bv */
function bvColor(bv) {
	if (bv < 0) return '#cfdcff';
	if (bv < 0.4) return '#eef2ff';
	if (bv < 0.8) return '#fff6e6';
	if (bv < 1.3) return '#ffe2b8';
	return '#ffcf9a';
}

/**
 * Himmel als SVG, Mittelpunkt (cx, cy), Radius R (in Zeichen-Einheiten).
 * @param {any} sky @param {number} cx @param {number} cy @param {number} R @param {string} uid
 */
export function skySVG(sky, cx, cy, R, uid = 'h') {
	const T = SKY_THEMES[/** @type {keyof typeof SKY_THEMES} */ (sky.theme)] || SKY_THEMES.nacht;
	let o = `<defs><clipPath id="${uid}C"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${R.toFixed(1)}"/></clipPath></defs>`;
	// Hintergrund füllt die ganze Kartenfläche (Rechteck-Designs), der Himmel selbst ist rund
	o += `<rect x="${(cx - R * 4).toFixed(1)}" y="${(cy - R * 4).toFixed(1)}" width="${(R * 8).toFixed(1)}" height="${(R * 8).toFixed(1)}" fill="${T.bg}"/>`;
	if (!DATA) return o;
	const P = projector(sky);
	const X = (/** @type {number} */ u) => cx + u * R,
		Y = (/** @type {number} */ v) => cy + v * R;
	o += `<g clip-path="url(#${uid}C)">`;
	// Milchstraße: mehrere halbtransparente Schichten
	if (sky.mw !== false)
		DATA.mw.forEach((L) => {
			let d = '';
			L.p.forEach((ring) => {
				let seg = '';
				let ok = 0;
				for (let i = 0; i < ring.length; i += 2) {
					const p = P((ring[i] + 360) % 360, ring[i + 1], -0.95);
					if (!p) {
						ok = -1;
						break;
					}
					// Punkte weit unter dem Horizont stauchen, damit nichts quer durchs Bild läuft
					const k = Math.min(1, 2.2 / Math.hypot(p[0], p[1]));
					seg += (i ? 'L' : 'M') + X(p[0] * k).toFixed(1) + ' ' + Y(p[1] * k).toFixed(1);
					ok++;
				}
				if (ok > 2) d += seg + 'Z';
			});
			if (d) o += `<path d="${d}" fill="${T.mw}" fill-opacity="${(0.025 + L.l * 0.012).toFixed(3)}" fill-rule="evenodd"/>`;
		});
	// Gitternetz: Höhenkreise und Himmelsrichtungen
	if (sky.grid) {
		let g = '';
		[30, 60].forEach((alt) => {
			const r = Math.tan(((90 - alt) * RAD) / 2) * R;
			g += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/>`;
		});
		for (let a = 0; a < 360; a += 45) g += `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(cx + Math.sin(a * RAD) * R).toFixed(1)}" y2="${(cy - Math.cos(a * RAD) * R).toFixed(1)}"/>`;
		o += `<g fill="none" stroke="${T.line}" stroke-opacity=".18" stroke-width="${(R / 520).toFixed(2)}" stroke-dasharray="${(R / 160).toFixed(1)} ${(R / 110).toFixed(1)}">${g}</g>`;
	}
	// Sternbild-Linien
	if (sky.lines !== false) {
		let d = '';
		Object.values(DATA.lines).forEach((segs) =>
			segs.forEach((seg) => {
				let prev = null;
				for (const [ra, dec] of seg) {
					const p = P((ra + 360) % 360, dec, -0.2);
					if (p && prev) d += `M${X(prev[0]).toFixed(1)} ${Y(prev[1]).toFixed(1)}L${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`;
					prev = p;
				}
			})
		);
		o += `<path d="${d}" fill="none" stroke="${T.line}" stroke-opacity=".5" stroke-width="${(R / 420).toFixed(2)}" stroke-linecap="round"/>`;
	}
	// Sterne: Größe nach Helligkeit, je Farbe ein einziger Pfad (schnell)
	/** @type {Record<string,string>} */
	const byCol = {};
	const base = R / 330;
	const S = DATA.stars;
	for (let i = 0; i < S.length; i += 4) {
		const mag = S[i + 2];
		const p = P((S[i] + 360) % 360, S[i + 1], 0);
		if (!p) continue;
		// Nahe am Horizont verblassen schwache Sterne (Dunst)
		if (p[2] < 0.12 && mag > 4.5) continue;
		const r = base * Math.pow(1.36, 4.6 - mag);
		const col = sky.real ? bvColor(S[i + 3]) : T.star;
		byCol[col] = (byCol[col] || '') + dot(X(p[0]), Y(p[1]), Math.max(base * 0.42, r));
	}
	Object.entries(byCol).forEach(([c, d]) => (o += `<path d="${d}" fill="${c}"/>`));
	// Sternbild-Namen
	if (sky.names) {
		Object.entries(DATA.lines).forEach(([k, segs]) => {
			let sx = 0,
				sy = 0,
				n = 0;
			segs.forEach((seg) =>
				seg.forEach(([ra, dec]) => {
					const p = P((ra + 360) % 360, dec, 0.08);
					if (p) {
						sx += p[0];
						sy += p[1];
						n++;
					}
				})
			);
			if (n < 3) return;
			o += `<text x="${X(sx / n).toFixed(1)}" y="${(Y(sy / n) + R * 0.05).toFixed(1)}" text-anchor="middle" font-family="SgMD" font-size="${(R / 34).toFixed(1)}" letter-spacing="${(R / 300).toFixed(1)}" fill="${T.line}" fill-opacity=".62">${String((DATA && DATA.names[k]) || k).toUpperCase()}</text>`;
		});
	}
	o += '</g>';
	if (sky.grid) {
		// Himmelsrichtungen am Rand
		const lab = [
			['N', 0],
			['O', 270],
			['S', 180],
			['W', 90]
		];
		lab.forEach(([t, a]) => {
			const ang = /** @type {number} */ (a) * RAD;
			o += `<text x="${(cx + Math.sin(ang) * R * 0.94).toFixed(1)}" y="${(cy - Math.cos(ang) * R * 0.94 + R * 0.018).toFixed(1)}" text-anchor="middle" font-family="SgMD" font-size="${(R / 26).toFixed(1)}" fill="${T.line}" fill-opacity=".55">${t}</text>`;
		});
	}
	return o;
}

/** Datum und Uhrzeit hübsch für die Widmungszeile @param {any} sky */
export function skyLabel(sky) {
	const m = String(sky.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return '';
	const mon = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'][+m[2] - 1];
	const h = Math.floor((sky.min || 0) / 60),
		mi = (sky.min || 0) % 60;
	return `${+m[3]}. ${mon} ${m[1]} · ${h}:${String(mi).padStart(2, '0')} Uhr`;
}
