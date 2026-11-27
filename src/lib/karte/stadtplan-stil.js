// Kartenstil „Stadtplan“ für MapLibre (zeichnet direkt auf dem Grafikchip).
// Eine Quelle für Live-Vorschau UND Druckdatei – so sieht der Druck genau aus wie die Vorschau.
// Linienbreiten hängen an der Zoomstufe (gröber/feiner wie bei gedruckten Stadtplänen).
import { KONFIG } from '../konfig.js';

/** Farben des Stadtplans (weitere Looks kommen später schrittweise dazu) */
export const STADTPLAN = {
	bg: '#ffffff',
	gruen: '#f7f8f5',
	wasser: '#a9c4e2',
	haus: '#dde0e4',
	hausRand: '#9fa4ab',
	haupt: '#111111',
	neben: '#1d1d1f',
	weg: '#5a5d63',
	bahn: '#a4a7ad',
	grenze: '#9ea3aa'
};

/** @param {number[][]} stufen [[zoom, breite], …] */
const breite = (stufen) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stufen.flat()];

/** Ebenen-Gruppen für „Kartendetails“ (Straßen/Gebäude ein- und ausblenden) */
export const STRASSEN_EBENEN = ['bahn', 'wege', 'neben', 'mittel', 'haupt'];
export const HAUS_EBENEN = ['haeuser'];

/**
 * MapLibre-Stil (JSON) erzeugen.
 * @param {{ haeuser?: boolean, strassen?: boolean }} [opt] sichtbare Ebenen
 * @param {typeof STADTPLAN} [L] Farben
 */
export function stadtplanStil(opt = {}, L = STADTPLAN) {
	const sicht = (/** @type {boolean|undefined} */ an) => ({ visibility: an === false ? 'none' : 'visible' });
	/** @param {string} id @param {string[]} klassen @param {string} farbe @param {number[][]} b @param {number} [min] */
	const strasse = (id, klassen, farbe, b, min = 0) => ({
		id,
		type: 'line',
		source: 'omt',
		'source-layer': 'transportation',
		minzoom: min,
		filter: ['in', ['get', 'class'], ['literal', klassen]],
		layout: { 'line-cap': 'round', 'line-join': 'round', ...sicht(opt.strassen) },
		paint: { 'line-color': farbe, 'line-width': breite(b) }
	});
	return {
		version: 8,
		sources: { omt: { type: 'vector', url: KONFIG.tileJson } },
		layers: [
			{ id: 'hintergrund', type: 'background', paint: { 'background-color': L.bg } },
			{ id: 'gruen', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]], paint: { 'fill-color': L.gruen } },
			{ id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': L.gruen } },
			{ id: 'wasser', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': L.wasser } },
			{ id: 'fluss', type: 'line', source: 'omt', 'source-layer': 'waterway', layout: { 'line-cap': 'round' }, paint: { 'line-color': L.wasser, 'line-width': breite([[10, 0.6], [14, 1.6], [18, 5]]) } },
			// Landesgrenzen (nur an Land) – damit ganze Länder erkennbar sind; im Stadtmaßstab kaum sichtbar
			// Bundesländer/Regionen: zart gestrichelt, nur in der Übersicht (ganzes Land/Bundesland)
			{ id: 'regionen', type: 'line', source: 'omt', 'source-layer': 'boundary', maxzoom: 10, filter: ['all', ['in', ['get', 'admin_level'], ['literal', [3, 4]]], ['!=', ['get', 'maritime'], 1]], paint: { 'line-color': L.grenze, 'line-dasharray': [3, 2], 'line-width': breite([[3, 0.5], [9, 0.9]]) } },
			{ id: 'grenzen', type: 'line', source: 'omt', 'source-layer': 'boundary', filter: ['all', ['<=', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]], layout: { 'line-join': 'round' }, paint: { 'line-color': L.grenze, 'line-width': breite([[3, 0.6], [8, 1.2], [14, 1.6]]) } },
			{ id: 'haeuser', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, layout: sicht(opt.haeuser), paint: { 'fill-color': L.haus, 'fill-outline-color': L.hausRand } },
			strasse('bahn', ['rail', 'transit'], L.bahn, [[10, 0.4], [14, 0.8], [18, 2]], 10),
			strasse('wege', ['path', 'track', 'pier'], L.weg, [[13, 0.25], [15, 0.6], [18, 1.6]], 13),
			strasse('neben', ['minor', 'service'], L.neben, [[11, 0.25], [14, 0.8], [16, 2], [18, 5]], 11),
			strasse('mittel', ['tertiary', 'secondary'], L.neben, [[9, 0.4], [12, 0.9], [14, 1.6], [16, 3.5], [18, 8]], 8),
			strasse('haupt', ['primary', 'trunk', 'motorway'], L.haupt, [[7, 0.6], [10, 1.2], [12, 1.8], [14, 2.8], [16, 5], [18, 11]])
		]
	};
}
