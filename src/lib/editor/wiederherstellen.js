// Gemerkten oder geteilten Entwurf wieder öffnen.
import { app as appUntyped } from './app.js';
import { CLS } from './basis.js';
import { PRESETS } from '../themen/vorlagen.js';
import { DESIGNS } from '../themen/designs.js';
import { loadBounds, renderThumbs } from './laden.js';
import { loadDemo } from './beispiel.js';
import { clampView, updUndo } from './zustand.js';
import { render } from './zeichnen.js';
import { goStep } from './assistent.js';
import { ensureRaster } from '../karte/raster.js';
import { ago, draftFromHash, savedDraft } from './entwurf.js';
import { msg } from './ansicht.js';

/** @type {any} */
const app = appUntyped;
/** @type {Record<string, any>} */
const P = PRESETS;

/** @param {import('./entwurf.js').Draft} d */
export async function restoreDraft(d) {
	const S = d.S;
	if (!P[S.preset]) S.preset = 'umriss';
	if (S.design && !(/** @type {Record<string, any>} */ (DESIGNS))[S.design]) S.design = 'siegritz';
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
	renderThumbs();
	if (d.step && d.step !== 'ort') goStep(d.step, false);
	if (S.mode === 'std') ensureRaster();
	return true;
}

/** Beim Start: Link-Entwurf sofort öffnen, sonst „Weiter mit deinem Entwurf“ anbieten. */
export async function initRestore() {
	const shared = await draftFromHash();
	if (location.hash.startsWith('#e=')) history.replaceState(null, '', location.pathname + location.search);
	if (shared) {
		if (await restoreDraft(shared)) msg('Geteilter Entwurf geöffnet', 'ok');
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
