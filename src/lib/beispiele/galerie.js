// Beispiel-Galerie: auf der Startseite (öffnet das Beispiel mit Ort) und im Editor
// (übernimmt nur den Look für den eigenen Ort).
import { schriftenDa } from '../editor/basis.js';
import { asset } from '$app/paths';
import { app as appUntyped } from '../editor/app.js';
import { BEISPIELE } from './liste.js';
import { ORTE } from '../seo/orte.js';
import { change, newState } from '../editor/zustand.js';
import { alsBild, render, vorschauSVG } from '../editor/zeichnen.js';
import { loadBounds } from '../editor/laden.js';
import { loadDemo } from '../editor/beispiel.js';
import { placeBounds } from '../karte/ortswahl-start.js';
import { viewCenterLL } from '../editor/seitenleiste.js';
import { defaultSky, loadSky, skyLabel } from '../themen/himmel.js';
import { wolkeBeispiel } from '../themen/wolke.js';
import { PRESETS } from '../themen/vorlagen.js';
import { goStep, pickDesign, smooth } from '../editor/assistent.js';
import { msg } from '../editor/ansicht.js';
import { EASE, reducedMotion } from '../editor/animation.js';

/** @type {any} */
const app = appUntyped;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Titel in normale Schreibweise („SIEGRITZ“ → „Siegritz“) für Schreibschrift @param {string} t */
const normal = (t) => t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (/** @type {string} */ m, /** @type {string} */ a, /** @type {string} */ c) => a + c.toUpperCase());

/**
 * Neuer Zustand mit dem Look eines Beispiels – verändert nichts (auch für Vorschaubilder).
 * @param {import('./liste.js').Beispiel} B @param {any} keep bisheriger Zustand @param {boolean} mitOrt
 */
export function lookZustand(B, keep, mitOrt) {
	const [lon, lat] = viewCenterLL();
	/** @type {any} */
	const S = newState(B.preset, keep);
	S.mode = 'art';
	S.motif = B.motif || 'karte';
	if (S.multi) S.multi.on = false;
	pickDesign(S, B.design);
	S.fx = { ...(S.fx || {}), paper: false, vig: false, glow: false, ...(B.fx || {}) };
	S.info = { ...(S.info || {}), ...(B.info || {}) };
	S.hoehen = B.hoehen ? { ...(S.hoehen || {}), on: true } : S.hoehen ? { ...S.hoehen, on: false } : S.hoehen;
	if (B.motif === 'sterne') {
		S.sky = { ...defaultSky(lat, lon), ...(B.sky || {}) };
		S.note = { on: true, text: skyLabel(S.sky), auto: true };
	}
	if (B.motif === 'koord') S.koord = { lat: +lat.toFixed(5), lon: +lon.toFixed(5), text: (B.koord && B.koord.text) || '', align: (B.koord && B.koord.align) || 'links' };
	if (B.motif === 'wolke') {
		const ort = (app.DATA && app.DATA.place) || 'Heimat';
		S.wolke = { form: 'herz', schrift: true, ...(B.wolke || {}), ...(mitOrt ? {} : { text: wolkeBeispiel(ort, (app.DATA && app.DATA.region) || '') }) };
	}
	if (B.titelSchrift === 'SgSC' && S.title.font !== 'SgSC') {
		S.title.font = 'SgSC';
		S.sub.font = 'SgMD';
		S.title.text = normal(S.title.text || '');
		S.title.ls = 0;
		S.title.size = Math.round(S.title.size * 1.5);
	}
	if (mitOrt) {
		if (B.sub) S.sub.text = B.sub;
		if (B.note) S.note = { on: true, text: B.note };
		S.pins = B.pin ? [{ i: B.pin, x: +S.view.cx.toFixed(2), y: +S.view.cy.toFixed(2) }] : [];
		if (B.pinColor) S.pinColor = B.pinColor;
	}
	return S;
}

/**
 * Look eines Beispiels auf den aktuellen Zustand anwenden.
 * @param {import('./liste.js').Beispiel} B
 * @param {boolean} mitOrt true = von der Startseite geöffnet (Untertitel, Widmung, Markierung gehören dazu)
 */
export function lookAnwenden(B, mitOrt) {
	change(() => (app.S = lookZustand(B, app.S, mitOrt)));
	// Text-Motive messen die Schrift aus, der Himmel braucht seine Sterndaten → danach einmal neu zeichnen
	if (B.motif === 'sterne') loadSky().then(() => render());
	if (B.motif === 'koord' || B.motif === 'wolke' || B.titelSchrift) Promise.all(['SgXB', 'SgMD', 'SgSC', 'SgBR', 'SgBE'].map((f) => document.fonts.load('30px ' + f))).then(() => render());
}

/** Beispiel komplett öffnen (Startseite): Ort laden, danach Look anwenden (siehe wizardAfterLoad) @param {string} id */
export async function beispielOeffnen(id) {
	const B = BEISPIELE.find((b) => b.id === id);
	if (!B) return;
	app.beispielPending = id;
	if (B.ort === 'demo') return loadDemo(true);
	const o = ORTE.find((x) => x.slug === B.ort);
	if (!o) return;
	/** @type {any} */ (window)._place = { name: o.name, region: o.fs ? 'Fränkische Schweiz' : o.landkreis || o.bezirk, lon: o.lon, lat: o.lat };
	await loadBounds(placeBounds({ osm_value: o.typ === 'dorf' ? 'village' : 'town' }, o.lon, o.lat, 0.8805, B.breite), { center: [o.lon, o.lat] });
}

/** Wird nach dem Laden eines Orts gerufen – true, wenn ein Beispiel angewendet wurde */
export function beispielNachLaden() {
	const id = app.beispielPending;
	if (!id) return false;
	app.beispielPending = '';
	const B = BEISPIELE.find((b) => b.id === id);
	if (!B) return false;
	lookAnwenden(B, true);
	goStep('stil', false);
	msg(`Beispiel „${B.titel}“ – alles lässt sich anpassen`, 'ok');
	return true;
}

/** Eine Karte der Galerie @param {import('./liste.js').Beispiel} B */
function karte(B) {
	const P = /** @type {Record<string, any>} */ (PRESETS)[B.preset];
	const farbe = P && P.bg && P.bg !== 'none' ? P.bg : '#ffffff';
	const bild = asset(/** @type {any} */ (`beispiele/${B.id}.webp`));
	const ort = B.ort === 'demo' ? 'Siegritz' : (ORTE.find((o) => o.slug === B.ort) || { name: '' }).name;
	return `<button type="button" class="bsp" data-id="${B.id}" title="${esc(B.text)}"><span class="bsp-img" style="background:${farbe}"><img src="${bild}" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span><b>${esc(B.titel)}</b><small>${esc(ort)}</small></button>`;
}

function overlayAuf() {
	const o = $('bspOverlay');
	o.hidden = false;
	if (!reducedMotion()) /** @type {HTMLElement} */ (o.firstElementChild).animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
	/** @type {HTMLElement} */ ($('bspClose')).focus();
}
function overlayZu() {
	$('bspOverlay').hidden = true;
}

export function initGalerie() {
	// Startseite: Beispiel mit Ort öffnen
	$('bspStrip').innerHTML = BEISPIELE.map(karte).join('');
	$('bspStrip').addEventListener('click', (e) => {
		const b = /** @type {HTMLElement} */ (e.target).closest('[data-id]');
		if (b) beispielOeffnen(/** @type {string} */ (/** @type {HTMLElement} */ (b).dataset.id));
	});
	// Editor: nur den Look übernehmen
	$('bspGrid').innerHTML = BEISPIELE.map(karte).join('');
	$('bspGrid').addEventListener('click', (e) => {
		const b = /** @type {HTMLElement} */ (e.target).closest('[data-id]');
		if (!b) return;
		const B = BEISPIELE.find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.id);
		if (!B) return;
		overlayZu();
		smooth(() => lookAnwenden(B, false));
		msg(`Look „${B.titel}“ für deinen Ort übernommen`, 'ok');
	});
	document.querySelectorAll('[data-bsp-open]').forEach((b) => /** @type {HTMLElement} */ (b).addEventListener('click', overlayAuf));
	$('bspClose').onclick = overlayZu;
	$('bspOverlay').addEventListener('click', (e) => {
		if (e.target === $('bspOverlay')) overlayZu();
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !$('bspOverlay').hidden) overlayZu();
	});
}
