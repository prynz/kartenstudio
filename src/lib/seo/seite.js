// Hilfen für die Orts-Seiten: Nachbarorte, Koordinaten, abwechslungsreiche Texte.
import { ORTE } from './orte.js';

/** @typedef {typeof ORTE[number]} Ort */

/** Entfernung in km @param {Ort} a @param {Ort} b */
export function km(a, b) {
	const r = Math.PI / 180;
	const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Die nächsten Orte aus der Liste @param {Ort} o @param {number} n */
export function nachbarn(o, n = 6) {
	return ORTE.filter((x) => x.slug !== o.slug)
		.map((x) => ({ ...x, km: km(o, x) }))
		.sort((a, b) => a.km - b.km)
		.slice(0, n);
}

/** 49° 53′ 30″ N @param {number} v @param {string} p @param {string} m */
export function grad(v, p, m) {
	const s = v < 0 ? m : p;
	v = Math.abs(v);
	const d = Math.floor(v),
		mi = Math.floor((v - d) * 60),
		se = Math.round(((v - d) * 60 - mi) * 60);
	return `${d}° ${String(mi).padStart(2, '0')}′ ${String(Math.min(59, se)).padStart(2, '0')}″ ${s}`;
}

/** Kleine, aber echte Unterschiede je Ort: Region und Art des Orts bestimmen den Text @param {Ort} o */
export function texte(o) {
	const wo = o.landkreis ? `im Landkreis ${o.landkreis}` : `in ${o.bezirk}`;
	const region = o.fs ? 'in der Fränkischen Schweiz' : `in ${o.bezirk}`;
	const art = o.typ === 'dorf' ? 'Dorf' : o.gross ? 'Großstadt' : 'Stadt';
	const lead =
		o.typ === 'dorf'
			? `Dein Dorf ${o.name} ${wo} als Kartenposter, T-Shirt oder Tasse – jedes Haus, jeder Feldweg, genau so wie er ist.`
			: o.gross
				? `Der Stadtplan von ${o.name} als Poster: Straßen, Flüsse und Viertel – vom Zentrum bis an den Stadtrand, in deinem Stil.`
				: `${o.name} ${region} als Stadtposter: die Altstadt, die Straßen und das Wasser – fertig gestaltet in wenigen Sekunden.`;
	const ideen = [
		o.fs && 'Mit Höhenlinien zeigt das Poster die Täler und Felsen der Fränkischen Schweiz.',
		o.insel && `${o.name} liegt im Wasser – mit dem Thema „Insel-Silhouette“ wird die Inselform zum Hingucker.`,
		o.typ === 'dorf' && 'Beliebt als Vereins-Shirt für Kirchweih, Feuerwehr oder Sportverein.',
		o.gross && 'Für große Städte lohnt sich das Typografie-Design: der Name in riesigen Buchstaben über dem Stadtplan.',
		!o.gross && o.typ !== 'dorf' && 'Schön auch als Geschenk zum Umzug: mit Herz auf der eigenen Straße und dem Einzugsdatum.'
	].filter(Boolean);
	return { wo, region, art, lead, ideen: /** @type {string[]} */ (ideen) };
}

/** Orte nach Regierungsbezirk gruppiert (für die Übersicht) */
export function nachBezirk() {
	/** @type {Record<string, Ort[]>} */
	const g = {};
	ORTE.forEach((o) => (g[o.bezirk] = g[o.bezirk] || []).push(o));
	Object.values(g).forEach((l) => l.sort((a, b) => a.name.localeCompare(b.name, 'de')));
	return g;
}
