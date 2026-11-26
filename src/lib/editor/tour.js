// Geführter Rundgang für Erstbesucher: vom Ort über Stil, Design, Text und Extras bis zu Größe,
// Herunterladen und Druck. Freiwillig: Beim ersten Mal fragt eine kleine Karte, ob man ihn sehen will.
// Jederzeit beendbar (✕, Esc), später über „Rundgang“ (Leiste) bzw. den Hilfe-Chat wieder startbar.
// Ein Lichtkegel (Spotlight) hebt den passenden Bereich hervor; die Bedienung bleibt dabei möglich.
import { app as appUntyped } from './app.js';
import { goStep, fertigReiter } from './assistent.js';
import { sheetZeigen } from './sheet.js';
import { EASE, reducedMotion } from './animation.js';

/** @type {any} */
const app = appUntyped;

export const TOUR_KEY = 'kartenstudio.tipps.v1';
const handy = () => matchMedia('(max-width: 900px)').matches;
/** sichtbar? (offsetParent taugt nicht für fest positionierte Elemente wie die Handy-Leiste) @param {Element|null} e */
const sichtbar = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';

/**
 * Stationen: Ziel (CSS-Auswahl, erste sichtbare), Bereich, Überschrift, Text.
 * `pc`/`ip` = abweichendes Ziel am PC/Handy.
 * @type {{ziel:string, ip?:string, step?:string, reiter?:string, titel:string, text:string, poster?:boolean}[]}
 */
const STATIONEN = [
	{ ziel: '#canvas', poster: true, titel: 'Dein Poster', text: 'Hier siehst du jede Änderung sofort. Karte mit Maus oder Finger ziehen, mit Mausrad oder zwei Fingern zoomen. Titel antippen = direkt bearbeiten.' },
	{ ziel: '#wzSteps', step: 'ort', titel: 'Sechs Bereiche – von oben nach unten', text: 'Ort → Stil → Design → Text → Extras → Fertig. Du kannst jederzeit springen; „Weiter“ führt dich der Reihe nach durch.' },
	{ ziel: '.oa-box', step: 'ort', titel: '1 · Ort & Ausschnitt', text: 'Wähle, wie viel vom Ort aufs Poster kommt – Ortskern, ganzer Ort oder mit Umgebung. Darunter: Ausrichtung, Straßen/Gebäude und Routen.' },
	{ ziel: '#wzVorschlaege', step: 'stil', titel: '2 · Stil = die Farben', text: 'Tipp einen fertigen Vorschlag an – oder such dir unten einen Look aus den Gruppen (hell, dunkel, farbig …).' },
	{ ziel: '#wzDesignKat', step: 'design', titel: '3 · Design = der Aufbau', text: 'Rahmen, Formen wie Kreis oder Herz, große Buchstaben … Die Farben vom Stil bleiben dabei erhalten.' },
	{ ziel: '#wzTitle', step: 'text', titel: '4 · Text', text: 'Titel und Untertitel ändern, Schrift wählen und eine persönliche Widmung oder ein Datum hinzufügen.' },
	{ ziel: '#wzPinAdd', step: 'extras', titel: '5 · Extras – alles freiwillig', text: 'Herz oder Pin an euren Ort setzen, Papier-Struktur, Gelände oder 3D-Häuser. Kann man auch einfach überspringen.' },
	{ ziel: '#wzProd', step: 'fertig', reiter: 'produkt', titel: '6 · Produkt & Größe', text: 'Poster, Rahmen, Leinwand oder T-Shirt wählen und darunter die Druckgröße. Die Vorschau zeigt dein Poster an der Wand.' },
	{ ziel: '.wz-dl', step: 'fertig', reiter: 'laden', titel: 'Herunterladen & drucken', text: 'PDF für die Druckerei (gestochen scharf, mit Beschnitt), PNG oder SVG. Die Ampel darüber prüft, ob die Qualität für deine Größe reicht.' },
	{ ziel: '.hdr-mitte', ip: '#chatBtn', titel: 'Gespeichert – und Hilfe', text: 'Alles wird automatisch gespeichert, Rückgängig geht jederzeit. Fragen? Im Hilfe-Chat findest du Antworten – und diesen Rundgang zum Wiederholen.' }
];

let aktiv = -1;
/** @type {HTMLElement|null} */ let spot = null;
/** @type {HTMLElement|null} */ let blase = null;
/** @type {HTMLElement|null} */ let ziel = null;
let raf = 0;

/** Schon gesehen/abgelehnt merken */
function merken() {
	try {
		localStorage.setItem(TOUR_KEY, '1');
	} catch (e) {
		/* privat/gesperrt – egal */
	}
}

/** Beim ersten Besuch (nach dem Laden der Karte) kurz fragen, ob man den Rundgang möchte */
export function tourAnbieten() {
	try {
		if (localStorage.getItem(TOUR_KEY)) return;
	} catch (e) {
		return;
	}
	if (document.querySelector('.tour-frage') || aktiv >= 0) return;
	setTimeout(() => {
		if (!app.DATA || document.querySelector('#landing:not(.hidden)')) return;
		const k = document.createElement('div');
		k.className = 'tour-frage';
		k.setAttribute('role', 'dialog');
		k.setAttribute('aria-label', 'Rundgang anbieten');
		k.innerHTML = `<div class="tour-frage-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg></div>
<div><b>Neu hier? Kurzer Rundgang?</b><p>In einer Minute zeige ich dir, wie du vom Ort bis zum fertigen Druck kommst.</p>
<div class="tour-frage-k"><button type="button" class="tour-ja">Rundgang starten</button><button type="button" class="tour-nein">Nein danke</button></div></div>`;
		document.body.appendChild(k);
		if (!reducedMotion()) k.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
		const weg = () => {
			merken();
			k.remove();
		};
		/** @type {HTMLElement} */ (k.querySelector('.tour-ja')).onclick = () => {
			weg();
			tourStarten();
		};
		/** @type {HTMLElement} */ (k.querySelector('.tour-nein')).onclick = weg;
	}, 900);
}

/** Rundgang (erneut) starten */
export function tourStarten() {
	document.querySelector('.tour-frage')?.remove();
	if (!app.DATA) return;
	merken();
	if (!spot) {
		spot = document.createElement('div');
		spot.className = 'tour-spot';
		spot.setAttribute('aria-hidden', 'true');
		blase = document.createElement('div');
		blase.className = 'tour-blase';
		blase.setAttribute('role', 'dialog');
		blase.setAttribute('aria-live', 'polite');
		document.body.append(spot, blase);
		document.addEventListener('keydown', tasten, true);
		window.addEventListener('resize', platzieren);
	}
	document.body.classList.add('tour-an');
	zeige(0);
}

/** Rundgang beenden */
export function tourBeenden() {
	aktiv = -1;
	cancelAnimationFrame(raf);
	document.removeEventListener('keydown', tasten, true);
	window.removeEventListener('resize', platzieren);
	document.body.classList.remove('tour-an');
	const s = spot,
		b = blase;
	spot = blase = ziel = null;
	if (reducedMotion() || !s) {
		s?.remove();
		b?.remove();
		return;
	}
	s.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: EASE }).onfinish = () => s.remove();
	b?.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 180, easing: EASE }).finished.then(() => b.remove());
}

/** @param {KeyboardEvent} e */
function tasten(e) {
	if (aktiv < 0) return;
	if (e.key === 'Escape') {
		e.stopPropagation();
		tourBeenden();
	} else if (e.key === 'ArrowRight' && !istEingabe(e)) zeige(aktiv + 1);
	else if (e.key === 'ArrowLeft' && !istEingabe(e)) zeige(aktiv - 1);
}
const istEingabe = (/** @type {Event} */ e) => /** @type {HTMLElement} */ (e.target).closest('input, textarea, select');

/** Station i zeigen @param {number} i */
function zeige(i) {
	if (i >= STATIONEN.length) return tourBeenden();
	if (i < 0) return;
	aktiv = i;
	const S = STATIONEN[i];
	// Bereich öffnen (Handy: Einstellungsfeld auf, außer beim Poster)
	if (S.step) goStep(S.step);
	if (S.reiter) fertigReiter(S.reiter);
	if (handy()) sheetZeigen(!S.poster && !(S.ip && S.ip.startsWith('#chat')) && S.ziel !== '#wzSteps');
	const b = /** @type {HTMLElement} */ (blase);
	b.innerHTML = `<div class="tour-kopf"><span>${i + 1} / ${STATIONEN.length}</span><button type="button" class="tour-x" aria-label="Rundgang beenden" title="Rundgang beenden (Esc)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
<b>${S.titel}</b><p>${S.text}</p>
<div class="tour-punkte" aria-hidden="true">${STATIONEN.map((_, k) => `<i${k === i ? ' class="an"' : k < i ? ' class="war"' : ''}></i>`).join('')}</div>
<div class="tour-fuss">${i ? '<button type="button" class="tour-zurueck">Zurück</button>' : '<button type="button" class="tour-ende">Überspringen</button>'}<button type="button" class="tour-weiter">${i === STATIONEN.length - 1 ? 'Los geht’s' : 'Weiter'}</button></div>`;
	/** @type {HTMLElement} */ (b.querySelector('.tour-x')).onclick = tourBeenden;
	/** @type {HTMLElement} */ (b.querySelector('.tour-weiter')).onclick = () => zeige(i + 1);
	const z = b.querySelector('.tour-zurueck');
	if (z) /** @type {HTMLElement} */ (z).onclick = () => zeige(i - 1);
	const e = b.querySelector('.tour-ende');
	if (e) /** @type {HTMLElement} */ (e).onclick = tourBeenden;
	// Ziel suchen, in Sicht holen; Position nach dem Gleiten des Bereichs (≈ 300 ms) nachführen
	const sel = (handy() && S.ip) || S.ziel;
	ziel = /** @type {HTMLElement|null} */ ([...document.querySelectorAll(sel)].find(sichtbar) || null);
	if (ziel && !S.poster && S.ziel !== '#wzSteps' && !S.ziel.startsWith('.hdr')) ziel.scrollIntoView({ block: 'nearest', behavior: 'auto' });
	if (!reducedMotion()) b.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
	/** @type {HTMLElement} */ (b.querySelector('.tour-weiter')).focus({ preventScroll: true });
	// einige Bilder lang nachführen (Bereich gleitet herein, Sheet öffnet sich)
	const bis = performance.now() + 650;
	cancelAnimationFrame(raf);
	const lauf = () => {
		platzieren();
		if (performance.now() < bis) raf = requestAnimationFrame(lauf);
	};
	lauf();
}

/** Spotlight auf das Ziel, Sprechblase daneben (PC rechts/links, Handy darüber/darunter) */
function platzieren() {
	if (aktiv < 0 || !spot || !blase) return;
	const S = STATIONEN[aktiv];
	const r = sichtbar(ziel) ? /** @type {HTMLElement} */ (ziel).getBoundingClientRect() : null;
	const W = innerWidth,
		H = innerHeight,
		m = 8;
	if (r && r.width) {
		// Poster: nur das sichtbare Stück hervorheben
		const x0 = Math.max(4, r.left - m),
			y0 = Math.max(4, r.top - m),
			x1 = Math.min(W - 4, r.right + m),
			y1 = Math.min(H - 4, r.bottom + m);
		spot.style.transform = `translate(${x0}px,${y0}px)`;
		spot.style.width = `${Math.max(0, x1 - x0)}px`;
		spot.style.height = `${Math.max(0, y1 - y0)}px`;
		spot.classList.remove('leer');
	} else spot.classList.add('leer');
	const bw = blase.offsetWidth,
		bh = blase.offsetHeight;
	let x, y;
	if (!r || !r.width || S.poster) {
		// mittig unten im Poster bzw. Bildschirm
		x = (r ? r.left + r.width / 2 : W / 2) - bw / 2;
		y = r ? Math.min(r.bottom - bh - 24, r.top + r.height * 0.55) : H / 2 - bh / 2;
	} else if (!handy() && r.right + 16 + bw < W && r.width < W * 0.5) {
		x = r.right + 16;
		y = r.top + Math.min(r.height, 120) / 2 - 40;
	} else if (r.top > bh + 24) {
		x = r.left + r.width / 2 - bw / 2;
		y = r.top - bh - 14;
	} else {
		x = r.left + r.width / 2 - bw / 2;
		y = Math.min(r.bottom + 14, H - bh - 10);
	}
	blase.style.transform = `translate(${Math.round(Math.max(10, Math.min(W - bw - 10, x)))}px,${Math.round(Math.max(10, Math.min(H - bh - 10, y)))}px)`;
}
