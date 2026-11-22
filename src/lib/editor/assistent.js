// Geführter Ablauf („Assistent“): Ort → Ausschnitt → Stil → Design → Text → Fertig.
// Es ist immer nur ein Schritt sichtbar. Alle Detailregler aus dem Prototyp
// bleiben unter „Erweiterte Einstellungen“ erreichbar.
import { app as appUntyped } from './app.js';
import { buildSVG, render } from './zeichnen.js';
import { begin, change, clampView, commit, newState } from './zustand.js';
import { openSec } from './seitenleiste.js';
import { setTool } from './bedienung.js';
import { dotsHTML } from './seitenleiste.js';
import { PRESETS as PRESETS_UNTYPED } from '../themen/vorlagen.js';
import { BASES, inBayern } from '../themen/standard.js';
import { DESIGNS, applyDesign } from '../themen/designs.js';
import { ensureRaster } from '../karte/raster.js';
import { attachSearch } from '../karte/suche.js';
import { pickPlace } from '../karte/ortswahl-start.js';
import { openPicker } from '../karte/ortswahl.js';
import { EASE, reducedMotion } from './animation.js';
import { revealSection } from './sheet.js';
import { FRAMES, PRODUCTS, ROOMS, SHIRTS, WALLS, product, renderMockup, scheduleMockup } from './mockup.js';
import { msg, zoom } from './ansicht.js';
import { SIZES, fitPrint, paperOrFree, quality, exportDpi } from './druck.js';
import { PIN_SHAPES } from './zeichnen.js';
import { shareLink } from './entwurf.js';
import { ANLAESSE } from '../themen/anlaesse.js';
import { initMulti, syncMulti } from './mehrere.js';
import { initRoute, syncRoute } from './route.js';
import { preis } from '../shop/preise.js';
import { initGift } from '../shop/geschenk.js';
import { SKY_THEMES, defaultSky, loadSky, skyLabel } from '../themen/himmel.js';
import { viewCenterLL } from './seitenleiste.js';
import { esc } from './basis.js';
import { saveDraftSoon } from './entwurf.js';

// Der übernommene Zustand ist noch untypisiert (siehe @ts-nocheck in den Prototyp-Modulen).
/** @type {any} */
const app = appUntyped;
/** @type {Record<string, any>} */
const PRESETS = PRESETS_UNTYPED;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

export const STEPS = ['ort', 'ausschnitt', 'stil', 'design', 'text', 'produkt', 'fertig'];
/** Welcher Abschnitt der erweiterten Einstellungen passt zu welchem Schritt */
/** @type {Record<string,string>} */
const LABEL = { ort: 'Ort', ausschnitt: 'Ausschnitt', stil: 'Stil', design: 'Design', text: 'Text', produkt: 'Produkt', fertig: 'Fertig' };
/** @type {Record<string,string>} */
const ADV_FOR = { ort: 'ausschnitt', ausschnitt: 'ausschnitt', stil: 'stil', design: 'rahmen', text: 'text', produkt: 'rahmen', fertig: 'farben' };

let step = 'stil';
let advOpen = false;

const wizOn = () => !advOpen;
/** @param {string} sel */
const all = (sel) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(sel)]);

/**
 * Zu einem Schritt wechseln.
 * @param {string} next
 * @param {boolean} [animate]
 */
export function goStep(next, animate = true) {
	if (!STEPS.includes(next)) return;
	const dir = STEPS.indexOf(next) - STEPS.indexOf(step);
	step = next;
	app.wizStep = next;
	saveDraftSoon();
	all('.wz-pane').forEach((p) => p.classList.toggle('on', p.dataset.step === next));
	const idx = STEPS.indexOf(next);
	all('#wzSteps button').forEach((b, i) => {
		b.classList.toggle('on', i === idx);
		b.classList.toggle('done', i < idx);
		b.setAttribute('aria-current', i === idx ? 'step' : 'false');
	});
	/** @type {HTMLButtonElement} */ ($('wzBack')).disabled = idx === 0;
	$('wzNext').classList.toggle('hidden', idx === STEPS.length - 1);
	$('wzNextLabel').textContent = idx < STEPS.length - 1 ? LABEL[STEPS[idx + 1]] : '';
	const pane = document.querySelector(`.wz-pane[data-step="${next}"]`);
	if (animate && dir && pane && !reducedMotion()) {
		pane.animate(
			[
				{ opacity: 0, transform: `translateX(${dir > 0 ? 28 : -28}px)` },
				{ opacity: 1, transform: 'none' }
			],
			{ duration: 280, easing: EASE }
		);
	}
	const side = $('side');
	if (side) side.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
	if (next === 'design') scheduleDesignThumbs(0);
	setMockup(next === 'produkt' && !advOpen);
	syncWizard();
}

/** Produktauswahl ändern (mit Rückgängig). @param {Record<string, any>} patch */
function setProduct(patch) {
	change(() => (app.S.product = { ...product(app.S), ...patch }));
}

/** Mockup-Ansicht im Vorschaubereich ein-/ausblenden. @param {boolean} on */
function setMockup(on) {
	const was = document.body.classList.contains('mk-on');
	document.body.classList.toggle('mk-on', on);
	if (on && !was) {
		renderMockup();
		const m = document.getElementById('mockup');
		if (m && !reducedMotion()) m.animate([{ opacity: 0, transform: 'scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE });
	}
	if (on !== was) zoom();
}

/** Auswahlzustand der Produkt-Bedienelemente abgleichen */
function syncProduct() {
	const P = product(app.S);
	all('#wzProd button').forEach((b) => b.classList.toggle('on', b.dataset.t === P.type));
	all('.mk-swatch').forEach((b) => b.classList.toggle('on', P[/** @type {string} */ (b.dataset.key)] === b.dataset.k));
	all('.mk-opt').forEach((o) => o.classList.toggle('hidden', !(o.dataset.for || '').split(' ').includes(P.type)));
	/** @type {HTMLInputElement} */ ($('mkMat')).checked = !!P.mat;
	/** @type {HTMLInputElement} */ ($('mkModel')).checked = !!P.model;
	const pr = preis(P, app.S.print);
	$('priceVal').textContent = pr.text;
	$('priceDet').textContent = pr.details.join(' · ');
	$('orderLabel').textContent = `Bestellen · ${pr.text}`;
}

/** Assistent ↔ erweiterte Einstellungen umschalten. @param {boolean} on */
function showAdvanced(on) {
	advOpen = on;
	setMockup(!on && step === 'produkt');
	$('wiz').classList.toggle('hidden', on);
	$('adv').classList.toggle('hidden', !on);
	document.body.classList.toggle('wiz-on', !on);
	// Im Assistenten lässt sich die Karte direkt im Poster verschieben; Auswählen gibt es in den erweiterten Einstellungen
	setTool(on ? 'sel' : 'move');
	if (on) {
		openSec(ADV_FOR[step] || 'stil');
		$('side').scrollTo({ top: 0 });
	}
	const box = on ? $('adv') : $('wiz');
	if (!reducedMotion()) box.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE });
	if (app.DATA) render();
}

/* ---------- Vorschaubilder der Designs ---------- */
let thumbTimer = 0;
let thumbKey = '';
/** @type {string[]} */
let thumbUrls = [];
/** @param {number} delay */
function scheduleDesignThumbs(delay = 350) {
	clearTimeout(thumbTimer);
	thumbTimer = window.setTimeout(renderDesignThumbs, delay);
}
function renderDesignThumbs() {
	if (!app.DATA || !app.S || step !== 'design' || advOpen) return;
	const S = app.S;
	const key = JSON.stringify([S.preset, S.cls, S.ov, S.bg, S.mode, S.base, S.labels, S.view, S.title.text, S.sub.text, S.title.font, S.sub.font, S.scale]);
	if (key === thumbKey) return;
	thumbKey = key;
	const keep = app.S;
	const urls = [];
	try {
		for (const b of all('#wzDesigns button[data-d]')) {
			const k = /** @type {string} */ (b.dataset.d);
			const c = JSON.parse(JSON.stringify(keep));
			applyDesign(c, k, PRESETS[c.preset], true);
			const D = DESIGNS[k];
			if (D.aspect) c.view.a = D.aspect;
			else if (keep.design && DESIGNS[keep.design] && DESIGNS[keep.design].aspect && keep.aPrev) c.view.a = keep.aPrev;
			app.S = c;
			fitPrint(c);
			clampView(c.view);
			const url = URL.createObjectURL(new Blob([buildSVG(true)], { type: 'image/svg+xml' }));
			urls.push(url);
			const img = /** @type {HTMLImageElement} */ (b.querySelector('img'));
			img.src = url;
		}
	} finally {
		app.S = keep;
	}
	thumbUrls.forEach((u) => URL.revokeObjectURL(u));
	thumbUrls = urls;
}

/* ---------- Anzeige mit dem Zustand abgleichen ---------- */
export function syncWizard() {
	const S = app.S;
	if (!S) return;
	const sky = S.motif === 'sterne';
	const std = S.mode === 'std' && !sky;
	all('#wzMode button').forEach((b) => b.classList.toggle('on', sky ? b.dataset.m === 'sterne' : b.dataset.m === S.mode));
	$('wzStyles').classList.toggle('hidden', std || sky);
	$('wzBases').classList.toggle('hidden', !std);
	$('wzSky').classList.toggle('hidden', !sky);
	$('wzHoehe').classList.toggle('hidden', std || sky);
	const ho = !!(S.hoehen && S.hoehen.on);
	/** @type {HTMLInputElement} */ ($('hoehenOn')).checked = ho;
	const C = app.DATA && app.DATA._contours;
	$('hoehenInfo').textContent = !ho ? 'Zeigt das Gelände als feine Linien – besonders schön in hügeligen Orten.' : C ? (C.max - C.min < 12 ? `Hier ist es recht flach (${C.min}–${C.max} m) – kaum Linien.` : `Höhe ${C.min}–${C.max} m, eine Linie alle ${C.interval} m.`) : 'Höhendaten werden geladen …';
	if (sky && S.sky) syncSky(S.sky);
	all('#wzStyles button').forEach((b) => b.classList.toggle('on', !std && b.dataset.p === S.preset));
	all('#wzBases button').forEach((b) => b.classList.toggle('on', std && b.dataset.b === S.base));
	// Luftbilder gibt es bisher nur für Bayern
	if (app.DATA) {
		const [lon, lat] = viewCenterLL();
		const ok = inBayern(lon, lat);
		all('[data-b="satellit"]').forEach((b) => {
			/** @type {HTMLButtonElement} */ (b).disabled = !ok;
			b.title = ok ? 'Amtliches Luftbild (40 cm) – Bayerische Vermessungsverwaltung' : 'Luftbilder gibt es bisher nur für Orte in Bayern';
		});
	}
	all('#wzDesigns button').forEach((b) => b.classList.toggle('on', b.dataset.d === (S.design || 'siegritz')));
	all('#wzFmt button').forEach((b) => b.classList.toggle('on', Math.abs(+(b.dataset.a || 0) - S.view.a) < 0.01));
	const t = /** @type {HTMLInputElement} */ ($('wzTitle')),
		u = /** @type {HTMLInputElement} */ ($('wzSub'));
	if (document.activeElement !== t) t.value = S.title.text;
	if (document.activeElement !== u) u.value = S.sub.text;
	/** @type {HTMLInputElement} */ ($('wzCoords')).checked = !!(S.lay && S.lay.coords);
	if (app.DATA) {
		$('wzPlace').textContent = app.DATA.place || 'Mein Ort';
		$('wzPlaceInfo').textContent = app.DATA.region || '';
	}
	const pr = S.print;
	all('[data-sizes] button').forEach((b) => b.classList.toggle('on', pr ? b.dataset.k === pr.k : b.dataset.k === 'frei'));
	all('[data-quer]').forEach((q) => {
		const i = /** @type {HTMLInputElement} */ (q);
		i.checked = !!(pr && pr.q);
		i.disabled = !pr || /** @type {any} */ (SIZES)[pr.k].w === /** @type {any} */ (SIZES)[pr.k].h;
		/** @type {HTMLElement} */ (i.closest('label')).classList.toggle('dis', i.disabled);
	});
	$('wzFree').classList.toggle('hidden', !!pr);
	const n = /** @type {HTMLInputElement} */ ($('wzNote'));
	if (document.activeElement !== n) n.value = (S.note && S.note.text) || '';
	syncPins();
	syncMulti();
	syncRoute();
	/** @type {HTMLInputElement} */ ($('fxPaper')).checked = !!(S.fx && S.fx.paper);
	/** @type {HTMLInputElement} */ ($('fxVig')).checked = !!(S.fx && S.fx.vig);
	all('[data-occ] button').forEach((b) => b.classList.toggle('on', b.dataset.k === S.occasion));
	if (step === 'design') scheduleDesignThumbs();
	if (step === 'fertig') syncFinish();
	syncProduct();
	if (step === 'produkt') scheduleMockup();
}

/** Nach dem Laden eines Orts: im Assistenten beim Stil weitermachen. */
export function wizardAfterLoad() {
	thumbKey = '';
	// Neuer Ort: Himmel über dem neuen Ort berechnen
	if (app.S && app.S.sky) {
		const [lon, lat] = viewCenterLL();
		app.S.sky = { ...app.S.sky, lat: +lat.toFixed(4), lon: +lon.toFixed(4) };
	}
	setTool(advOpen ? 'sel' : 'move');
	// Anlass vor der Suche gewählt → jetzt anwenden und direkt zum Text (Datum eintragen)
	if (app.occasionPending) {
		const k = app.occasionPending;
		app.occasionPending = '';
		applyOccasion(k, false);
		if (!advOpen) goStep(ANLAESSE[k].note ? 'text' : 'stil', false);
		return;
	}
	if (!advOpen) goStep('stil', false);
}

/**
 * Anlass-Vorlage anwenden: Stil, Design, Markierung in der Mitte, Widmung.
 * @param {string} k @param {boolean} [anim]
 */
export function applyOccasion(k, anim = true) {
	const A = ANLAESSE[k];
	if (!A || !app.S) return;
	const run = () =>
		change(() => {
			const keep = app.S;
			app.S = newState(PRESETS[A.preset] ? A.preset : 'umriss', keep);
			app.S.mode = 'art';
			pickDesign(app.S, A.design);
			app.S.note = { on: true, text: A.note };
			app.S.pins = A.pin ? [{ i: A.pin, x: +app.S.view.cx.toFixed(2), y: +app.S.view.cy.toFixed(2) }] : [];
			app.S.pinColor = A.pinColor;
			app.S.fx = { paper: false, vig: false, ...(A.fx || {}) };
			if (A.bg) app.S.bg = A.bg;
			app.S.occasion = k;
		});
	anim ? smooth(run) : run();
	syncOccasion();
	if (A.pin) msg(`Vorlage „${A.name}“ – Markierung im Poster an die richtige Stelle ziehen`, 'ok');
	else msg(`Vorlage „${A.name}“ angewendet`, 'ok');
}

/* ---------- Sternenhimmel ---------- */
/** Motiv „Sternenhimmel“ einschalten: Ort/Zeit setzen, runde Form, Datum als Widmung */
export function enableSky() {
	loadSky();
	smooth(() =>
		change(() => {
			const S = app.S;
			S.motif = 'sterne';
			const [lon, lat] = viewCenterLL();
			if (!S.sky) S.sky = defaultSky(lat, lon);
			const D = /** @type {any} */ (DESIGNS)[S.design || 'siegritz'];
			if (!D || !D.aspect) pickDesign(S, 'kreiskoord');
			if (!S.note || !S.note.text || S.note.auto) S.note = { on: true, text: skyLabel(S.sky), auto: true };
		})
	);
}
/** @param {Record<string, any>} patch */
function setSky(patch) {
	change(() => {
		const S = app.S;
		S.sky = { ...S.sky, ...patch };
		if (S.note && S.note.auto) S.note.text = skyLabel(S.sky);
	});
}
/** @param {any} sky */
function syncSky(sky) {
	const d = /** @type {HTMLInputElement} */ ($('skyDate')),
		t = /** @type {HTMLInputElement} */ ($('skyTime'));
	if (document.activeElement !== d) d.value = sky.date;
	if (document.activeElement !== t) t.value = `${String(Math.floor(sky.min / 60)).padStart(2, '0')}:${String(sky.min % 60).padStart(2, '0')}`;
	all('.sky-sw').forEach((b) => b.classList.toggle('on', b.dataset.k === sky.theme));
	/** @type {[string,string,boolean][]} */ ([
		['skyLines', 'lines', true],
		['skyNames', 'names', false],
		['skyMw', 'mw', true],
		['skyGrid', 'grid', false],
		['skyReal', 'real', false]
	]).forEach(([id, k, def]) => (/** @type {HTMLInputElement} */ ($(id)).checked = sky[k] ?? def));
	$('skyPlace').textContent = (app.DATA && app.DATA.place) || 'deinem Ort';
}

/** Auswahlzustand der Anlass-Knöpfe (Startseite + Assistent) */
function syncOccasion() {
	const cur = app.DATA ? app.S && app.S.occasion : app.occasionPending;
	all('[data-occ] button').forEach((b) => b.classList.toggle('on', b.dataset.k === cur));
	const A = ANLAESSE[app.occasionPending || ''];
	const lq = /** @type {HTMLInputElement|null} */ (document.getElementById('lq'));
	if (lq) lq.placeholder = A ? A.ask : 'Dorf, Stadt oder Adresse, z. B. Siegritz';
}

/**
 * Wird aufgerufen, wenn im Poster etwas angeklickt wurde, das einen Abschnitt öffnen will.
 * Im Assistenten: Text → Schritt „Text“, alles andere → erweiterte Einstellungen.
 * @param {string} name
 */
export function wizardOpenSec(name) {
	if (!wizOn()) return false;
	if (name === 'text') {
		goStep('text');
		return true;
	}
	showAdvanced(true);
	return false;
}

/**
 * Design auf den Zustand anwenden. Formen wie Kreis/Herz brauchen ein festes
 * Seitenverhältnis; beim Verlassen wird das vorige wiederhergestellt.
 * @param {any} S @param {string} k
 */
export function pickDesign(S, k) {
	const D = /** @type {any} */ (DESIGNS)[k];
	const wasFixed = !!(S.design && /** @type {any} */ (DESIGNS)[S.design] && /** @type {any} */ (DESIGNS)[S.design].aspect);
	applyDesign(S, k, PRESETS[S.preset], true);
	if (D.aspect) {
		if (!wasFixed) S.aPrev = S.view.a;
		S.view.a = D.aspect;
	} else if (wasFixed && S.aPrev) S.view.a = S.aPrev;
	fitPrint(S);
	clampView(S.view);
}

/**
 * Weicher Überblendeffekt für große Änderungen (Stil, Design, Zufall).
 * Nutzt die View-Transition-Technik des Browsers, sonst einfaches Einblenden.
 * @param {() => void} fn
 */
export function smooth(fn) {
	const d = /** @type {any} */ (document);
	if (reducedMotion()) return fn();
	if (d.startViewTransition) {
		d.startViewTransition(fn);
		return;
	}
	fn();
	app.poster.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 260, easing: EASE });
}

/** Zufällige, aber stimmige Kombination aus Stil und Design */
export function surprise() {
	const S = app.S;
	if (!S) return;
	const pick = (/** @type {string[]} */ arr, /** @type {string} */ not) => {
		const a = arr.filter((x) => x !== not);
		return a[Math.floor(Math.random() * a.length)];
	};
	const pk = pick(Object.keys(PRESETS), S.preset);
	const dk = pick(Object.keys(DESIGNS), S.design || 'siegritz');
	smooth(() =>
		change(() => {
			app.S = newState(pk, S);
			app.S.mode = 'art';
			pickDesign(app.S, dk);
		})
	);
	msg(`Überraschung: ${PRESETS[pk].name} · ${/** @type {any} */ (DESIGNS)[dk].name}`, 'ok');
}

/** Pins-Liste und Farbwahl abgleichen */
function syncPins() {
	const S = app.S;
	const pins = S.pins || [];
	const box = $('wzPins');
	const html = pins
		.map((/** @type {any} */ p, /** @type {number} */ i) => `<span class="wz-pin"><svg viewBox="-20 -34 40 50" width="16" height="16"><path d="${(/** @type {any} */ (PIN_SHAPES)[p.i] || PIN_SHAPES.herz).d}" fill="${esc(S.pinColor || '#d64545')}" fill-rule="evenodd"/></svg>${i + 1}<button type="button" data-rm="${i}" aria-label="Markierung ${i + 1} entfernen">✕</button></span>`)
		.join('');
	if (box.dataset.h !== html) {
		box.innerHTML = html;
		box.dataset.h = html;
		all('#wzPins [data-rm]').forEach((b) => (b.onclick = () => change(() => app.S.pins.splice(+(b.dataset.rm || 0), 1))));
	}
	$('wzPins').classList.toggle('hidden', !pins.length);
	$('wzPinCol').classList.toggle('hidden', !pins.length);
	all('.wz-pc').forEach((b) => b.classList.toggle('on', b.dataset.c === (S.pinColor || '#d64545')));
}

/** Schritt „Fertig“: Qualitäts-Ampel und PDF-Infos */
let qaKey = '';
function syncFinish() {
	const S = app.S;
	const key = JSON.stringify([S.print, S.cls, S.scale, S.mode, S.base, S.view, S.frame, S.lay, S.title.size, S.attr]);
	if (key === qaKey) return;
	qaKey = key;
	const q = quality();
	const P = paperOrFree(S);
	const head = { ok: 'Druckqualität: sehr gut', warn: 'Druckqualität: mit Hinweisen', bad: 'Druckqualität: bitte prüfen' }[q.level];
	$('wzQa').className = 'qa qa-' + q.level;
	$('wzQa').innerHTML = `<b><i></i>${head}</b><span class="qa-size">${S.print ? P.name : 'Freies Format'} · ${String(P.w).replace('.', ',')} × ${String(P.h).replace('.', ',')} cm</span><ul>${q.items.map((i) => `<li class="qa-${i.level}">${esc(i.text)}</li>`).join('')}</ul>`;
	$('wzPdfInfo').textContent = `${P.name === 'frei' ? 'freies Format' : P.name} · ${exportDpi(P)} dpi · mit 3 mm Beschnitt`;
}

/** @param {HTMLButtonElement} b @param {string} html */
function card(b, html) {
	b.type = 'button';
	b.className = 'wz-card';
	b.innerHTML = html;
	return b;
}

export function initWizard() {
	// Schritte
	all('#wzSteps button').forEach((b) => (b.onclick = () => goStep(/** @type {string} */ (b.dataset.step))));
	$('wzBack').onclick = () => goStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
	$('wzNext').onclick = () => goStep(STEPS[Math.min(STEPS.length - 1, STEPS.indexOf(step) + 1)]);
	$('wzAdv').onclick = () => showAdvanced(true);
	$('advBack').onclick = () => showAdvanced(false);
	all('[data-dice]').forEach((b) => (b.onclick = surprise));
	$('wzPick').onclick = () => openPicker(false);

	// 1 Ort
	attachSearch('wq', 'wgo', 'wresults', pickPlace);

	// 2 Ausschnitt
	all('#wzFmt button').forEach(
		(b) =>
			(b.onclick = () =>
				change(() => {
					app.S.view.a = +(b.dataset.a || 1);
					clampView(app.S.view);
				}))
	);
	$('wzZIn').onclick = () => $('zIn').click();
	$('wzZOut').onclick = () => $('zOut').click();
	$('wzReset').onclick = () => $('vReset').click();

	// 3 Stil
	Object.entries(PRESETS).forEach(([k, p]) => {
		const b = card(document.createElement('button'), `<div class="th" style="background:${p.bg === 'none' ? '#fff' : p.bg}"></div><span class="nm">${p.name}</span>`);
		b.dataset.p = k;
		b.title = p.desc || '';
		b.onclick = () =>
			smooth(() =>
				change(() => {
					const keep = app.S;
					app.S = newState(k, keep);
					app.S.mode = 'art';
				})
			);
		$('wzStyles').appendChild(b);
	});
	Object.entries(BASES).forEach(([k, p]) => {
		const b = card(document.createElement('button'), `${dotsHTML(p.dots)}<span class="nm">${p.name}</span>`);
		b.dataset.b = k;
		b.onclick = () => {
			change(() => {
				app.S.mode = 'std';
				app.S.base = k;
			});
			ensureRaster();
		};
		$('wzBases').appendChild(b);
	});
	all('#wzMode button').forEach(
		(b) =>
			(b.onclick = () => {
				const m = /** @type {string} */ (b.dataset.m);
				if (m === 'sterne') return enableSky();
				smooth(() =>
					change(() => {
						app.S.motif = 'karte';
						app.S.mode = m;
					})
				);
				if (app.S.mode === 'std') ensureRaster();
			})
	);

	$('hoehenOn').addEventListener('change', (e) => change(() => (app.S.hoehen = { ...(app.S.hoehen || {}), on: /** @type {HTMLInputElement} */ (e.target).checked })));

	// Sternenhimmel
	Object.entries(SKY_THEMES).forEach(([k, T]) => {
		const s = document.createElement('button');
		s.type = 'button';
		s.className = 'mk-swatch sky-sw';
		s.dataset.k = k;
		s.title = T.name;
		s.innerHTML = `<i style="background:radial-gradient(circle at 35% 35%,${T.star} 0 6%,transparent 7%),radial-gradient(circle at 68% 60%,${T.star} 0 4%,transparent 5%),${T.bg}"></i><span>${T.name}</span>`;
		s.onclick = () => setSky({ theme: k });
		$('skyThemes').appendChild(s);
	});
	$('skyDate').addEventListener('change', (e) => {
		const v = /** @type {HTMLInputElement} */ (e.target).value;
		if (/^\d{4}-\d{2}-\d{2}$/.test(v)) setSky({ date: v });
	});
	$('skyTime').addEventListener('change', (e) => {
		const m = /** @type {HTMLInputElement} */ (e.target).value.match(/^(\d{1,2}):(\d{2})/);
		if (m) setSky({ min: +m[1] * 60 + +m[2] });
	});
	/** @type {[string,string][]} */ ([
		['skyLines', 'lines'],
		['skyNames', 'names'],
		['skyMw', 'mw'],
		['skyGrid', 'grid'],
		['skyReal', 'real']
	]).forEach(([id, key]) => $(id).addEventListener('change', (e) => setSky({ [key]: /** @type {HTMLInputElement} */ (e.target).checked })));

	// 4 Design
	Object.entries(DESIGNS).forEach(([k, D]) => {
		const b = card(document.createElement('button'), `<div class="dth"><img alt="" decoding="async"></div><span class="nm">${D.name}</span>`);
		b.dataset.d = k;
		b.title = D.desc;
		b.onclick = () => smooth(() => change(() => pickDesign(app.S, k)));
		$('wzDesigns').appendChild(b);
	});

	// 5 Text
	/** @param {string} id @param {(v:string)=>void} set */
	const textInput = (id, set) => {
		const e = /** @type {HTMLInputElement} */ ($(id));
		e.addEventListener('input', () => {
			begin();
			set(e.value);
			render();
		});
		e.addEventListener('change', () => commit());
		e.addEventListener('focus', () => {
			// Am Handy: Eingabefeld in Sicht holen
			revealSection(e.closest('label'));
		});
	};
	textInput('wzTitle', (v) => (app.S.title.text = v));
	textInput('wzSub', (v) => (app.S.sub.text = v));
	$('wzCoords').addEventListener('change', (e) =>
		change(() => (app.S.lay = { ...(app.S.lay || {}), coords: /** @type {HTMLInputElement} */ (e.target).checked }))
	);

	// 6 Produkt
	const PICON = {
		poster: '<rect x="9" y="5" width="22" height="30" rx="1.5"/>',
		gerahmt: '<rect x="7" y="3" width="26" height="34" rx="2" stroke-width="3.2"/><rect x="12" y="9" width="16" height="22"/>',
		leinwand: '<path d="M8 6h22v28H8z"/><path d="M30 6l3 3v28l-3-3M8 34l3 3h22"/>',
		shirt: '<path d="M14 5c2 3 10 3 12 0l8 4 4 9-6 3-1-2v17H9V19l-1 2-6-3 4-9z"/>',
		tasse: '<path d="M7 8h20v22c0 3-3 5-10 5S7 33 7 30z"/><path d="M27 13c7-1 7 11 0 10"/>'
	};
	Object.entries(PRODUCTS).forEach(([k, P]) => {
		const b = card(document.createElement('button'), `<svg viewBox="0 0 40 40" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${PICON[/** @type {keyof typeof PICON} */ (k)]}</svg><span class="nm">${P.name}</span>`);
		b.dataset.t = k;
		b.title = P.desc;
		b.onclick = () => setProduct({ type: k });
		$('wzProd').appendChild(b);
	});
	/** @param {string} id @param {Record<string,{name:string,css?:string,c?:string}>} list @param {string} key */
	const swatches = (id, list, key) =>
		Object.entries(list).forEach(([k, v]) => {
			const s = document.createElement('button');
			s.type = 'button';
			s.className = 'mk-swatch';
			s.dataset.k = k;
			s.dataset.key = key;
			s.title = v.name;
			s.setAttribute('aria-label', v.name);
			s.innerHTML = `<i style="background:${v.css || v.c}"></i><span>${v.name}</span>`;
			s.onclick = () => setProduct({ [key]: k });
			$(id).appendChild(s);
		});
	swatches('mkFrameSw', FRAMES, 'frame');
	swatches('mkShirtSw', SHIRTS, 'shirt');
	swatches('mkWallSw', WALLS, 'wall');
	$('mkMat').addEventListener('change', (e) => setProduct({ mat: /** @type {HTMLInputElement} */ (e.target).checked }));

	// Druckgrößen (Ausschnitt- und Produkt-Schritt)
	all('[data-sizes]').forEach((box) => {
		[...Object.entries(SIZES), ['frei', { name: 'Frei' }]].forEach(([k, z]) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.dataset.k = /** @type {string} */ (k);
			b.textContent = /** @type {any} */ (z).name;
			b.onclick = () =>
				smooth(() =>
					change(() => {
						const S = app.S;
						if (k === 'frei') S.print = null;
						else S.print = { k, q: !!(S.print && S.print.q) };
						fitPrint(S);
						clampView(S.view);
					})
				);
			box.appendChild(b);
		});
	});
	all('[data-quer]').forEach((q) =>
		q.addEventListener('change', (e) =>
			smooth(() =>
				change(() => {
					if (app.S.print) app.S.print.q = /** @type {HTMLInputElement} */ (e.target).checked;
					fitPrint(app.S);
					clampView(app.S.view);
				})
			)
		)
	);

	initMulti();
	initRoute();
	initGift();

	// Anlass-Vorlagen (Startseite und Schritt „Ort“)
	all('[data-occ]').forEach((box) =>
		Object.entries(ANLAESSE).forEach(([k, A]) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.dataset.k = k;
			b.title = A.desc;
			b.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${A.icon}</svg><span>${A.name}</span>`;
			b.onclick = () => {
				if (app.DATA) applyOccasion(k);
				else {
					// Noch kein Ort: merken und nach der Suche anwenden
					app.occasionPending = app.occasionPending === k ? '' : k;
					syncOccasion();
					const lq = /** @type {HTMLInputElement|null} */ (document.getElementById('lq'));
					if (lq && app.occasionPending) lq.focus();
				}
			};
			box.appendChild(b);
		})
	);

	// Effekte (Design-Schritt)
	/** @param {string} id @param {'paper'|'vig'} key */
	const fxToggle = (id, key) =>
		$(id).addEventListener('change', (e) => change(() => (app.S.fx = { ...(app.S.fx || {}), [key]: /** @type {HTMLInputElement} */ (e.target).checked })));
	fxToggle('fxPaper', 'paper');
	fxToggle('fxVig', 'vig');
	$('softproof').addEventListener('change', (e) => document.body.classList.toggle('softproof', /** @type {HTMLInputElement} */ (e.target).checked));

	// Widmung / Datum
	textInput('wzNote', (v) => (app.S.note = { ...(app.S.note || {}), on: true, text: v, auto: false }));

	// Markierungen
	Object.entries(PIN_SHAPES).forEach(([k, P]) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'btn sm';
		b.innerHTML = `<svg viewBox="-20 -34 40 50" width="16" height="16"><path d="${P.d}" fill="currentColor" fill-rule="evenodd"/></svg>+ ${P.name}`;
		b.onclick = () =>
			change(() => {
				const S = app.S;
				S.pins = S.pins || [];
				if (S.pins.length >= 20) return;
				// Neue Markierung in die Mitte, leicht versetzt, damit sie nicht übereinander liegen
				const off = (S.pins.length % 5) * 14 / S.view.z;
				S.pins.push({ i: k, x: +(S.view.cx + off).toFixed(2), y: +(S.view.cy + off).toFixed(2) });
				msg('Markierung gesetzt – im Poster an die richtige Stelle ziehen', 'ok');
			});
		$('wzPinAdd').appendChild(b);
	});
	[
		['#d64545', 'Rot'],
		['#262c3a', 'Navy'],
		['#c9a227', 'Gold'],
		['#2f6fe4', 'Blau'],
		['#1f6f43', 'Grün'],
		['#ffffff', 'Weiß'],
		['#1c1c1e', 'Schwarz']
	].forEach(([c, name]) => {
		const s = document.createElement('button');
		s.type = 'button';
		s.className = 'mk-swatch wz-pc';
		s.dataset.c = c;
		s.title = name;
		s.setAttribute('aria-label', 'Farbe der Markierungen: ' + name);
		s.innerHTML = `<i style="background:${c}"></i><span>${name}</span>`;
		s.onclick = () => change(() => (app.S.pinColor = c));
		$('wzPinCol').appendChild(s);
	});

	// Raum und Model (Produkt)
	swatches('mkRoomSw', ROOMS, 'room');
	$('mkModel').addEventListener('change', (e) => setProduct({ model: /** @type {HTMLInputElement} */ (e.target).checked }));

	// Teilen
	$('wzShare').onclick = async () => {
		try {
			const url = await shareLink();
			const nav = /** @type {any} */ (navigator);
			if (nav.share && matchMedia('(pointer: coarse)').matches) {
				await nav.share({ title: 'Mein Kartenstudio-Entwurf', url }).catch(() => {});
				return;
			}
			await navigator.clipboard.writeText(url);
			msg('Link kopiert – einfach einfügen und teilen', 'ok');
		} catch (e) {
			window.prompt('Link zum Entwurf:', await shareLink());
		}
	};

	// 7 Fertig
	all('.wz-dl button').forEach(
		(b) =>
			(b.onclick = () => {
				app.dlF = b.dataset.f;
				if (b.dataset.w) /** @type {HTMLSelectElement} */ ($('pngW')).value = b.dataset.w;
				$('dlGo').click();
			})
	);

	document.body.classList.add('wiz-on');
	goStep(step, false);
}
