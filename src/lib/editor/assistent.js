// Geführter Ablauf („Assistent“): Ort → Ausschnitt → Stil → Design → Text → Fertig.
// Es ist immer nur ein Schritt sichtbar. Alle Detailregler aus dem Prototyp
// bleiben unter „Erweiterte Einstellungen“ erreichbar.
import { schriftenDa } from './basis.js';
import { fokusOpt, akzent } from '../themen/layouts.js';
import { typoOpt, geo, aktuelleForm } from './zeichnen.js';
import { sheetZeigen, sheetOffen } from './sheet.js';
import { textImPoster, favoritenZeichnen } from './direkt.js';
import { tourAnbieten, tourStarten } from './tour.js';
import { asset } from '$app/paths';
import { app as appUntyped } from './app.js';
import { alsBild, buildSVG, karteSchwer, render, vorschauSVG } from './zeichnen.js';
import { begin, change, clampView, commit, newState } from './zustand.js';
import { openSec } from './seitenleiste.js';
import { setTool, sliderToZ, zToSlider } from './bedienung.js';
import { STRASSEN, extZmin } from './zustand.js';
import { dotsHTML } from './seitenleiste.js';
import { PRESETS as PRESETS_UNTYPED } from '../themen/vorlagen.js';
import { BASES, inBayern } from '../themen/standard.js';
import { DESIGNS, applyDesign } from '../themen/designs.js';
import { STIL_GRUPPEN, DESIGN_GRUPPEN } from '../themen/sammlungen.js';
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
import { initMulti, multiOn, syncMulti } from './mehrere.js';
import { initForm, syncForm } from './form-ui.js';
import { beispielNachLaden, vorschlaegeZeichnen } from '../beispiele/galerie.js';
import { meinStandort } from '../karte/suche.js';
import { defView, vLimits } from './zustand.js';
import { initRoute, syncRoute } from './route.js';
import { preis, lieferung } from '../shop/preise.js';
import { initGift } from '../shop/geschenk.js';
import { SKY_THEMES, defaultSky, loadSky, skyLabel } from '../themen/himmel.js';
import { STORY_BEISPIEL } from '../themen/koordinaten.js';
import { WOLKE_FORMEN, wolkeBeispiel } from '../themen/wolke.js';
import { loadBounds } from './laden.js';
import { visRect } from './zustand.js';
import { mercInv } from '../karte/raster.js';
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

/** Vier Schritte; jeder zeigt einen oder zwei Bereiche (Panes) untereinander */
export const STEPS = ['ort', 'stil', 'design', 'text', 'extras', 'fertig'];
/** @type {Record<string,string[]>} */
const GRUPPE = { ort: ['ort', 'ausschnitt'], stil: ['stil'], design: ['design'], text: ['text'], extras: ['extras'], fertig: ['produkt', 'fertig'] };
/** Alter Bereichsname → Schritt (für Links, Chat-Knöpfe, gespeicherte Entwürfe) @param {string} n */
export const schrittVon = (n) => (n === 'gestalten' ? 'stil' : GRUPPE[n] ? n : Object.keys(GRUPPE).find((g) => GRUPPE[g].includes(n)) || '');
/** @type {Record<string,string>} */
const LABEL = { ort: 'Ort', stil: 'Stil', design: 'Design', text: 'Text', extras: 'Extras', fertig: 'Fertig' };
/** Ein Satz je Bereich: was man hier tut */
/** @type {Record<string,string>} */
const SATZ = {
	ort: 'Ort suchen und festlegen, welcher Ausschnitt aufs Poster kommt.',
	stil: 'Die Farben deiner Karte – einfach einen Look antippen.',
	design: 'Der Aufbau: Rahmen, Form und wo der Text steht. Die Farben bleiben.',
	text: 'Titel, Untertitel, Schrift und eine persönliche Widmung.',
	extras: 'Herzen und Pins, Effekte und 3D – alles freiwillig.',
	fertig: 'Produkt und Größe wählen, herunterladen oder teilen.'
};
/** Welcher Abschnitt der erweiterten Einstellungen passt zu welchem Schritt */
/** @type {Record<string,string>} */
const ADV_FOR = { ort: 'ausschnitt', stil: 'stil', design: 'rahmen', text: 'text', extras: 'elemente', fertig: 'farben' };

let step = 'stil';
let advOpen = false;

const wizOn = () => !advOpen;
/** @param {string} sel */
const all = (sel) => /** @type {HTMLElement[]} */ ([...document.querySelectorAll(sel)]);

/**
 * Zu einem Schritt wechseln.
 * @param {string} ziel Schritt oder Bereich (z. B. „design“)
 * @param {boolean} [animate]
 */
export function goStep(ziel, animate = true) {
	const next = schrittVon(ziel);
	if (!next) return;
	const dir = STEPS.indexOf(next) - STEPS.indexOf(step);
	step = next;
	app.wizStep = next;
	saveDraftSoon();
	besuchen(next);
	all('.wz-pane').forEach((p) => p.classList.toggle('on', GRUPPE[next].includes(/** @type {string} */ (p.dataset.step))));
	const idx = STEPS.indexOf(next);
	all('#wzSteps button[data-step]').forEach((b, i) => {
		b.classList.toggle('on', i === idx);

		b.setAttribute('aria-current', i === idx ? 'step' : 'false');
	});
	/** @type {HTMLButtonElement} */ ($('wzBack')).disabled = idx === 0;
	$('wzKopfNr').textContent = `Schritt ${idx + 1} von ${STEPS.length}`;
	$('wzKopfT').textContent = LABEL[next];
	$('wzKopfD').textContent = SATZ[next];
	const letzter = idx === STEPS.length - 1;
	$('wiz').classList.toggle('wz-last', letzter);
	$('wzNextLabel').textContent = letzter ? 'Herunterladen' : LABEL[STEPS[idx + 1]];
	requestAnimationFrame(() => markierung());
	if (!letzter) $('wzNextSmall').textContent = 'Weiter';
	else fertigKnopf();
	const pane = document.querySelector(`.wz-pane[data-step="${GRUPPE[next][0]}"]`);
	// Weicher Übergang: Kopf und Abschnitte gleiten nacheinander herein (nur transform/opacity → flüssig)
	if (animate && dir && pane && !reducedMotion()) {
		[$('wzKopf'), ...all('.wz-pane.on')].forEach((el, i) =>
			el.animate(
				[
					{ opacity: 0, transform: 'translateY(10px)' },
					{ opacity: 1, transform: 'none' }
				],
				{ duration: 240, delay: Math.min(i, 3) * 40, easing: EASE, fill: 'backwards' }
			)
		);
	}
	const side = $('side');
	// Bereich weiter unten im Schritt angefragt (z. B. „Design“) → dorthin scrollen, sonst nach oben
	if (next === 'fertig') fertigReiter(ziel === 'produkt' ? 'produkt' : $('wiz').dataset.fz || 'produkt');
	const unten = next !== 'fertig' && ziel !== next && GRUPPE[next].indexOf(ziel) > 0 ? /** @type {HTMLElement|null} */ (document.querySelector(`.wz-pane[data-step="${ziel}"]`)) : null;
	if (unten) requestAnimationFrame(() => unten.scrollIntoView({ block: 'start', behavior: reducedMotion() || !animate ? 'auto' : 'smooth' }));
	else {
		if (side) side.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
		document.querySelector('.wz-panes')?.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
	}
	setMockup(next === 'fertig' && !advOpen);
	syncWizard();
}

/** Reiter im Bereich „Fertig“: Produkt · Herunterladen · Teilen @param {string} t */
export function fertigReiter(t) {
	$('wiz').dataset.fz = t;
	all('#fertigTabs button').forEach((b) => {
		b.classList.toggle('on', b.dataset.t === t);
		b.setAttribute('aria-selected', String(b.dataset.t === t));
	});
	const box = document.querySelector(`[data-fsub="${t}"]`);
	if (box && !reducedMotion()) box.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
	fertigKnopf();
}
/** Großer Knopf unten im Bereich „Fertig“: führt der Reihe nach Produkt → Herunterladen → Teilen */
function fertigKnopf() {
	if (step !== 'fertig') return;
	const t = $('wiz').dataset.fz || 'produkt';
	$('wzNextSmall').textContent = t === 'produkt' ? 'Weiter' : t === 'laden' ? 'Zum Schluss' : 'Fertig';
	$('wzNextLabel').textContent = t === 'produkt' ? 'Herunterladen' : t === 'laden' ? 'Teilen' : 'Zum Poster';
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
	/** @type {HTMLInputElement} */ ($('mkSet')).checked = !!P.set;
	/** @type {HTMLElement} */ ($('mkMat').closest('label')).classList.toggle('hidden', P.type !== 'gerahmt');
	const pr = preis(P, app.S.print);
	$('priceVal').textContent = pr.text;
	$('priceDet').textContent = pr.details.join(' · ');
	$('orderLabel').textContent = `Bestellen · ${pr.text}`;
	$('priceShip').textContent = P.type === 'download' ? 'Kein Versand nötig · ' + lieferung('download') : `Versand in Deutschland kostenlos · ${lieferung(P.type)}`;
}

/** Assistent ↔ erweiterte Einstellungen umschalten. @param {boolean} on */
function showAdvanced(on) {
	advOpen = on;
	setMockup(!on && step === 'fertig');
	$('wiz').classList.toggle('hidden', on);
	$('adv').classList.toggle('hidden', !on);
	document.body.classList.toggle('wiz-on', !on);
	// Im Assistenten lässt sich die Karte direkt im Poster verschieben; Auswählen gibt es in den erweiterten Einstellungen
	setTool(on ? 'sel' : 'move');
	if (on) {
		sheetZeigen(true);
		openSec(ADV_FOR[step] || 'stil');
		$('side').scrollTo({ top: 0 });
	}
	const box = on ? $('adv') : $('wiz');
	if (!reducedMotion()) box.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE });
	if (app.DATA) render();
}

/* ---------- Vorschaubilder ----------
   Stile und Designs zeigen feste Beispielbilder (static/vorschau/…, erzeugt mit tests/vorschaubilder.mjs).
   Früher wurden sie für jeden Ort live gezeichnet – bei Städten kostete das Sekunden und bremste die Menüs. */
/** @param {'stil'|'design'} art @param {string} k */
export const vorschauBild = (art, k) => asset(/** @type {any} */ (`vorschau/${art}/${k}.webp`));

/* ---------- Anzeige mit dem Zustand abgleichen ---------- */
/** Bereich „Ort“: Zoom, Umfang, Kartendetails, Ortsnamen, Ausrichtung */
function syncOrt() {
	const S = app.S;
	if (!app.DATA) return;
	const zr = /** @type {HTMLInputElement} */ ($('wzZoomR'));
	if (document.activeElement !== zr) zr.value = String(zToSlider(S.view));
	const z = S.view.z,
		zw = extZmin(S.view);
	const umf = Math.abs(z - 1.7) < 0.02 ? 'kern' : Math.abs(z - 1) < 0.02 ? 'ort' : Math.abs(z - zw) < 0.02 ? 'weit' : '';
	all('#wzUmfang button').forEach((b) => b.classList.toggle('on', b.dataset.z === umf));
	const karte = !S.motif || S.motif === 'karte';
	$('oaDetails').classList.toggle('hidden', !karte || multiOn());
	const H = S.cls.haus && S.cls.haus.h,
		R = S.cls.haupt && S.cls.haupt.h && S.cls.neben && S.cls.neben.h;
	const zg = !H && !R ? 'alle' : H && !R ? 'strassen' : !H && R ? 'haeuser' : '';
	all('#wzZeig button').forEach((b) => b.classList.toggle('on', b.dataset.zg === zg));
	$('wzZeig').classList.toggle('hidden', S.mode === 'std');
	const on = /** @type {HTMLInputElement} */ ($('wzOrtsnamen'));
	on.checked = S.mode === 'std' ? !!S.labels : !!S.ortsnamen;
	const keine = S.mode !== 'std' && !(app.DATA.orte && app.DATA.orte.length);
	on.disabled = keine;
	/** @type {HTMLElement} */ (on.closest('label')).classList.toggle('dis', keine);
	$('wzOrtsnamenInfo').textContent = keine ? '– für diesen Ausschnitt keine vorhanden' : '';
	const fest = !!(S.design && /** @type {any} */ (DESIGNS)[S.design] && /** @type {any} */ (DESIGNS)[S.design].aspect);
	const g = geo(),
		r = g.H / g.W;
	const o = r > 1.02 ? 'hoch' : r < 0.98 ? 'quer' : 'quadrat';
	all('#wzAusr button').forEach((b) => {
		b.classList.toggle('on', b.dataset.o === o);
		/** @type {HTMLButtonElement} */ (b).disabled = fest;
	});
	$('wzAusrInfo').classList.toggle('hidden', !fest);
}
export function syncWizard() {
	const S = app.S;
	if (!S) return;
	const sky = S.motif === 'sterne';
	const koord = S.motif === 'koord';
	const wolke = S.motif === 'wolke';
	const std = S.mode === 'std' && !sky && !koord && !wolke;
	const motiv = sky ? 'sterne' : koord ? 'koord' : wolke ? 'wolke' : S.mode;
	all('#wzMode button').forEach((b) => b.classList.toggle('on', b.dataset.m === motiv));
	$('wzWolke').classList.toggle('hidden', !wolke);
	if (wolke && S.wolke) {
		const ta = /** @type {HTMLTextAreaElement} */ ($('wolkeText'));
		if (document.activeElement !== ta) ta.value = S.wolke.text || '';
		all('#wolkeForm button').forEach((b) => b.classList.toggle('on', b.dataset.f === S.wolke.form));
		/** @type {HTMLInputElement} */ ($('wolkeSchrift')).checked = !!S.wolke.schrift;
	}
	// Beim Koordinaten-Poster bleiben die Farbthemen sichtbar (sie bestimmen Hintergrund und Schrift)
	$('wzStyles').classList.toggle('hidden', std || sky);
	$('wzStilKat').classList.toggle('hidden', std || sky);
	$('wzFarbLab').classList.toggle('hidden', std || sky);
	$('wzKoord').classList.toggle('hidden', !koord);
	if (koord && S.koord) {
		const ta = /** @type {HTMLTextAreaElement} */ ($('koordText'));
		if (document.activeElement !== ta) ta.value = S.koord.text || '';
		all('#koordAlign button').forEach((b) => b.classList.toggle('on', b.dataset.a === (S.koord.align || 'links')));
	}
	$('wzBases').classList.toggle('hidden', !std);
	$('wzSky').classList.toggle('hidden', !sky);
	$('wzHoehe').classList.toggle('hidden', std || sky || koord || wolke);
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
	all('#wzDesigns button').forEach((b) => b.classList.toggle('on', b.dataset.d === (S.design || 'poster')));
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
	syncOrt();
	const pr = S.print;
	all('[data-sizes] button').forEach((b) => b.classList.toggle('on', pr ? b.dataset.k === pr.k : b.dataset.k === 'frei'));
	all('[data-quer]').forEach((q) => {
		const i = /** @type {HTMLInputElement} */ (q);
		i.checked = !!(pr && pr.q);
		i.disabled = !pr || /** @type {any} */ (SIZES)[pr.k].w === /** @type {any} */ (SIZES)[pr.k].h;
		/** @type {HTMLElement} */ (i.closest('label')).classList.toggle('dis', i.disabled);
	});
	$('wzFree').classList.toggle('hidden', !!pr);
	// Zusatztexte nur bei Designs, die sie zeigen
	const kind = (S.lay && S.lay.kind) || '';
	const absatz = !!(S.lay && S.lay.absatz);
	const zeigInfo = { kopf: kind === 'steckbrief', nr: kind === 'steckbrief', kicker: kind === 'steckbrief' || kind === 'kasten', fakten: kind === 'steckbrief', absatz };
	$('wzInfo').classList.toggle('hidden', kind !== 'steckbrief' && kind !== 'kasten' && !absatz);
	all('#wzInfo [data-info]').forEach((l) => l.classList.toggle('hidden', !(/** @type {any} */ (zeigInfo)[/** @type {string} */ (l.dataset.info)])));
	[['wzInfoKopf', 'kopf'], ['wzInfoNr', 'nr'], ['wzInfoKicker', 'kicker'], ['wzInfoFakten', 'fakten'], ['wzInfoAbsatz', 'absatz']].forEach(([id, k]) => {
		const e = /** @type {HTMLInputElement} */ ($(id));
		if (document.activeElement !== e) e.value = (S.info && S.info[k]) || '';
	});
	$('wzFokus').classList.toggle('hidden', !(S.lay && S.lay.fokus));
	if (S.lay && S.lay.fokus) {
		const F = fokusOpt(geo());
		all('#wzFokusFarben button').forEach((b) => b.classList.toggle('on', (b.dataset.c || '') === ((S.info && S.info.fokus) || '')));
		all('#wzFokusForm button').forEach((b) => b.classList.toggle('on', b.dataset.v === F.form));
		/** @type {[string, number][]} */ ([['wzFokusGr', F.gr], ['wzFokusX', F.x], ['wzFokusY', F.y]]).forEach(([id, v]) => {
			if (document.activeElement !== $(id)) /** @type {HTMLInputElement} */ ($(id)).value = String(v);
		});
		/** @type {HTMLInputElement} */ ($('wzFokusEigen')).value = akzent(S).length === 7 ? akzent(S) : '#cf2e2e';
	}
	$('wzTypo').classList.toggle('hidden', kind !== 'typo');
	if (kind === 'typo') {
		const T = typoOpt();
		all('#wzTypoStil button').forEach((b) => b.classList.toggle('on', b.dataset.v === T.stil));
		all('#wzTypoSchrift button').forEach((b) => b.classList.toggle('on', b.dataset.v === T.schrift));
		all('#wzTypoZeilen button').forEach((b) => b.classList.toggle('on', +(b.dataset.v || 0) === T.zeilen));
		all('#wzTypoFarben button').forEach((b) => b.classList.toggle('on', (b.dataset.c || '') === T.farbe));
		if (document.activeElement !== $('wzTypoDeck')) /** @type {HTMLInputElement} */ ($('wzTypoDeck')).value = String(T.deck >= 0 ? T.deck : 0.85);
		$('wzTypoDeck').closest('.row')?.classList.toggle('hidden', T.stil === 'schnitt');
	}
	const n = /** @type {HTMLInputElement} */ ($('wzNote'));
	if (document.activeElement !== n) n.value = (S.note && S.note.text) || '';
	syncPins();
	syncMulti();
	syncForm();
	all('#wzFonts button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.title.font && b.dataset.s === S.sub.font));
	syncRoute();
	/** @type {HTMLInputElement} */ ($('fxPaper')).checked = !!(S.fx && S.fx.paper);
	/** @type {HTMLInputElement} */ ($('fxVig')).checked = !!(S.fx && S.fx.vig);
	/** @type {HTMLInputElement} */ ($('fxGlow')).checked = !!(S.fx && S.fx.glow);
	/** @type {HTMLInputElement} */ ($('fxSchatten')).checked = !!(S.fx && S.fx.schatten);
	/** @type {HTMLInputElement} */ ($('fxH3d')).checked = !!(S.fx && S.fx.h3d);
	$('fxSchatten').closest('label')?.classList.toggle('hidden', !!(S.fx && S.fx.h3d) || S.mode === 'std');
	/** @type {HTMLInputElement} */ ($('fxRelief')).checked = !!(S.fx && S.fx.relief);
	const kp = (S.fx && +S.fx.kipp) || 0;
	if (document.activeElement !== $('fxKipp')) /** @type {HTMLInputElement} */ ($('fxKipp')).value = String(kp);
	$('fxKippV').textContent = kp ? kp + '°' : 'aus';
	const nur2d = (S.motif && S.motif !== 'karte') || multiOn();
	$('wz3d').classList.toggle('aus', !!nur2d);
	$('wz3d').classList.toggle('std', S.mode === 'std');
	/** @type {HTMLInputElement} */ ($('fxGelaende')).checked = !!(S.fx && S.fx.gelaende);
	const dr = (S.fx && +S.fx.dreh) || 0;
	if (document.activeElement !== $('fxDreh')) /** @type {HTMLInputElement} */ ($('fxDreh')).value = String(dr);
	$('fxDrehV').textContent = dr ? (dr > 0 ? dr + '° ↻' : -dr + '° ↺') : 'Nord';
	all('[data-occ] button').forEach((b) => b.classList.toggle('on', b.dataset.k === S.occasion));
	if (step === 'stil') {
		vorschlaegeZeichnen();
		favoritenZeichnen();
	}
	if (step === 'fertig') {
		syncFinish();
		scheduleMockup();
	}
	syncProduct();
}

/* ---------- Sanfte Führung: welche Bereiche wurden schon angesehen? ---------- */
const BESUCHT_KEY = 'kartenstudio.besucht.v1';
/** @type {Set<string>} */
let besucht = new Set();
let besuchtOrt = '';
/** Angesehene Bereiche je Ort laden (beim Wechsel des Orts) */
function besuchtLaden() {
	const ort = (app.DATA && app.DATA.place) || '';
	if (ort === besuchtOrt) return;
	besuchtOrt = ort;
	try {
		const alle = JSON.parse(localStorage.getItem(BESUCHT_KEY) || '{}');
		besucht = new Set(Array.isArray(alle[ort]) ? alle[ort] : []);
	} catch (e) {
		besucht = new Set();
	}
}
/** @param {string} s */
function besuchen(s) {
	besuchtLaden();
	if (!besucht.has(s)) {
		besucht.add(s);
		try {
			const alle = JSON.parse(localStorage.getItem(BESUCHT_KEY) || '{}');
			alle[besuchtOrt] = [...besucht];
			// höchstens 30 Orte merken
			const k = Object.keys(alle);
			if (k.length > 30) delete alle[k[0]];
			localStorage.setItem(BESUCHT_KEY, JSON.stringify(alle));
		} catch (e) {}
	}
	fortschritt();
}
/** Ring um „Fertig“ füllen und den nächsten offenen Bereich mit einem Punkt zeigen */
function fortschritt() {
	const wege = STEPS.filter((s) => s !== 'fertig');
	const n = wege.filter((s) => besucht.has(s)).length;
	const ring = document.getElementById('wzRing');
	if (ring) ring.setAttribute('stroke-dasharray', `${Math.round((n / wege.length) * 100)} 100`);
	const f = /** @type {HTMLElement|null} */ (document.querySelector('#wzSteps .wz-fertig'));
	if (f) f.dataset.tip = n < wege.length ? `Fertig · ${n} von ${wege.length} angesehen` : 'Fertig · alles angesehen';
	const naechst = wege.find((s) => !besucht.has(s));
	all('#wzSteps button[data-step]').forEach((b) => b.classList.toggle('naechst', b.dataset.step === naechst && b.dataset.step !== step));
}

/** Nach dem Laden eines Orts: im Assistenten beim Stil weitermachen. */
export function wizardAfterLoad() {
	besuchtLaden();
	// Ort ist mit der Suche schon gewählt
	besuchen('ort');
	besuchen(step);
	// Neuer Ort: Himmel über dem neuen Ort berechnen
	if (app.S && app.S.sky) {
		const [lon, lat] = viewCenterLL();
		app.S.sky = { ...app.S.sky, lat: +lat.toFixed(4), lon: +lon.toFixed(4) };
	}
	setTool(advOpen ? 'sel' : 'move');
	// Anlass vor der Suche gewählt → jetzt anwenden und direkt zum Text (Datum eintragen)
	if (app.occasionPending) {
		app.beispielPending = '';
		const k = app.occasionPending;
		app.occasionPending = '';
		applyOccasion(k, false);
		if (!advOpen) goStep(ANLAESSE[k].note ? 'text' : 'stil', false);
		return;
	}
	// Beispiel aus der Galerie geöffnet → dessen Look anwenden
	if (beispielNachLaden()) return;
	// Wer gerade am Ausschnitt arbeitet (z. B. „Größere Gegend laden“), bleibt dort
	const bleib = app.bleibAusschnitt;
	app.bleibAusschnitt = false;
	if (!advOpen) goStep(bleib ? 'ausschnitt' : 'stil', false);
	tourAnbieten();
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

/* ---------- Koordinaten-Poster ---------- */
export function enableKoord() {
	smooth(() =>
		change(() => {
			const S = app.S;
			S.motif = 'koord';
			S.mode = 'art';
			const [lon, lat] = viewCenterLL();
			if (!S.koord) S.koord = { lat: +lat.toFixed(5), lon: +lon.toFixed(5), text: STORY_BEISPIEL, align: 'links' };
			// Formen wie Kreis/Herz/Typografie passen nicht zu einem Textposter
			const D = /** @type {any} */ (DESIGNS)[S.design || 'poster'];
			if (!D || D.aspect || (D.lay && D.lay.kind === 'typo')) pickDesign(S, 'minimal');
		})
	);
	// Zeilenumbruch misst die Schrift – nach dem Laden der Schriften einmal neu zeichnen
	document.fonts.load('40px SgXB').then(() => document.fonts.load('20px SgMD')).then(() => render());
}

/* ---------- Wortwolke ---------- */
export function enableWolke() {
	smooth(() =>
		change(() => {
			const S = app.S;
			S.motif = 'wolke';
			S.mode = 'art';
			if (!S.wolke) S.wolke = { text: wolkeBeispiel((app.DATA && app.DATA.place) || 'Heimat', (app.DATA && app.DATA.region) || ''), form: 'herz', schrift: true };
			const D = /** @type {any} */ (DESIGNS)[S.design || 'poster'];
			if (!D || D.aspect || (D.lay && D.lay.kind === 'typo')) pickDesign(S, 'galerie');
		})
	);
	Promise.all(['SgXB', 'SgMD', 'SgSC', 'SgBR', 'SgBE'].map((f) => document.fonts.load('30px ' + f))).then(() => render());
}

/** Ausschnitt um die aktuelle Mitte 2,5-mal größer neu laden (bis 40 km) */
async function gegendVergroessern() {
	if (!app.DATA) return;
	const P = app.DATA.proj,
		v = visRect();
	const mx = P.x0 + (v[0] + v[2]) / 2 / P.sc,
		my = P.y0 + (v[1] + v[3]) / 2 / P.sc;
	const lat = mercInv(mx, my)[1];
	let hw = ((v[2] - v[0]) / P.sc) * 1.25,
		hh = ((v[3] - v[1]) / P.sc) * 1.25;
	// Höchstens 40 km breit
	const maxHalb = 20000 / (40075016.7 * Math.cos((lat * Math.PI) / 180));
	if (hw > maxHalb) {
		hh *= maxHalb / hw;
		hw = maxHalb;
	}
	const [w, n] = mercInv(mx - hw, my - hh),
		[e, s] = mercInv(mx + hw, my + hh);
	msg('Größere Gegend wird geladen – bei großen Gebieten nur Straßen und Wasser', 'busy');
	await loadBounds({ w, n, e, s }, { maxW: 40000 });
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
			const D = /** @type {any} */ (DESIGNS)[S.design || 'poster'];
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
		// Titel/Untertitel gleich im Poster bearbeiten
		const k = app.curText;
		if (k === 'title' || k === 'sub') requestAnimationFrame(() => textImPoster(k));
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
		// Eigene Form: Seitenverhältnis der Form
		const F = D.lay && D.lay.shape === 'eigen' ? aktuelleForm(S) : null;
		S.view.a = F ? Math.min(2.2, Math.max(0.45, F.a)) : D.aspect;
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
	// Große Karten (Städte): Die Überblendung müsste das ganze Poster zweimal als Bild erfassen →
	// stattdessen nur sanft einblenden (läuft ohne Neumalen)
	if (d.startViewTransition && !karteSchwer()) {
		const t = d.startViewTransition(fn);
		// schnelles Weiterklicken bricht die vorige Überblendung ab – das ist kein Fehler
		[t.ready, t.finished, t.updateCallbackDone].forEach((p) => p && p.catch(() => {}));
		return;
	}
	fn();
	app.poster.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 260, easing: EASE });
}

/** Wartende Auswahl je Gruppe (Stile, Designs …) – in Klick-Reihenfolge @type {Map<Element, () => void>} */
const wahl = new Map();
let wahlPlan = 0,
	letzteWahl = 0;
/**
 * Auswahl (Stil, Design) beim schnellen Durchklicken: Der Knopf ist sofort markiert, gezeichnet
 * wird je Gruppe nur die zuletzt gewählte Variante – Zwischenschritte, die man nie sehen würde, entfallen.
 * Die weiche Überblendung gibt es nur bei einzelnen, ruhigen Klicks (sonst stottert sie).
 * @param {HTMLElement} knopf @param {() => void} fn
 */
export function waehle(knopf, fn) {
	const gruppe = knopf.parentElement || knopf;
	gruppe.querySelectorAll('.on').forEach((/** @type {Element} */ x) => x.classList.remove('on'));
	knopf.classList.add('on');
	wahl.delete(gruppe);
	wahl.set(gruppe, fn);
	if (wahlPlan) return;
	wahlPlan = requestAnimationFrame(() => {
		wahlPlan = 0;
		const fns = [...wahl.values()];
		wahl.clear();
		if (!fns.length) return;
		const jetzt = performance.now();
		const ruhig = jetzt - letzteWahl > 700;
		letzteWahl = jetzt;
		const alle = () => fns.forEach((f) => f());
		if (ruhig) smooth(alle);
		else alle();
	});
}

/** Gruppen je Liste: p = Farbstile, d = Designs */
const GRUPPEN = /** @type {Record<string, import('../themen/sammlungen.js').Gruppe[]>} */ ({ p: STIL_GRUPPEN, d: DESIGN_GRUPPEN });
const LISTE = /** @type {Record<string, [string, string]>} */ ({ p: ['wzStilKat', 'wzStyles'], d: ['wzDesignKat', 'wzDesigns'] });
/** Karten je Gruppe in der Übersicht („Alle“) – eine Reihe */
const REIHE = 3;

/**
 * Karten nach Gruppen ordnen: Überschrift (Name, ein Satz, „Alle N ›“) und darunter die Karten.
 * In der Übersicht zeigt jede Gruppe eine Reihe; „Alle N“ klappt die Gruppe auf.
 * @param {string} attr
 */
function gruppieren(attr) {
	const B = $(LISTE[attr][1]);
	GRUPPEN[attr].forEach((g) => {
		const kopf = document.createElement('div');
		kopf.className = 'wz-gr';
		kopf.dataset.g = g.id;
		const karten = g.keys.map((k) => /** @type {HTMLElement|null} */ (B.querySelector(`:scope > button[data-${attr}="${k}"]`))).filter((x) => !!x);
		kopf.innerHTML = `<div><b>${g.name}${g.neu ? ' <i>Neu</i>' : ''}</b><small>${g.desc}</small></div>` + (karten.length > REIHE ? `<span class="wz-gr-mehr" role="button" tabindex="0" aria-expanded="false">Alle ${karten.length} ›</span>` : '');
		B.appendChild(kopf);
		karten.forEach((b, i) => {
			const k = /** @type {HTMLElement} */ (b);
			k.dataset.g = g.id;
			k.classList.toggle('zu', i >= REIHE);
			B.appendChild(k);
		});
	});
	B.classList.add('kurz', 'gruppiert');
	const auf = (/** @type {HTMLElement} */ m) => {
		const id = /** @type {HTMLElement} */ (m.closest('.wz-gr')).dataset.g;
		const offen = m.getAttribute('aria-expanded') !== 'true';
		m.setAttribute('aria-expanded', String(offen));
		m.textContent = offen ? 'Weniger ‹' : `Alle ${B.querySelectorAll(`:scope > button[data-g="${id}"]`).length} ›`;
		/** @type {HTMLElement[]} */
		const neu = [];
		all(`#${B.id} > button[data-g="${id}"]`).forEach((b, i) => {
			if (i >= REIHE) {
				b.classList.toggle('zu', !offen);
				if (offen) neu.push(b);
			}
		});
		if (offen && !reducedMotion()) neu.forEach((b, i) => b.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: i * 18, easing: EASE, fill: 'backwards' }));
	};
	B.addEventListener('click', (e) => {
		const m = /** @type {HTMLElement} */ (e.target).closest('.wz-gr-mehr');
		if (m) auf(/** @type {HTMLElement} */ (m));
	});
	B.addEventListener('keydown', (e) => {
		const m = /** @type {HTMLElement} */ (e.target).closest('.wz-gr-mehr');
		if (m && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			auf(/** @type {HTMLElement} */ (m));
		}
	});
}

/**
 * Gruppe wählen ('' = Übersicht aller Gruppen). Gibt es die Gruppe auch in der anderen Liste
 * (Themenwelt wie „Sunset City“), wird sie dort mit ausgewählt.
 * @param {string} id @param {string} [nur] 'p' oder 'd' – Liste, in der gewählt wurde
 */
export function weltWaehlen(id, nur) {
	['p', 'd'].forEach((attr) => {
		const G = GRUPPEN[attr];
		const hat = !id || G.some((g) => g.id === id);
		if (nur && nur !== attr && (!id || !hat)) return;
		const wahl = hat ? id : '';
		const [kat, box] = LISTE[attr];
		all(`#${kat} button`).forEach((b) => {
			const an = (b.dataset.w || '') === wahl;
			b.classList.toggle('on', an);
			b.setAttribute('aria-selected', String(an));
		});
		const B = $(box);
		// Übersicht: je Gruppe eine Reihe · Gruppe gewählt: nur diese, ganz
		B.classList.toggle('kurz', !wahl);
		all(`#${box} > [data-g]`).forEach((b) => b.classList.toggle('nk', !!wahl && b.dataset.g !== wahl));
		if (wahl && !reducedMotion()) B.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 220, easing: EASE });
	});
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
	const dk = pick(Object.keys(DESIGNS), S.design || 'poster');
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


/**
 * Gleitende Markierung in der Werkzeugleiste: ein Element, das nur verschoben wird
 * (transform – kein Neu-Vermessen der Seite), PC senkrecht, Handy waagrecht.
 */
/** @param {HTMLElement|null} [ziel] Knopf, zu dem die Kerbe gleitet (Standard: aktives Werkzeug) */
function markierung(ziel) {
	const ind = document.getElementById('wzInd');
	const aktiv = /** @type {HTMLElement|null} */ (document.querySelector('#wzSteps button[data-step].on'));
	const b = ziel || aktiv;
	if (!ind || !b) return;
	// Kerbe unter einem anderen Knopf (Überfahren): dessen Symbol wird dunkel auf hellem Grund
	all('#wzSteps button.unter').forEach((x) => x !== b && x.classList.remove('unter'));
	b.classList.toggle('unter', b !== aktiv);
	const quer = matchMedia('(max-width: 900px)').matches;
	// „Fertig“ hat am PC einen eigenen runden Knopf – dort keine Markierung
	ind.classList.toggle('weg', !quer && b.classList.contains('wz-fertig'));
	const alt = ind.dataset.pos || '';
	if (quer) {
		// Handy: runder Hintergrund, mittig hinter dem Symbol
		ind.style.transform = `translate3d(${b.offsetLeft + b.offsetWidth / 2 - 22}px,0,0)`;
		ind.style.width = '';
		ind.style.height = '';
	} else {
		// PC: Kerbe mittig auf dem Knopf (Höhe der Kerbe 56 px)
		ind.style.transform = `translate3d(0,${b.offsetTop + b.offsetHeight / 2 - 28}px,0)`;
		ind.style.height = '';
		ind.style.width = '';
	}
	const neu = (quer ? 'q' : 's') + b.dataset.step;
	ind.dataset.pos = neu;
	// Flüssiges „Strecken“ während der Fahrt und ein kleiner Hüpfer des neuen Symbols
	if (alt && alt !== neu && !reducedMotion()) {
		ind.animate([{ scale: '1 1' }, { scale: quer ? '1.18 0.92' : '0.94 1.16' }, { scale: '1 1' }], { duration: 320, easing: EASE });
		const svg = b.querySelector('svg');
		if (svg) svg.animate([{ scale: '0.82' }, { scale: '1.12' }, { scale: '1' }], { duration: 340, easing: EASE });
	}
}

export function initWizard() {
	// Schritte
	all('#wzSteps button[data-step]').forEach(
		(b) =>
			(b.onclick = () => {
				const t = /** @type {string} */ (b.dataset.step);
				if (advOpen) showAdvanced(false);
				// Handy: aktives Werkzeug nochmal antippen schließt die Einstellungen (Poster wieder groß)
				else if (t === step && sheetOffen() && matchMedia('(max-width: 900px)').matches) return sheetZeigen(false);
				goStep(t);
				sheetZeigen(true);
			})
	);
	// Leiste: Hilfe öffnet den Chat; Markierung bei Größenänderung mitnehmen
	$('railHilfe').onclick = () => $('chatBtn').click();
	$('railTour').onclick = () => tourStarten();
	// … auch wenn die Leiste erst sichtbar wird (nach der Startseite) oder sich ihre Größe ändert
	if ('ResizeObserver' in window) new ResizeObserver(() => markierung()).observe($('wzSteps'));
	else addEventListener('resize', () => requestAnimationFrame(() => markierung()));
	// Handy: die Leiste hängt direkt an der Seite statt im Einstellungsfeld. Grund: iOS zeichnet fest
	// positionierte Elemente in animierten/scrollenden Bereichen fehlerhaft (Leiste wurde überdeckt).
	const leiste = $('wzSteps'),
		heimat = $('wiz'),
		handy = matchMedia('(max-width: 900px)');
	const umhaengen = () => {
		if (handy.matches) {
			if (leiste.parentElement !== document.body) document.body.appendChild(leiste);
		} else if (leiste.parentElement !== heimat) heimat.prepend(leiste);
		requestAnimationFrame(() => markierung());
	};
	handy.addEventListener('change', umhaengen);
	umhaengen();
	// Überfahren (PC mit Maus): die Kerbe folgt flüssig der Maus und kehrt beim Verlassen zurück
	const maus = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 901px)');
	let zurueck = 0;
	all('#wzSteps button[data-step]:not(.wz-fertig)').forEach((b) =>
		b.addEventListener('pointerenter', () => {
			if (!maus.matches) return;
			clearTimeout(zurueck);
			markierung(b);
		})
	);
	$('wzSteps').addEventListener('pointerleave', () => {
		if (!maus.matches) return;
		// kurze Pause: beim Wechsel zwischen zwei Knöpfen nicht erst zurückspringen
		zurueck = window.setTimeout(() => markierung(), 90);
	});
	all('#wzSteps .wz-fertig, #wzSteps .wz-unten button').forEach((b) =>
		b.addEventListener('pointerenter', () => maus.matches && markierung())
	);
	// Tasten 1–6 wechseln die Werkzeuge (nicht beim Tippen in Feldern)
	document.addEventListener('keydown', (e) => {
		const t = /** @type {HTMLElement} */ (e.target);
		if (e.ctrlKey || e.metaKey || e.altKey || !app.DATA || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
		const n = +e.key;
		if (n >= 1 && n <= STEPS.length) {
			if (advOpen) showAdvanced(false);
			goStep(STEPS[n - 1]);
		}
	});
	$('wzBack').onclick = () => goStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
	$('wzNext').onclick = () => {
		if (step !== 'fertig') return goStep(STEPS[STEPS.indexOf(step) + 1]);
		// Letzter Schritt: Produkt → Herunterladen → Teilen → zurück zum Poster (Handy: Feld zuklappen)
		const t = $('wiz').dataset.fz || 'produkt';
		if (t === 'produkt') fertigReiter('laden');
		else if (t === 'laden') fertigReiter('teilen');
		else if (matchMedia('(max-width: 900px)').matches) sheetZeigen(false);
		else document.querySelector('.wz-panes')?.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
	};
	all('#fertigTabs button').forEach((b) => (b.onclick = () => fertigReiter(/** @type {string} */ (b.dataset.t))));
	fertigReiter('produkt');
	$('wzAdv').onclick = () => showAdvanced(true);
	all('[data-adv-open]').forEach((b) => (b.onclick = () => showAdvanced(true)));
	// Kopfzeile am Handy: „Fertig“ führt direkt zu Produkt, Preis und Download
	$('hdrFertig').onclick = () => {
		if (advOpen) showAdvanced(false);
		goStep('fertig');
		sheetZeigen(true);
	};
	$('wzZu').onclick = () => sheetZeigen(false);
	// Querverweise im Text („Ort › Ausrichtung“): springen zum Bereich und holen den Abschnitt in Sicht
	document.addEventListener('click', (e) => {
		const l = /** @type {HTMLElement} */ (e.target).closest('[data-geh]');
		if (!l) return;
		goStep(/** @type {string} */ (/** @type {HTMLElement} */ (l).dataset.geh));
		setTimeout(() => $('wzAusr').scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' }), 260);
	});
	// Werkzeuge am Poster: Vorschau-Größe (Regler #zoom, 40–300 %), Einpassen, Vergleichen
	const zr = /** @type {HTMLInputElement} */ ($('zoom'));
	const zSetz = (/** @type {number} */ v) => {
		zr.value = String(Math.round(Math.min(300, Math.max(40, v))));
		zr.dispatchEvent(new Event('input'));
	};
	const zText = () => ($('ptProz').textContent = zr.value + ' %');
	zr.addEventListener('input', zText);
	zText();
	$('ptIn').onclick = () => zSetz(+zr.value * 1.25);
	$('ptOut').onclick = () => zSetz(+zr.value / 1.25);
	$('ptProz').onclick = $('ptFit').onclick = () => zSetz(100);
	$('ptVgl').onclick = () => $('favCmp').click();
	// Kopfzeile: Ortsname führt zum Bereich „Ort“
	$('hdrProjekt').onclick = () => {
		if (advOpen) showAdvanced(false);
		goStep('ort');
		sheetZeigen(true);
	};
	$('advBack').onclick = () => showAdvanced(false);
	all('[data-dice]').forEach((b) => (b.onclick = surprise));
	$('wzPick').onclick = () => {
		app.bleibAusschnitt = true;
		openPicker(false);
	};

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
	// Zoom-Regler im Bereich „Ort“ (gleiche Skala wie der Regler in „Alle Einstellungen“)
	const kz = /** @type {HTMLInputElement} */ ($('wzZoomR'));
	kz.addEventListener('input', () => {
		begin();
		app.S.view.z = sliderToZ(+kz.value, app.S.view);
		clampView(app.S.view);
		render();
	});
	kz.addEventListener('change', () => commit());
	// Kartendetails: Straßen & Gebäude / nur Straßen / nur Gebäude (bleibt beim Stilwechsel erhalten)
	all('#wzZeig button').forEach(
		(b) =>
			(b.onclick = () =>
				smooth(() =>
					change(() => {
						const S = app.S,
							z = b.dataset.zg;
						S.zeig = z;
						const P = PRESETS[S.preset].cls;
						S.cls.haus.h = z === 'strassen';
						// Wege/Bahn zurück wie im Stil vorgesehen, Haupt-/Nebenstraßen immer sichtbar (außer „nur Gebäude“)
						STRASSEN.forEach((k) => S.cls[k] && (S.cls[k].h = z === 'haeuser' ? true : k === 'haupt' || k === 'neben' ? false : !!(P[k] && P[k].h)));
					})
				))
	);
	$('wzOrtsnamen').addEventListener('change', (e) => {
		const an = /** @type {HTMLInputElement} */ (e.target).checked;
		change(() => (app.S.mode === 'std' ? (app.S.labels = an) : (app.S.ortsnamen = an)));
	});
	// Ausrichtung: Hoch/Quadrat/Quer – mit Druckgröße über „Querformat“, sonst passendes Seitenverhältnis
	all('#wzAusr button').forEach(
		(b) =>
			(b.onclick = () =>
				smooth(() =>
					change(() => {
						const S = app.S,
							o = b.dataset.o;
						const pr = S.print && /** @type {any} */ (SIZES)[S.print.k];
						const quadratDruck = pr && pr.w === pr.h;
						if (pr && !quadratDruck && o !== 'quadrat') {
							S.print.q = o === 'quer';
							fitPrint(S);
						} else {
							S.print = null;
							const r = o === 'hoch' ? 4 / 3 : o === 'quer' ? 3 / 4 : 1;
							for (let i = 0; i < 3; i++) {
								const g = geo();
								const a = (g.W * r - (g.H - g.MH)) / 1004;
								if (Number.isFinite(a)) S.view.a = Math.max(0.4, Math.min(2.4, +a.toFixed(4)));
							}
						}
						clampView(S.view);
					})
				))
	);
	$('wzZIn').onclick = () => $('zIn').click();
	$('wzZOut').onclick = () => $('zOut').click();
	$('wzReset').onclick = () => $('vReset').click();

	// 3 Stil
	Object.entries(PRESETS).forEach(([k, p]) => {
		const b = card(document.createElement('button'), `<div class="th" style="background:${p.bg === 'none' ? '#fff' : p.bg}"><img src="${vorschauBild('stil', k)}" alt="" loading="lazy" decoding="async"></div><span class="nm">${p.name}</span>`);
		b.dataset.p = k;
		b.title = p.desc || '';
		b.onclick = () =>
			waehle(b, () =>
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
				if (m === 'koord') return enableKoord();
				if (m === 'wolke') return enableWolke();
				smooth(() =>
					change(() => {
						app.S.motif = 'karte';
						app.S.mode = m;
					})
				);
				if (app.S.mode === 'std') ensureRaster();
			})
	);

	// Gruppen: Chips über den Listen (alle sichtbar, umbrechend) + Überschriften in den Listen
	// (erst nachdem alle Karten erzeugt sind – das passiert weiter unten)
	setTimeout(() => {
		gruppieren('p');
		gruppieren('d');
	}, 0);
	['p', 'd'].forEach((attr) => {
		const [kat] = LISTE[attr];
		$(kat).innerHTML =
			`<button type="button" role="tab" aria-selected="true" data-w="" class="on">Alle</button>` +
			GRUPPEN[attr].map((g) => `<button type="button" role="tab" aria-selected="false" data-w="${g.id}" title="${g.desc}">${g.name}${g.neu ? ' <i>Neu</i>' : ''}</button>`).join('');
		all(`#${kat} button`).forEach((b) => (b.onclick = () => weltWaehlen(/** @type {string} */ (b.dataset.w), attr)));
	});

	// Wie viel vom Ort? (statt + / −)
	all('#wzUmfang button').forEach(
		(b) =>
			(b.onclick = () =>
				smooth(() =>
					change(() => {
						const S = app.S;
						const v = { ...defView(), a: S.view.a };
						v.z = b.dataset.z === 'kern' ? 1.7 : b.dataset.z === 'ort' ? 1 : extZmin(v);
						S.view = v;
						clampView(S.view);
					})
				))
	);

	// Widmungs-Ideen zum Antippen
	[
		'Hier hat alles begonnen',
		'Unser Zuhause seit …',
		'Wo unser Herz wohnt',
		'Willkommen auf der Welt',
		'Heimat ist kein Ort, sondern ein Gefühl',
		'Hier haben wir Ja gesagt'
	].forEach((t) => {
		const b = document.createElement('button');
		b.type = 'button';
		b.textContent = t;
		b.onclick = () => {
			change(() => (app.S.note = { ...(app.S.note || {}), on: true, auto: false, text: t }));
			// „…“ = hier fehlt noch etwas (z. B. das Jahr) → Eingabefeld mit Cursor ans Ende
			if (t.includes('…')) {
				const inp = /** @type {HTMLInputElement} */ ($('wzNote'));
				inp.focus();
				inp.setSelectionRange(inp.value.length - 1, inp.value.length);
			}
		};
		$('wzNoteIdeen').appendChild(b);
	});

	// Mein Standort (Startseite und Schritt „Ort“)
	['lgeo', 'wgeo'].forEach((id) => ($(id).onclick = () => meinStandort(pickPlace, (t) => t && msg(t, t.includes('…') ? 'busy' : 'err'))));

	// Wortwolke
	{
		const ta = /** @type {HTMLTextAreaElement} */ ($('wolkeText'));
		ta.addEventListener('input', () => {
			begin();
			app.S.wolke = { ...app.S.wolke, text: ta.value.slice(0, 800) };
			render();
		});
		ta.addEventListener('change', () => commit());
		Object.entries(WOLKE_FORMEN).forEach(([k, name]) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.dataset.f = k;
			b.textContent = name;
			b.onclick = () => smooth(() => change(() => (app.S.wolke = { ...app.S.wolke, form: k })));
			$('wolkeForm').appendChild(b);
		});
		$('wolkeSchrift').addEventListener('change', (e) => change(() => (app.S.wolke = { ...app.S.wolke, schrift: /** @type {HTMLInputElement} */ (e.target).checked })));
	}
	$('wzWider').onclick = () => {
		app.bleibAusschnitt = true;
		gegendVergroessern();
	};

	// Koordinaten-Poster
	{
		const ta = /** @type {HTMLTextAreaElement} */ ($('koordText'));
		ta.addEventListener('input', () => {
			begin();
			app.S.koord = { ...app.S.koord, text: ta.value.slice(0, 600) };
			render();
		});
		ta.addEventListener('change', () => commit());
		all('#koordAlign button').forEach((b) => (b.onclick = () => change(() => (app.S.koord = { ...app.S.koord, align: b.dataset.a }))));
	}
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
		const b = card(document.createElement('button'), `<div class="dth"><img src="${vorschauBild('design', k)}" alt="" loading="lazy" decoding="async"></div><span class="nm">${D.name}</span>`);
		b.dataset.d = k;
		b.title = D.desc;
		b.onclick = () => waehle(b, () => change(() => pickDesign(app.S, k)));
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
	// Zusatztexte für Steckbrief/Kasten
	/** @type {[string, string][]} */ ([['wzInfoKopf', 'kopf'], ['wzInfoNr', 'nr'], ['wzInfoKicker', 'kicker'], ['wzInfoFakten', 'fakten'], ['wzInfoAbsatz', 'absatz']]).forEach(([id, k]) =>
		textInput(id, (v) => (app.S.info = { ...(app.S.info || {}), [k]: v }))
	);
	// Fokus & Typografie anpassen
	const setInfo = (/** @type {string} */ k, /** @type {any} */ v) => (app.S.info = { ...(app.S.info || {}), [k]: v });
	const setTypo = (/** @type {string} */ k, /** @type {any} */ v) => (app.S.typo = { ...(app.S.typo || {}), [k]: v });
	all('#wzFokusFarben button').forEach((b) => (b.onclick = () => smooth(() => change(() => setInfo('fokus', b.dataset.c || '')))));
	all('#wzFokusForm button').forEach((b) => (b.onclick = () => smooth(() => change(() => setInfo('fokusForm', b.dataset.v)))));
	all('#wzTypoStil button').forEach((b) => (b.onclick = () => smooth(() => change(() => setTypo('stil', b.dataset.v)))));
	all('#wzTypoSchrift button').forEach((b) => (b.onclick = () => smooth(() => change(() => setTypo('schrift', b.dataset.v)))));
	all('#wzTypoZeilen button').forEach((b) => (b.onclick = () => smooth(() => change(() => setTypo('zeilen', +(b.dataset.v || 0))))));
	all('#wzTypoFarben button').forEach((b) => (b.onclick = () => smooth(() => change(() => setTypo('farbe', b.dataset.c || '')))));
	/** Schieberegler/Farbwähler: live zeichnen, ein Rückgängig-Schritt je Bewegung */
	const regler = (/** @type {string} */ id, /** @type {(v: string) => void} */ set) => {
		const e = /** @type {HTMLInputElement} */ ($(id));
		e.addEventListener('input', () => {
			begin();
			set(e.value);
			render();
		});
		e.addEventListener('change', () => commit());
	};
	regler('wzFokusGr', (v) => setInfo('fokusGr', +v));
	regler('wzFokusX', (v) => setInfo('fokusX', +v));
	regler('wzFokusY', (v) => setInfo('fokusY', +v));
	regler('wzFokusEigen', (v) => setInfo('fokus', v));
	regler('wzTypoDeck', (v) => setTypo('deck', +v));
	regler('wzTypoEigen', (v) => setTypo('farbe', v));
	$('wzCoords').addEventListener('change', (e) =>
		change(() => (app.S.lay = { ...(app.S.lay || {}), coords: /** @type {HTMLInputElement} */ (e.target).checked }))
	);

	// 6 Produkt
	const PICON = {
		poster: '<rect x="9" y="5" width="22" height="30" rx="1.5"/>',
		gerahmt: '<rect x="7" y="3" width="26" height="34" rx="2" stroke-width="3.2"/><rect x="12" y="9" width="16" height="22"/>',
		leinwand: '<path d="M8 6h22v28H8z"/><path d="M30 6l3 3v28l-3-3M8 34l3 3h22"/>',
		shirt: '<path d="M14 5c2 3 10 3 12 0l8 4 4 9-6 3-1-2v17H9V19l-1 2-6-3 4-9z"/>',
		tasse: '<path d="M7 8h20v22c0 3-3 5-10 5S7 33 7 30z"/><path d="M27 13c7-1 7 11 0 10"/>',
		alu: '<rect x="8" y="5" width="24" height="30" rx="1"/><path d="M11 8h18v24" stroke-opacity=".45"/>',
		aufsteller: '<rect x="11" y="6" width="18" height="24" rx="1.5" stroke-width="2.6"/><path d="M20 30l-5 7M20 30l5 7"/>',
		download: '<path d="M20 6v18M13 17l7 7 7-7"/><path d="M8 28v6h24v-6"/>'
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
	initForm();
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
	/** @param {string} id @param {'paper'|'vig'|'glow'|'schatten'|'relief'|'h3d'|'gelaende'} key */
	const fxToggle = (id, key) =>
		$(id).addEventListener('change', (e) => change(() => (app.S.fx = { ...(app.S.fx || {}), [key]: /** @type {HTMLInputElement} */ (e.target).checked })));
	fxToggle('fxPaper', 'paper');
	fxToggle('fxVig', 'vig');
	fxToggle('fxGlow', 'glow');
	fxToggle('fxSchatten', 'schatten');
	fxToggle('fxH3d', 'h3d');
	fxToggle('fxGelaende', 'gelaende');
	fxToggle('fxRelief', 'relief');
	const kipp = /** @type {HTMLInputElement} */ ($('fxKipp'));
	kipp.addEventListener('input', () => {
		begin();
		app.S.fx = { ...(app.S.fx || {}), kipp: +kipp.value };
		render();
	});
	kipp.addEventListener('change', () => commit());
	const dreh = /** @type {HTMLInputElement} */ ($('fxDreh'));
	dreh.addEventListener('input', () => {
		begin();
		app.S.fx = { ...(app.S.fx || {}), dreh: +dreh.value };
		render();
	});
	dreh.addEventListener('change', () => commit());
	$('softproof').addEventListener('change', (e) => document.body.classList.toggle('softproof', /** @type {HTMLInputElement} */ (e.target).checked));

	// Schrift-Paare (Titel + Untertitel)
	all('#wzFonts button').forEach(
		(b) =>
			(b.onclick = () =>
				smooth(() =>
					change(() => {
						const S = app.S;
						const tf = /** @type {string} */ (b.dataset.t),
							sf = /** @type {string} */ (b.dataset.s);
						const was = S.title.font;
						S.title.font = tf;
						S.title.fontDesign = false;
						S.sub.font = sf;
						const t = S.title.text || '';
						// Schreibschrift sieht nur in normaler Schreibweise gut aus, Blockschrift in Großbuchstaben
						if (tf === 'SgSC' && was !== 'SgSC') {
							if (t === t.toUpperCase()) S.title.text = t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (/** @type {string} */ m, /** @type {string} */ a, /** @type {string} */ c) => a + c.toUpperCase());
							S.title.lsPrev = S.title.ls;
							S.title.ls = 0;
							S.title.size = Math.round(S.title.size * 1.5);
						} else if (tf !== 'SgSC' && was === 'SgSC') {
							S.title.text = t.toUpperCase();
							S.title.ls = S.title.lsPrev ?? 14;
							S.title.size = Math.round(S.title.size / 1.5);
						}
					})
				))
	);

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
	$('mkSet').addEventListener('change', (e) => setProduct({ set: /** @type {HTMLInputElement} */ (e.target).checked }));
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
