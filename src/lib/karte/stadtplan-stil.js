// Gezeichnete Kartenstile für MapLibre (zeichnet direkt auf dem Grafikchip).
// Eine Quelle für Live-Vorschau UND Druckdatei – so sieht der Druck genau aus wie die Vorschau.
// Linienbreiten hängen an der Zoomstufe (gröber/feiner wie bei gedruckten Stadtplänen).
// Alle gezeichneten Looks (Stadtplan, Navy, Vintage …) nutzen denselben Aufbau, nur mit anderen Farben
// und Linienstärken – siehe `live-stile.js`.
import { KONFIG } from '../konfig.js';

/**
 * Farben und Stärken eines gezeichneten Stils.
 * `null` = Ebene nicht zeichnen (z. B. Häuser ohne Füllung, nur Umriss).
 * @typedef {{
 *   bg: string, gruen: string|null, wasser: string|null, wasserRand?: string|null, fluss: string,
 *   haus: string|null, hausRand: string|null, haupt: string, mittel: string, neben: string, weg: string,
 *   bahn: string, grenze: string, hoehe: string,
 *   b?: { haupt?: number, neben?: number, weg?: number, haus?: number }
 * }} Farben
 */

/** Farben des Stadtplans (Standard) @type {Farben} */
export const STADTPLAN = {
	bg: '#ffffff',
	gruen: '#f7f8f5',
	wasser: '#a9c4e2',
	fluss: '#a9c4e2',
	haus: '#dde0e4',
	hausRand: '#9fa4ab',
	haupt: '#111111',
	mittel: '#1d1d1f',
	neben: '#1d1d1f',
	weg: '#5a5d63',
	bahn: '#a4a7ad',
	grenze: '#9ea3aa',
	hoehe: 'rgba(150,120,80,.55)'
};

/** @param {number[][]} stufen [[zoom, breite], …] @param {number} [f] Faktor */
const breite = (stufen, f = 1) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stufen.flatMap(([z, w]) => [z, +(w * f).toFixed(3)])];

/** Ebenen-Gruppen für „Kartendetails“ (Straßen/Gebäude ein- und ausblenden) – nach Kachel-Ebene */
export const STRASSEN_QUELLEN = ['transportation', 'transportation_name'];
export const HAUS_QUELLEN = ['building'];

/**
 * MapLibre-Stil (JSON) erzeugen.
 * @param {{ haeuser?: boolean, strassen?: boolean }} [opt] sichtbare Ebenen
 * @param {Farben} [L] Farben
 */
export function stadtplanStil(opt = {}, L = STADTPLAN) {
	const sicht = (/** @type {boolean|undefined} */ an) => ({ visibility: an === false ? 'none' : 'visible' });
	const b = L.b || {};
	/** @param {string} id @param {string[]} klassen @param {string} farbe @param {number[][]} st @param {number} [min] @param {number} [f] */
	const strasse = (id, klassen, farbe, st, min = 0, f = 1) => ({
		id,
		type: 'line',
		source: 'omt',
		'source-layer': 'transportation',
		minzoom: min,
		filter: ['in', ['get', 'class'], ['literal', klassen]],
		layout: { 'line-cap': 'round', 'line-join': 'round', ...sicht(opt.strassen) },
		paint: { 'line-color': farbe, 'line-width': breite(st, f) }
	});
	/** @type {any[]} */
	const layers = [{ id: 'hintergrund', type: 'background', paint: { 'background-color': L.bg } }];
	if (L.gruen) {
		layers.push({ id: 'gruen', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood']]], paint: { 'fill-color': L.gruen } });
		layers.push({ id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': L.gruen } });
	}
	if (L.wasser) layers.push({ id: 'wasser', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': L.wasser } });
	if (L.wasserRand) layers.push({ id: 'wasser-rand', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': L.wasserRand, 'line-width': breite([[10, 0.4], [14, 0.9], [18, 2]]) } });
	layers.push(
		{ id: 'fluss', type: 'line', source: 'omt', 'source-layer': 'waterway', layout: { 'line-cap': 'round' }, paint: { 'line-color': L.fluss, 'line-width': breite([[10, 0.6], [14, 1.6], [18, 5]]) } },
		// Bundesländer/Regionen: zart gestrichelt, nur in der Übersicht (ganzes Land/Bundesland)
		{ id: 'regionen', type: 'line', source: 'omt', 'source-layer': 'boundary', maxzoom: 10, filter: ['all', ['in', ['get', 'admin_level'], ['literal', [3, 4]]], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': L.grenze, 'line-dasharray': [3, 2], 'line-width': breite([[3, 0.5], [9, 0.9]]) } },
		// Landesgrenzen (nur an Land) – damit ganze Länder erkennbar sind; im Stadtmaßstab kaum sichtbar
		{ id: 'grenzen', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['<=', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]], layout: { 'line-join': 'round' }, paint: { 'line-color': L.grenze, 'line-width': breite([[3, 0.6], [8, 1.2], [14, 1.6]]) } }
	);
	if (L.haus) {
		/** @type {any} */
		const paint = { 'fill-color': L.haus };
		if (L.hausRand) paint['fill-outline-color'] = L.hausRand;
		layers.push({ id: 'haeuser', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, layout: sicht(opt.haeuser), paint });
	} else if (L.hausRand) {
		// Häuser nur als Umriss (wie beim Siegritz-Design)
		layers.push({ id: 'haeuser', type: 'line', source: 'omt', 'source-layer': 'building', minzoom: 13, layout: { 'line-join': 'round', ...sicht(opt.haeuser) }, paint: { 'line-color': L.hausRand, 'line-width': breite([[13, 0.3], [15, 0.7], [18, 1.6]], b.haus || 1) } });
	}
	layers.push(
		strasse('bahn', ['rail', 'transit'], L.bahn, [[10, 0.4], [14, 0.8], [18, 2]], 10),
		strasse('wege', ['path', 'track', 'pier'], L.weg, [[13, 0.25], [15, 0.6], [18, 1.6]], 13, b.weg),
		strasse('neben', ['minor', 'service'], L.neben, [[11, 0.25], [14, 0.8], [16, 2], [18, 5]], 11, b.neben),
		strasse('mittel', ['tertiary', 'secondary'], L.mittel, [[9, 0.4], [12, 0.9], [14, 1.6], [16, 3.5], [18, 8]], 8, b.neben),
		strasse('haupt', ['primary', 'trunk', 'motorway'], L.haupt, [[7, 0.6], [10, 1.2], [12, 1.8], [14, 2.8], [16, 5], [18, 11]], 0, b.haupt)
	);
	return {
		version: 8,
		sources: { omt: { type: 'vector', url: KONFIG.tileJson } },
		layers
	};
}
