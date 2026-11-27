// Neuer Karteneditor: Die Karte im Poster ist eine Live-Karte (MapLibre, Grafikchip) – wie bei
// Cartida/Momenterie flüssig beim Ziehen und Zoomen. Rahmen und Text zeichnet weiter das Poster-SVG
// darüber (die Kartenfläche bleibt dort durchsichtig, außen deckt das „Passepartout“ ab).
//
// Damit Vorschau und Druck exakt gleich aussehen, rechnet die Karte immer mit derselben Bezugsbreite
// (REF Bildpunkte für die Kartenbreite) – am Bildschirm nur per CSS skaliert, im Druck mit höherer
// Pixeldichte in Stücken gerechnet (bis 300 dpi).
import { app as appUntyped } from './app.js';
import { MW } from './basis.js';
import { istNeu } from './modus.js';
import { loadMaplibre } from '../karte/ortswahl.js';
import { mercInv } from '../karte/raster.js';
import { buildSVG, geo } from './zeichnen.js';
import { stilJSON, liveStil, inBayern } from '../karte/live-stile.js';
import { applyDesign } from '../themen/designs.js';
import { PRESETS } from '../themen/vorlagen.js';

/** @type {any} */
const app = appUntyped;

/** Bezugsbreite der Karte in CSS-Pixeln (bestimmt Zoomstufe und damit Detail und Linienstärke) */
export const REF = 800;

/** Läuft gerade der neue Editor mit Live-Karte? */
export function liveAn() {
	const S = app.S;
	return istNeu() && !!S && !!app.DATA && S.mode === 'std' && S.base === 'stadtplan' && (!S.motif || S.motif === 'karte') && !(S.multi && S.multi.on);
}

/**
 * Zustand auf den neuen Editor ausrichten: Stadtplan-Karte, Stadtplan-Design, alte Extras aus.
 * @param {any} S
 */
export function neuAnwenden(S) {
	if (!istNeu() || !S) return S;
	S.mode = 'std';
	S.base = 'stadtplan';
	S.motif = 'karte';
	S.multi = null;
	S.route = null;
	S.hoehen = null;
	S.pins = [];
	S.fx = {};
	S.labels = false;
	// Kartenstil (Stadtplan, Navy, Vintage …) und Höhenlinien
	let st = liveStil(S.karte && S.karte.stil);
	// Luftbild gibt es nur in Bayern – woanders zurück zum Stadtplan
	const c = app.DATA && app.DATA.center;
	if (st.luftbild && c && !inBayern(c[0], c[1])) st = liveStil('stadtplan');
	S.karte = { stil: st.id, hoehen: !!(S.karte && S.karte.hoehen) };
	if (S.preset !== st.vorlage || S.design !== 'stadtplan') stilFarben(S, st.vorlage);
	return S;
}

/**
 * Papier- und Schriftfarbe des Posters passend zum Kartenstil (aus der alten Vorlage des Stils).
 * @param {any} S @param {string} vorlage
 */
function stilFarben(S, vorlage) {
	const P = /** @type {any} */ (PRESETS)[vorlage] || PRESETS.stadtplan;
	S.preset = vorlage;
	S.bg = !P.bg || P.bg === 'none' ? '#ffffff' : P.bg;
	applyDesign(S, 'stadtplan', P, true);
}

/** Kartenstil wählen (Bereich „Stil“) @param {any} S @param {string} id */
export function stilSetzen(S, id) {
	const st = liveStil(id);
	S.karte = { ...(S.karte || {}), stil: st.id };
	stilFarben(S, st.vorlage);
}

/** Aktueller Kartenstil + Höhenlinien */
function karteOpt() {
	const k = (app.S && app.S.karte) || {};
	return { stil: liveStil(k.stil).id, hoehen: !!k.hoehen };
}

/** Sichtbare Ebenen nach „Kartendetails“ (S.cls.haus.h = Gebäude aus, Straßen aus = nur Gebäude) */
function details() {
	const c = (app.S && app.S.cls) || {};
	return { haeuser: !(c.haus && c.haus.h), strassen: !(c.haupt && c.haupt.h && c.neben && c.neben.h) };
}

/** Ansicht (S.view in Poster-Kartenkoordinaten) → MapLibre-Mitte und Zoomstufe bei Breite REF */
function kamera(v = app.S.view) {
	const P = app.DATA.proj;
	const mercW = MW / v.z / P.sc;
	return { center: mercInv(v.cx / P.sc + P.x0, v.cy / P.sc + P.y0), zoom: Math.log2(REF / (512 * mercW)), mercW };
}

/* ---------- Live-Karte am Bildschirm ---------- */
/** @type {any} */
let karte = null;
/** @type {HTMLDivElement|null} */
let huelle = null;
let laedt = false;
let pr = 0;
let stilKey = '';
/** @type {any} */
let karteLib = null;

async function starten() {
	if (karte || laedt) return;
	laedt = true;
	try {
		const lib = await loadMaplibre();
		huelle = document.createElement('div');
		huelle.id = 'liveKarte';
		huelle.className = 'live-karte';
		huelle.setAttribute('aria-hidden', 'true');
		// Karte und Poster in eine gemeinsame Hülle: so bewegen sie sich immer zusammen
		// (auch während Animationen der Seitenleiste oder des Handy-Panels)
		let rahmen = /** @type {HTMLElement|null} */ (app.poster.parentElement);
		if (!rahmen || !rahmen.classList.contains('poster-huelle')) {
			rahmen = document.createElement('div');
			rahmen.className = 'poster-huelle';
			app.poster.before(rahmen);
			rahmen.appendChild(app.poster);
		}
		rahmen.insertBefore(huelle, app.poster);
		const k = kamera();
		pr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
		const o = karteOpt();
		stilKey = JSON.stringify([o, details()]);
		karte = new lib.Map({
			container: huelle,
			style: await stilJSON(o.stil, details(), o.hoehen, lib),
			center: k.center,
			zoom: k.zoom,
			interactive: false,
			attributionControl: false,
			// neue Kacheln blenden weich ein (wie bei den Vorbildern)
			fadeDuration: 300,
			pixelRatio: pr,
			renderWorldCopies: false
		});
		karteLib = lib;
		karte.on('dataloading', () => huelle && huelle.classList.add('laedt'));
		karte.on('idle', () => huelle && huelle.classList.remove('laedt'));
		// Poster ändert seine Größe (Fenster, Handy-Panel) → Karte mitführen
		new ResizeObserver(() => liveSync()).observe(app.poster);
	} catch (e) {
		console.warn('Live-Karte nicht verfügbar', e);
	} finally {
		laedt = false;
	}
	liveSync();
}

/** Live-Karte an Poster und Ansicht ausrichten (nach jedem Zeichnen und beim Ziehen) */
export function liveSync() {
	const an = liveAn();
	document.body.classList.toggle('live', an);
	if (!an) {
		if (huelle) huelle.style.display = 'none';
		return;
	}
	if (!karte) {
		starten();
		return;
	}
	const g = geo();
	// Breite aus dem Layout (nicht aus getBoundingClientRect – das enthält laufende Animationen)
	const pw = parseFloat(app.poster.style.width) || app.poster.getBoundingClientRect().width;
	if (!pw) return;
	const s = pw / g.W; // Bildschirm-Pixel je Poster-Punkt
	const k = (MW * s) / REF; // Skalierung REF → Bildschirm
	const h = (REF * g.MH) / MW;
	const st = /** @type {HTMLDivElement} */ (huelle).style;
	st.display = '';
	// Untergrund in der Papierfarbe des Stils – sonst blitzt am Rand der Kartenfläche ein heller Strich durch
	const fb = liveStil(app.S.karte && app.S.karte.stil).farben;
	st.background = fb ? fb.bg : '#ffffff';
	st.width = REF + 'px';
	st.height = h.toFixed(1) + 'px';
	st.left = (g.mx * s).toFixed(2) + 'px';
	st.top = (g.my * s).toFixed(2) + 'px';
	st.transform = `scale(${k.toFixed(5)})`;
	// gestochen scharf: Pixeldichte an die Bildschirmgröße anpassen (nur bei deutlicher Änderung)
	const sollPr = Math.min(3, Math.max(1, (window.devicePixelRatio || 1) * k));
	if (Math.abs(sollPr - pr) / pr > 0.12 && karte.setPixelRatio) {
		pr = sollPr;
		karte.setPixelRatio(pr);
	}
	const canvas = karte.getCanvas();
	if (Math.abs(canvas.clientWidth - REF) > 0.5 || Math.abs(canvas.clientHeight - h) > 0.5) karte.resize();
	// Stil, Höhenlinien oder Kartendetails geändert → neuen Stil setzen (MapLibre tauscht nur, was sich ändert)
	const o = karteOpt(),
		d = details();
	const sk = JSON.stringify([o, d]);
	if (sk !== stilKey) {
		stilKey = sk;
		stilJSON(o.stil, d, o.hoehen, karteLib)
			.then((st) => {
				if (karte && stilKey === sk) karte.setStyle(st);
			})
			.catch((e) => console.warn('Kartenstil', e));
	}
	const c = kamera();
	karte.jumpTo({ center: c.center, zoom: c.zoom });
	// für Tests/Fehlersuche: aktuelle Mitte und Zoomstufe
	/** @type {HTMLDivElement} */ (huelle).dataset.mitte = c.center.map((x) => x.toFixed(5)).join(',') + '@' + c.zoom.toFixed(2);
}

/* ---------- Karte für Druck, Download und Mockup ---------- */
/** @type {{ key: string, px: number, url: string } | null} */
let BILD = null;

function bildKey() {
	const S = app.S,
		v = S.view;
	return JSON.stringify([v.cx.toFixed(3), v.cy.toFixed(3), v.z.toFixed(5), v.a.toFixed(5), details(), karteOpt(), app.DATA.place]);
}

/** Zuletzt gerechnetes Kartenbild, falls es zur aktuellen Ansicht passt (für buildSVG(true)) */
export function karteBildAktuell() {
	return BILD && BILD.key === bildKey() ? BILD : null;
}

/**
 * Kartenfläche als Bild rechnen – in Stücken, damit auch Druckgrößen (bis 300 dpi) gehen.
 * @param {number} pxW gewünschte Breite der Kartenfläche in Bildpunkten
 * @returns {Promise<{ key: string, px: number, url: string }>}
 */
export function karteBild(pxW) {
	const key = bildKey();
	if (BILD && BILD.key === key && BILD.px >= pxW * 0.98) return Promise.resolve(BILD);
	// Läuft gerade eine passende Berechnung? Dann auf diese warten statt eine zweite zu starten
	if (JOB && JOB.key === key && JOB.px >= pxW * 0.98) return JOB.p;
	const p = rechnen(key, pxW);
	JOB = { key, px: pxW, p };
	p.finally(() => {
		if (JOB && JOB.p === p) JOB = null;
	}).catch(() => {});
	return p;
}
/** @type {{ key: string, px: number, p: Promise<{ key: string, px: number, url: string }> } | null} */
let JOB = null;

/** @param {string} key @param {number} pxW */
async function rechnen(key, pxW) {
	const lib = await loadMaplibre();
	const g = geo();
	const h = (REF * g.MH) / MW;
	const dichte = pxW / REF; // Pixeldichte gegenüber der Bezugsbreite
	const W = Math.round(REF * dichte),
		H = Math.round(h * dichte);
	// Stücke von höchstens ~3600 Bildpunkten (Grenze der Grafikkarten)
	const stueck = Math.max(64, Math.floor(3600 / dichte));
	const nx = Math.ceil(REF / stueck),
		ny = Math.ceil(h / stueck);
	const c = kamera();
	const welt = 512 * Math.pow(2, c.zoom);
	const P = app.DATA.proj,
		v = app.S.view;
	const mx = (v.cx / P.sc + P.x0) * welt,
		my = (v.cy / P.sc + P.y0) * welt; // Mitte in Welt-Pixeln (bei REF)
	const ziel = document.createElement('canvas');
	ziel.width = W;
	ziel.height = H;
	const zctx = /** @type {CanvasRenderingContext2D} */ (ziel.getContext('2d'));
	const div = document.createElement('div');
	div.style.cssText = `position:fixed;left:-30000px;top:0;width:${stueck}px;height:${stueck}px;pointer-events:none`;
	document.body.appendChild(div);
	/** @type {any} */
	let m = null;
	const o = karteOpt();
	try {
		m = new lib.Map({
			container: div,
			style: await stilJSON(o.stil, details(), o.hoehen, lib),
			center: c.center,
			zoom: c.zoom,
			interactive: false,
			attributionControl: false,
			fadeDuration: 0,
			pixelRatio: dichte,
			renderWorldCopies: false,
			maxCanvasSize: [4096, 4096],
			canvasContextAttributes: { preserveDrawingBuffer: true }
		});
		const fertig = () =>
			new Promise((ok, nein) => {
				const t = setTimeout(() => nein(new Error('Zeitüberschreitung beim Kartenrechnen')), 60000);
				m.once('idle', () => {
					clearTimeout(t);
					ok(undefined);
				});
			});
		await fertig();
		for (let j = 0; j < ny; j++)
			for (let i = 0; i < nx; i++) {
				// Mitte dieses Stücks in Welt-Pixeln → Längen-/Breitengrad
				const wx = mx - REF / 2 + (i + 0.5) * stueck,
					wy = my - h / 2 + (j + 0.5) * stueck;
				m.jumpTo({ center: mercInv(wx / welt, wy / welt), zoom: c.zoom });
				await fertig();
				const src = m.getCanvas();
				zctx.drawImage(src, 0, 0, src.width, src.height, Math.round(i * stueck * dichte), Math.round(j * stueck * dichte), src.width, src.height);
			}
		const url = ziel.toDataURL('image/jpeg', 0.92);
		BILD = { key, px: W, url };
		return BILD;
	} finally {
		try {
			m && m.remove();
		} catch {}
		div.remove();
		ziel.width = ziel.height = 1;
	}
}

/**
 * Vor jedem Export aufrufen: rechnet die Live-Karte in der nötigen Auflösung, damit buildSVG(true)
 * sie einsetzen kann. Im alten Editor ohne Wirkung.
 * @param {number} pxW Breite der Kartenfläche in Bildpunkten
 */
export async function karteFuerExport(pxW) {
	if (liveAn()) await karteBild(Math.max(400, Math.round(pxW)));
}

// Fehlersuche (Tests): passt das gerechnete Kartenbild zur Ansicht?
if (typeof window !== 'undefined') /** @type {any} */ (window).__liveDebug = () => ({ key: app.S && app.DATA ? bildKey() : '', bild: BILD && BILD.key, px: BILD && BILD.px, job: JOB && JOB.key, svgMitKarte: app.S && app.DATA ? buildSVG(true).includes('data:image/jpeg') : null });
