// Karte beim Verschieben/Herauszoomen nachladen (wie bei Online-Karten): Kommt der sichtbare
// Bereich in die Nähe des Randes der geladenen Gegend, werden nur die fehlenden Vektorkacheln
// geholt (gleiche Detailstufe, bekannte Kacheln aus dem Speicher) und an die Kartendaten angehängt.
// Neu gezeichnet wird erst nach dem Loslassen – während des Ziehens bleibt alles flüssig.
import { app as appUntyped } from './app.js';
import { fetchTiles } from '../karte/kacheln.js';
import { buildDataTiles } from '../karte/daten.js';
import { mercInv } from '../karte/raster.js';
import { freiBereich, meterJeEinheit, nachladbar, visRect, zielStufe } from './zustand.js';
import { FMAP, render } from './zeichnen.js';
import { liveAn } from './neu.js';

/** @type {any} */
const app = appUntyped;

let timer = 0;
let laeuft = false;

/** Nach jeder Bewegung aufrufen – prüft kurz danach, ob Karte fehlt */
export function nachladenPruefen() {
	if (!nachladbar()) return;
	clearTimeout(timer);
	timer = window.setTimeout(lauf, 160);
}

/** Anzeige „Karte wird geladen …“ am Poster @param {boolean} an */
function anzeige(an) {
	let el = document.getElementById('nlHinweis');
	if (!el && an) {
		el = document.createElement('div');
		el.id = 'nlHinweis';
		el.className = 'nl-hinweis';
		el.setAttribute('role', 'status');
		el.innerHTML = '<i></i>Karte wird nachgeladen …';
		(document.querySelector('.stage') || document.body).appendChild(el);
	}
	if (el) el.classList.toggle('an', an);
}

async function lauf() {
	const D = app.DATA;
	// Live-Karte lädt ihre Kacheln selbst
	if (laeuft || !nachladbar(D) || liveAn()) return;
	const v = visRect(),
		w = v[2] - v[0],
		h = v[3] - v[1];
	const E = D.ext,
		F = freiBereich(D);
	// Passt die Detailstufe noch zum Maßstab? (hineingezoomt → feiner, herausgezoomt → gröber)
	// (nur bei der gezeichneten Karte – Landkarten-Stile rechnet MapLibre selbst in jeder Stufe)
	const S = app.S;
	const gezeichnet = S && S.mode !== 'std' && (!S.motif || S.motif === 'karte');
	const ziel = gezeichnet ? zielStufe(w * meterJeEinheit(D), D.tz || 14) : D.tz || 14;
	if (ziel !== (D.tz || 14)) return stufeWechseln(D, ziel, v, w, h, F);
	// fehlt im sichtbaren Bereich (mit kleinem Rand) etwas?
	const rand = 0.15;
	const fehlt = v[0] - w * rand < E.x0 - 1 || v[1] - h * rand < E.y0 - 1 || v[2] + w * rand > E.x1 + 1 || v[3] + h * rand > E.y1 + 1;
	if (!fehlt) return;
	// großzügig vorausladen (eine halbe Ansicht in jede Richtung), aber im erlaubten Bereich
	const r = [Math.max(F.x0, v[0] - w * 0.5), Math.max(F.y0, v[1] - h * 0.5), Math.min(F.x1, v[2] + w * 0.5), Math.min(F.y1, v[3] + h * 0.5)];
	if (r[0] >= E.x0 && r[1] >= E.y0 && r[2] <= E.x1 && r[3] <= E.y1) return;
	const P = D.proj;
	const ll = (/** @type {number} */ x, /** @type {number} */ y) => mercInv(x / P.sc + P.x0, y / P.sc + P.y0);
	const [wl, n] = ll(r[0], r[1]),
		[e, s] = ll(r[2], r[3]);
	laeuft = true;
	const zeigTimer = window.setTimeout(() => anzeige(true), 200);
	try {
		const tiles = await fetchTiles({ w: wl, n, e, s }, { z: D.tz, ohne: new Set(D.tkeys) });
		if (app.DATA !== D) return;
		// erst nach dem Loslassen verarbeiten und einbauen (mitten im Ziehen würde es ruckeln)
		await nichtBeimZiehen();
		if (app.DATA !== D) return;
		const place = { name: D.place, region: D.region, center: D.center };
		const nd = tiles.length ? buildDataTiles(tiles, app.lastB, { w: wl, n, e, s }, place, { fid0: D.fidN, ti0: D.tiles.length }) : null;
		if (nd) {
			// Vorschaubilder (Designs, Vorschläge) hängen an der ursprünglichen Gegend – nicht neu erzeugen
			if (D.n0 == null) D.n0 = D.feats.length;
			for (const f of nd.feats) D.feats.push(f);
			for (const t of nd.tiles) D.tiles.push(t);
			for (const k of nd.tkeys) D.tkeys.push(k);
			D.fidN = nd.fidN;
			if (nd.orte && nd.orte.length) {
				const da = new Set((D.orte || []).map((/** @type {any} */ o) => o.n));
				D.orte = [...(D.orte || []), ...nd.orte.filter((/** @type {any} */ o) => !da.has(o.n))];
			}
			FMAP.clear();
		}
		// neue Ausdehnung (neues Objekt → Zwischenspeicher/Grenzen rechnen neu)
		D.ext = { x0: Math.min(E.x0, r[0]), y0: Math.min(E.y0, r[1]), x1: Math.max(E.x1, r[2]), y1: Math.max(E.y1, r[3]) };
		// Höhenlinien/Relief galten für die alte Gegend → beim nächsten Bedarf neu
		delete D._contours;
		delete D._contoursP;
		delete D._relief;
		render();
	} catch (err) {
		console.warn('Nachladen fehlgeschlagen', err);
	} finally {
		clearTimeout(zeigTimer);
		anzeige(false);
		laeuft = false;
	}
	// weiter gezogen, während geladen wurde? → gleich noch einmal prüfen
	nachladenPruefen();
}

/**
 * Andere Detailstufe laden (wie Online-Karten beim Zoomen): ersetzt die Kartendaten durch Kacheln der
 * passenden Stufe für die Ansicht plus Vorrat. Gleiche Projektion → der Ausschnitt bleibt exakt stehen.
 * @param {any} D @param {number} z @param {number[]} v @param {number} w @param {number} h @param {any} F
 */
async function stufeWechseln(D, z, v, w, h, F) {
	const r = [Math.max(F.x0, v[0] - w * 0.5), Math.max(F.y0, v[1] - h * 0.5), Math.min(F.x1, v[2] + w * 0.5), Math.min(F.y1, v[3] + h * 0.5)];
	const P = D.proj;
	const ll = (/** @type {number} */ x, /** @type {number} */ y) => mercInv(x / P.sc + P.x0, y / P.sc + P.y0);
	const [wl, n] = ll(r[0], r[1]),
		[e, s] = ll(r[2], r[3]);
	laeuft = true;
	const zeigTimer = window.setTimeout(() => anzeige(true), 200);
	try {
		const tiles = await fetchTiles({ w: wl, n, e, s }, { z });
		await nichtBeimZiehen();
		if (app.DATA !== D || !tiles.length) return;
		const place = { name: D.place, region: D.region, center: D.center };
		const nd = buildDataTiles(tiles, app.lastB, { w: wl, n, e, s }, place, { fid0: D.fidN, ti0: 0 });
		if (!nd || !nd.feats.length) return;
		D.feats = nd.feats;
		D.tiles = nd.tiles;
		D.tkeys = nd.tkeys;
		D.tz = nd.tz;
		D.fidN = nd.fidN;
		if (nd.orte && nd.orte.length) D.orte = nd.orte;
		D.ext = { x0: r[0], y0: r[1], x1: r[2], y1: r[3] };
		// Dichte, Vorschaubild-Zähler, Höhenlinien gelten für die neue Stufe neu
		D._dichte = null;
		D.n0 = D.feats.length;
		delete D._contours;
		delete D._contoursP;
		delete D._relief;
		FMAP.clear();
		app.einblenden = true;
		render();
	} catch (err) {
		console.warn('Detailstufe wechseln fehlgeschlagen', err);
	} finally {
		clearTimeout(zeigTimer);
		anzeige(false);
		laeuft = false;
	}
	nachladenPruefen();
}

/** Wartet, bis keine Ziehbewegung mehr läuft */
function nichtBeimZiehen() {
	if (!app.drag && !(app.PTS && app.PTS.size > 1)) return Promise.resolve();
	return new Promise((ok) => {
		const pruef = () => {
			if (app.drag || (app.PTS && app.PTS.size > 1)) setTimeout(pruef, 120);
			else ok(undefined);
		};
		setTimeout(pruef, 120);
	});
}
