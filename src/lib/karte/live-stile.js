// Kartenstile des neuen Editors (Live-Karte mit MapLibre).
// Nachgebaut nach der Auswahl aus dem Archiv (/archiv) – mit klaren, einfachen Namen.
//
// Zwei Arten:
//   „Gezeichnet“ – unsere eigenen Linienkarten (Farben frei, siehe stadtplan-stil.js)
//   „Landkarte“  – fertige Kartenstile von OpenFreeMap bzw. das amtliche Luftbild Bayern
// Dazu das Extra „Höhenlinien“ (aus einem freien Höhenmodell im Browser berechnet).
import { KONFIG } from '../konfig.js';
import { stadtplanStil, STADTPLAN, STRASSEN_QUELLEN, HAUS_QUELLEN } from './stadtplan-stil.js';

const NAVY = '#262c3a';

/**
 * @typedef {{ id: string, name: string, desc: string, art: 'gezeichnet'|'landkarte', vorlage: string,
 *   archiv: string, farben?: import('./stadtplan-stil.js').Farben, url?: string, luftbild?: boolean, hoehe?: string }} LiveStil
 */

/** @type {LiveStil[]} */
export const LIVE_STILE = [
	// ---------- Gezeichnet ----------
	{ id: 'stadtplan', name: 'Stadtplan', desc: 'Schwarze Straßen, hellblaues Wasser, viel Weiß – der klare Klassiker.', art: 'gezeichnet', vorlage: 'stadtplan', archiv: 'stadtplan', farben: STADTPLAN },
	{
		id: 'navy', name: 'Navy', desc: 'Hauptstraßen und Häuser in Navy, alles andere zartgrau – das Siegritz-Original.', art: 'gezeichnet', vorlage: 'umriss', archiv: 'umriss',
		farben: { bg: '#ffffff', gruen: null, wasser: null, wasserRand: '#a6a6a6', fluss: '#a6a6a6', haus: null, hausRand: NAVY, haupt: NAVY, mittel: '#a6a6a6', neben: '#a6a6a6', weg: '#b4b4b4', bahn: '#a6a6a6', grenze: '#a6a6a6', hoehe: 'rgba(38,44,58,.28)', b: { haupt: 1.45, neben: 1.3, weg: 1.8, haus: 1.4 } }
	},
	{
		id: 'vintage', name: 'Vintage', desc: 'Wie eine alte Landkarte: Sepia, Papierton und blasses Wasser.', art: 'gezeichnet', vorlage: 'vintage', archiv: 'vintage',
		farben: { bg: '#efe4cc', gruen: '#d3d4ad', wasser: '#a9c3c8', wasserRand: '#7f9fa6', fluss: '#7f9fa6', haus: '#d9c7a3', hausRand: '#4a3a2a', haupt: '#4a3a2a', mittel: '#6e5a44', neben: '#6e5a44', weg: '#a8916f', bahn: '#6e5a44', grenze: '#8a765c', hoehe: 'rgba(110,90,68,.45)', b: { haupt: 1.05, neben: 1.3, weg: 1.6 } }
	},
	{
		id: 'sand', name: 'Sand', desc: 'Warmes Sandpapier mit hellen Straßen – ruhig und zurückhaltend.', art: 'gezeichnet', vorlage: 'washi', archiv: 'washi',
		farben: { bg: '#eee6d8', gruen: null, wasser: '#dcd3c2', fluss: '#dcd3c2', haus: '#e6decf', hausRand: null, haupt: '#fbf8f2', mittel: '#fbf8f2', neben: '#fbf8f2', weg: '#f6f1e8', bahn: '#f6f1e8', grenze: '#cfc4b0', hoehe: 'rgba(150,130,100,.4)', b: { haupt: 1.6, neben: 2, weg: 2 } }
	},
	{
		id: 'tusche', name: 'Tusche & Rot', desc: 'Schwarze Tusche auf Reispapier, Hauptstraßen in Rot.', art: 'gezeichnet', vorlage: 'tusche', archiv: 'tusche',
		farben: { bg: '#f4f1ea', gruen: null, wasser: '#dcd8cf', wasserRand: '#b9b4aa', fluss: '#b9b4aa', haus: null, hausRand: '#1a1a1a', haupt: '#c0392b', mittel: '#1a1a1a', neben: '#1a1a1a', weg: '#9a958c', bahn: '#1a1a1a', grenze: '#9a958c', hoehe: 'rgba(26,26,26,.25)', b: { haupt: 1.05, neben: 1.3, weg: 1.6, haus: 0.9 } }
	},
	{
		id: 'schwarz', name: 'Schwarz', desc: 'Feine weiße Linien auf Schwarz – wie ein Siebdruck.', art: 'gezeichnet', vorlage: 'schwarzweiss', archiv: 'schwarzweiss',
		farben: { bg: '#161616', gruen: null, wasser: '#ffffff', fluss: '#ffffff', haus: null, hausRand: '#ffffff', haupt: '#ffffff', mittel: '#e8e8e8', neben: '#e8e8e8', weg: '#9a9a9a', bahn: '#e8e8e8', grenze: '#8a8a8a', hoehe: 'rgba(255,255,255,.28)', b: { haupt: 0.8, neben: 0.95, weg: 1.4, haus: 0.6 } }
	},
	{
		id: 'nachtgold', name: 'Nachtblau & Gold', desc: 'Goldene Straßen auf tiefem Nachtblau – edel und warm.', art: 'gezeichnet', vorlage: 'goldnacht', archiv: 'goldnacht',
		farben: { bg: '#0a1828', gruen: null, wasser: '#0e2236', wasserRand: '#163049', fluss: '#163049', haus: null, hausRand: '#1c2c42', haupt: '#d8a93b', mittel: '#8d7a45', neben: '#8d7a45', weg: '#4d4a3c', bahn: '#4d4a3c', grenze: '#4d4a3c', hoehe: 'rgba(216,169,59,.28)', b: { haupt: 1.1, neben: 1, weg: 1.4, haus: 0.6 } }
	},
	{
		id: 'koenigsblau', name: 'Königsblau', desc: 'Weißes Papier, zarte blaue Straßen, Wasser und Parks in kräftigem Blau.', art: 'gezeichnet', vorlage: 'koenigsblau', archiv: 'koenigsblau',
		farben: { bg: '#ffffff', gruen: '#5a6fe3', wasser: '#2440d8', fluss: '#2440d8', haus: null, hausRand: '#dde0f6', haupt: '#bfc6ef', mittel: '#d0d5f3', neben: '#d0d5f3', weg: '#dfe2f7', bahn: '#d0d5f3', grenze: '#bfc6ef', hoehe: 'rgba(36,64,216,.25)', b: { haupt: 0.8, neben: 1.2, weg: 1.8, haus: 0.5 } }
	},
	{
		id: 'waldgruen', name: 'Waldgrün', desc: 'Tannengrün, Moos und Nebel.', art: 'gezeichnet', vorlage: 'wald', archiv: 'wald',
		farben: { bg: '#eef0e6', gruen: '#b7cba0', wasser: '#9fc4c9', wasserRand: '#7fa8ae', fluss: '#7fa8ae', haus: '#c7d1bb', hausRand: '#2f4a36', haupt: '#1f3a2b', mittel: '#4f6b55', neben: '#4f6b55', weg: '#8ea18f', bahn: '#4f6b55', grenze: '#8ea18f', hoehe: 'rgba(47,74,54,.35)', b: { haupt: 1.05, neben: 1.3, weg: 1.6 } }
	},
	// ---------- Landkarte ----------
	{ id: 'strassenkarte', name: 'Straßenkarte', desc: 'Wie eine gedruckte Straßenkarte: Gebäude, Parks, Wasser in natürlichen Farben.', art: 'landkarte', vorlage: 'stadtplan', archiv: 'liberty', url: KONFIG.styles + '/liberty', hoehe: 'rgba(140,110,70,.45)' },
	{ id: 'hellgrau', name: 'Hellgrau', desc: 'Dezente Grautöne – ruhig und modern, passt zu jedem Raum.', art: 'landkarte', vorlage: 'stadtplan', archiv: 'positron', url: KONFIG.styles + '/positron', hoehe: 'rgba(120,120,120,.4)' },
	{ id: 'farbig', name: 'Farbig', desc: 'Kräftige Farben für Straßen, Wasser und Grün – fröhlich und lebendig.', art: 'landkarte', vorlage: 'stadtplan', archiv: 'bright', url: KONFIG.styles + '/bright', hoehe: 'rgba(140,110,70,.45)' },
	{ id: 'luftbild', name: 'Luftbild (Bayern)', desc: 'Amtliches Luftbild, 40 cm genau – bisher nur in Bayern verfügbar.', art: 'landkarte', vorlage: 'stadtplan', archiv: 'satellit', url: KONFIG.styles + '/liberty', luftbild: true, hoehe: 'rgba(255,255,255,.4)' }
];

/** Stil nach Schlüssel (unbekannt → Stadtplan) @param {string} [id] */
export const liveStil = (id) => LIVE_STILE.find((s) => s.id === id) || LIVE_STILE[0];

/** Grob: liegt der Punkt in Bayern? (Luftbilder gibt es bisher nur dort) @param {number} lon @param {number} lat */
export function inBayern(lon, lat) {
	if (lon < 8.95 || lon > 13.85 || lat < 47.27 || lat > 50.57) return false;
	if (lat > 50.2 && lon < 9.7) return false;
	if (lat > 50.35 && lon > 10.2 && lon < 11.8) return false;
	if (lon < 10.0 && lat < 49.0) return false;
	return true;
}

/* ---------- Höhenlinien (aus dem freien Höhenmodell, im Browser berechnet) ---------- */
/** @type {any} */
let DEM = null;
/** @type {any} */
let demLib = null;
/**
 * Höhenlinien-Quelle einmalig vorbereiten (lädt den kleinen Rechenbaustein erst bei Bedarf).
 * @param {any} lib MapLibre
 */
async function hoehenQuelle(lib) {
	if (!DEM) {
		const mod = /** @type {any} */ (await import('maplibre-contour'));
		const mlc = mod.default || mod;
		DEM = new mlc.DemSource({ url: KONFIG.terrain, encoding: 'terrarium', maxzoom: 13, worker: true });
	}
	if (demLib !== lib) {
		DEM.setupMaplibre(lib);
		demLib = lib;
	}
	return {
		type: 'vector',
		tiles: [
			DEM.contourProtocolUrl({
				// [feine, kräftige] Linie in Metern je Zoomstufe
				thresholds: { 7: [200, 1000], 9: [100, 500], 11: [50, 250], 12: [20, 100], 14: [10, 50] },
				elevationKey: 'ele',
				levelKey: 'level',
				contourLayer: 'hoehen'
			})
		],
		maxzoom: 15
	};
}

/* ---------- fertige Landkarten-Stile (OpenFreeMap) ---------- */
/** @type {Map<string, any>} */
const JSON_CACHE = new Map();
/** @param {string} url */
async function holeStil(url) {
	if (!JSON_CACHE.has(url)) {
		const r = await fetch(url);
		if (!r.ok) throw new Error('Kartenstil konnte nicht geladen werden (' + r.status + ')');
		JSON_CACHE.set(url, await r.json());
	}
	return structuredClone(JSON_CACHE.get(url));
}

/**
 * Sichtbarkeit nach „Kartendetails“ auf einen fertigen Stil anwenden (Gebäude/Straßen nach Kachel-Ebene).
 * @param {any[]} layers @param {{haeuser?: boolean, strassen?: boolean}} d
 */
function details(layers, d) {
	for (const l of layers) {
		const q = l['source-layer'];
		const aus = (HAUS_QUELLEN.includes(q) && d.haeuser === false) || (STRASSEN_QUELLEN.includes(q) && d.strassen === false);
		if (aus) l.layout = { ...(l.layout || {}), visibility: 'none' };
	}
}

/**
 * Fertiges MapLibre-Stil-JSON für einen Live-Stil.
 * @param {string} id Stil
 * @param {{haeuser?: boolean, strassen?: boolean}} d Kartendetails
 * @param {boolean} hoehen Höhenlinien an?
 * @param {any} lib MapLibre (für die Höhenlinien-Berechnung)
 */
export async function stilJSON(id, d, hoehen, lib) {
	const S = liveStil(id);
	/** @type {any} */
	let st;
	if (S.art === 'gezeichnet') st = stadtplanStil(d, S.farben);
	else {
		st = await holeStil(/** @type {string} */ (S.url));
		// Beschriftungen aus: Ortsname und Titel stehen ja auf dem Poster
		st.layers = st.layers.filter((/** @type {any} */ l) => l.type !== 'symbol');
		if (S.luftbild) {
			st.layers = st.layers.filter((/** @type {any} */ l) => l.type === 'background');
			// Amtliches Luftbild Bayern (WMS, 40 cm), Datenquelle: Bayerische Vermessungsverwaltung, CC BY 4.0
			st.sources.luftbild = { type: 'raster', tiles: [KONFIG.luftbildBayern], tileSize: 256, maxzoom: 20 };
			st.layers.push({ id: 'luftbild', type: 'raster', source: 'luftbild' });
		}
		details(st.layers, d);
		delete st.sprite;
		delete st.glyphs;
	}
	if (hoehen) {
		st.sources.hoehen = await hoehenQuelle(lib);
		const farbe = S.farben ? S.farben.hoehe : S.hoehe || 'rgba(140,110,70,.45)';
		// Höhenlinien über Flächen, unter Häusern und Straßen
		let i = st.layers.findIndex((/** @type {any} */ l) => l['source-layer'] === 'building' || l['source-layer'] === 'transportation');
		if (i < 0) i = st.layers.length;
		st.layers.splice(
			i,
			0,
			{ id: 'hoehen-fein', type: 'line', source: 'hoehen', 'source-layer': 'hoehen', filter: ['==', ['get', 'level'], 0], layout: { 'line-join': 'round' }, paint: { 'line-color': farbe, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.3, 14, 0.6, 17, 1] } },
			{ id: 'hoehen-haupt', type: 'line', source: 'hoehen', 'source-layer': 'hoehen', filter: ['>', ['get', 'level'], 0], layout: { 'line-join': 'round' }, paint: { 'line-color': farbe, 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 14, 1.2, 17, 2] } }
		);
	}
	return st;
}
