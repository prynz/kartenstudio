// Bereich „Stil“ im neuen Editor: Kartenstile der Live-Karte (Gezeichnet / Landkarte) + Höhenlinien.
// Vorschaubilder sind feste Bilder (static/vorschau/live/<id>.webp, erzeugt mit tests/vorschaubilder-live.mjs).
import { asset } from '$app/paths';
import { app as appUntyped } from './app.js';
import { $ } from './basis.js';
import { change } from './zustand.js';
import { LIVE_STILE, inBayern, liveStil } from '../karte/live-stile.js';
import { stilSetzen } from './neu.js';

/** @type {any} */
const app = appUntyped;

/** @param {string} id */
const bild = (id) => asset(/** @type {any} */ (`vorschau/live/${id}.webp`));

/** Luftbild nur in Bayern */
function luftbildOk() {
	const c = app.DATA && app.DATA.center;
	return !!c && inBayern(c[0], c[1]);
}

/**
 * Bedienung verbinden.
 * @param {(fn: () => void) => void} smooth weiche Überblendung
 */
export function initStilNeu(smooth) {
	for (const [art, ziel] of /** @type {const} */ ([
		['gezeichnet', 'nsGez'],
		['landkarte', 'nsLand']
	])) {
		/** @type {HTMLElement} */ ($(ziel)).innerHTML = LIVE_STILE.filter((s) => s.art === art)
			.map((s) => `<button type="button" class="wz-card" role="radio" data-ls="${s.id}" title="${s.desc}"><span class="th"><img src="${bild(s.id)}" alt="" loading="lazy" decoding="async"></span><span class="nm">${s.name}</span></button>`)
			.join('');
	}
	document.querySelectorAll('#nsBox [data-ls]').forEach((b) => {
		const el = /** @type {HTMLButtonElement} */ (b);
		el.onclick = () => {
			const id = /** @type {string} */ (el.dataset.ls);
			if (el.getAttribute('aria-disabled') === 'true' || !app.S) return;
			if (app.S.karte && app.S.karte.stil === id) return;
			// Knopf sofort markieren, Karte folgt
			document.querySelectorAll('#nsBox [data-ls]').forEach((x) => x.classList.toggle('on', x === el));
			smooth(() => change(() => stilSetzen(app.S, id)));
		};
	});
	const h = /** @type {HTMLInputElement} */ ($('nsHoehen'));
	h.onchange = () => change(() => (app.S.karte = { ...(app.S.karte || {}), hoehen: h.checked }));
}

/** Anzeige mit dem Zustand abgleichen */
export function syncStilNeu() {
	const S = app.S;
	if (!S) return;
	const akt = liveStil(S.karte && S.karte.stil).id;
	const lb = luftbildOk();
	document.querySelectorAll('#nsBox [data-ls]').forEach((b) => {
		const el = /** @type {HTMLButtonElement} */ (b);
		const on = el.dataset.ls === akt;
		el.classList.toggle('on', on);
		el.setAttribute('aria-checked', String(on));
		if (el.dataset.ls === 'luftbild') {
			el.setAttribute('aria-disabled', String(!lb));
			el.title = lb ? 'Amtliches Luftbild (40 cm) – Bayerische Vermessungsverwaltung' : 'Luftbilder gibt es bisher nur für Orte in Bayern';
		}
	});
	/** @type {HTMLInputElement} */ ($('nsHoehen')).checked = !!(S.karte && S.karte.hoehen);
}
