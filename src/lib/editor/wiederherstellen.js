// Gemerkten oder geteilten Entwurf wieder öffnen.
import { app as appUntyped } from './app.js';
import { CLS } from './basis.js';
import { PRESETS } from '../themen/vorlagen.js';
import { DESIGNS } from '../themen/designs.js';
import { loadBounds } from './laden.js';
import { loadDemo } from './beispiel.js';
import { clampView, updUndo } from './zustand.js';
import { render } from './zeichnen.js';
import { goStep } from './assistent.js';
import { ensureRaster } from '../karte/raster.js';
import { ago, draftFromHash, savedDraft } from './entwurf.js';
import { msg } from './ansicht.js';
import { showGift } from '../shop/geschenk.js';
import { ORTE } from '../seo/orte.js';
import { placeBounds } from '../karte/ortswahl-start.js';
import { loadBounds as ladeBereich } from './laden.js';
import { ANLAESSE } from '../themen/anlaesse.js';

/** @type {any} */
const app = appUntyped;
/** @type {Record<string, any>} */
const P = PRESETS;

/** @param {import('./entwurf.js').Draft} d */
export async function restoreDraft(d) {
	const S = d.S;
	if (!P[S.preset]) S.preset = 'umriss';
	if (S.design && !(/** @type {Record<string, any>} */ (DESIGNS))[S.design]) S.design = 'poster';
	const base = P[S.preset];
	Object.keys(CLS).forEach((k) => {
		if (!S.cls[k]) S.cls[k] = JSON.parse(JSON.stringify(base.cls[k]));
	});
	if (d.demo) await loadDemo(true);
	else {
		/** @type {any} */ (window)._place = d.place || { name: 'Mein Ort', region: '' };
		const c = d.place && Number.isFinite(d.place.lon) ? [d.place.lon, d.place.lat] : undefined;
		if (!(await loadBounds(d.b, { center: c }))) return false;
	}
	app.S = S;
	clampView(app.S.view);
	app.undoS = [];
	app.redoS = [];
	updUndo();
	render();
	if (d.step && d.step !== 'ort') goStep(d.step, false);
	if (S.mode === 'std') ensureRaster();
	if (S.motif === 'koord') document.fonts.load('40px SgXB').then(() => render());
	return true;
}

/** Beim Start: Link-Entwurf sofort öffnen, sonst „Weiter mit deinem Entwurf“ anbieten. */
/**
 * Direkter Einstieg von den Orts-Seiten: …/#ort=bamberg (optional &anlass=hochzeit)
 * öffnet sofort das fertige Poster – ohne Suche.
 */
async function ortAusLink() {
	if (!location.hash.startsWith('#ort=')) return false;
	const q = new URLSearchParams(location.hash.slice(1));
	history.replaceState(null, '', location.pathname + location.search);
	const o = ORTE.find((x) => x.slug === q.get('ort'));
	if (!o) return false;
	const anlass = q.get('anlass') || '';
	if (anlass && /** @type {Record<string, any>} */ (ANLAESSE)[anlass]) app.occasionPending = anlass;
	// Untertitel: Fränkische Schweiz, sonst Landkreis bzw. Regierungsbezirk
	/** @type {any} */ (window)._place = { name: o.name, region: o.fs ? 'Fränkische Schweiz' : o.landkreis || o.bezirk, lon: o.lon, lat: o.lat };
	const p = { osm_value: o.typ === 'dorf' ? 'village' : 'town' };
	return ladeBereich(placeBounds(p, o.lon, o.lat, 0.8805), { center: [o.lon, o.lat] });
}

export async function initRestore() {
	if (await ortAusLink()) return;
	const shared = await draftFromHash();
	if (location.hash.startsWith('#e=')) history.replaceState(null, '', location.pathname + location.search);
	if (shared) {
		if (await restoreDraft(shared)) {
			if (shared.gift) showGift(shared.gift);
			else msg('Geteilter Entwurf geöffnet', 'ok');
		}
		return;
	}
	const d = savedDraft();
	const btn = document.getElementById('resumeBtn');
	if (!d || !btn) return;
	const name = (d.place && d.place.name) || (d.demo ? 'Siegritz' : 'Mein Ort');
	/** @type {HTMLElement} */ (btn.querySelector('b')).textContent = `Weiter mit „${name}“`;
	/** @type {HTMLElement} */ (btn.querySelector('small')).textContent = `Dein Entwurf von ${ago(d.t || Date.now())} ist noch da`;
	btn.classList.remove('hidden');
	btn.onclick = async () => {
		btn.setAttribute('disabled', '');
		await restoreDraft(d);
		btn.removeAttribute('disabled');
	};
}
