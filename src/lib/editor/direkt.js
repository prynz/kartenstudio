// Bedienung direkt am Poster: Text im Poster ändern, kurze Einführung beim ersten Mal,
// „Gespeichert ✓“, Favoriten mit Vergleich, Vorschau als Bild teilen.
import { app as appUntyped } from './app.js';
import { begin, commit, change, clampView } from './zustand.js';
import { alsBild, buildSVG, render, vorschauSVG } from './zeichnen.js';
import { renderPNG, dlPlain } from '../export/export.js';
import { EASE, reducedMotion } from './animation.js';
import { msg } from './ansicht.js';

/** @type {any} */
const app = appUntyped;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
/** @param {string} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** @param {any} o */
const kopie = (o) => JSON.parse(JSON.stringify(o));

/* ---------- Text direkt im Poster ändern ---------- */
/** @type {HTMLInputElement|null} */
let feld = null;
/**
 * Eingabefeld genau über Titel/Untertitel im Poster öffnen.
 * @param {'title'|'sub'} k
 */
export function textImPoster(k) {
	schliesseFeld();
	const el = app.poster && app.poster.querySelector(k === 'title' ? '#titel' : '#untertitel');
	if (!el || !app.S || !app.S[k]) return false;
	const r = el.getBoundingClientRect();
	if (!r.width || !r.height) return false;
	const f = document.createElement('input');
	f.type = 'text';
	f.className = 'pe-feld';
	f.value = app.S[k].text || '';
	f.setAttribute('aria-label', k === 'title' ? 'Titel' : 'Untertitel');
	f.enterKeyHint = 'done';
	const b = Math.max(220, r.width + 32);
	f.style.left = Math.max(8, Math.min(innerWidth - b - 8, r.left + r.width / 2 - b / 2)) + 'px';
	f.style.top = r.top + r.height / 2 + 'px';
	f.style.width = b + 'px';
	f.style.fontSize = Math.max(16, Math.min(34, r.height * 0.6)) + 'px';
	document.body.appendChild(f);
	feld = f;
	begin();
	f.addEventListener('input', () => {
		app.S[k].text = f.value;
		render();
	});
	f.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' || e.key === 'Escape') schliesseFeld();
	});
	f.addEventListener('blur', () => setTimeout(schliesseFeld, 0));
	f.focus();
	f.select();
	if (!reducedMotion()) f.animate([{ opacity: 0, transform: 'translateY(-50%) scale(.96)' }, { opacity: 1, transform: 'translateY(-50%)' }], { duration: 200, easing: EASE });
	return true;
}
function schliesseFeld() {
	if (!feld) return;
	const f = feld;
	feld = null;
	f.remove();
	commit();
	render();
}

/* ---------- Einführung beim ersten Mal ---------- */
const TIPPS_KEY = 'kartenstudio.tipps.v1';
/** @type {[string, string, string][]} Ziel, Überschrift, Text */
const TIPPS = [
	['#poster', 'Karte verschieben', 'Zieh die Karte direkt im Poster. Zoomen geht mit zwei Fingern oder dem Mausrad.'],
	['#titel', 'Text antippen', 'Tipp auf den Ortsnamen – du kannst ihn gleich im Poster ändern.'],
	['#wzNext', 'Schritt für Schritt', 'Hier geht es weiter. Alles wird automatisch gespeichert.']
];
let tippAktiv = false;
export function einfuehrung() {
	try {
		if (localStorage.getItem(TIPPS_KEY)) return;
	} catch (e) {
		return;
	}
	if (tippAktiv) return;
	tippAktiv = true;
	setTimeout(() => zeigeTipp(0), 900);
}
/** @param {number} i */
function zeigeTipp(i) {
	document.querySelector('.coach')?.remove();
	const fertig = () => {
		document.querySelector('.coach')?.remove();
		tippAktiv = false;
		try {
			localStorage.setItem(TIPPS_KEY, '1');
		} catch (e) {}
	};
	if (i >= TIPPS.length) return fertig();
	const [sel, h, t] = TIPPS[i];
	const ziel = /** @type {HTMLElement|null} */ (document.querySelector(sel));
	const r = ziel && ziel.getBoundingClientRect();
	if (!r || !r.width) return zeigeTipp(i + 1);
	const c = document.createElement('div');
	c.className = 'coach';
	c.setAttribute('role', 'dialog');
	c.innerHTML = `<b>${esc(h)}</b><p>${esc(t)}</p><div class="coach-f"><span>${i + 1} / ${TIPPS.length}</span><button type="button" class="coach-x">Überspringen</button><button type="button" class="coach-ok">${i === TIPPS.length - 1 ? 'Los geht’s' : 'Weiter'}</button></div>`;
	document.body.appendChild(c);
	const w = c.offsetWidth,
		hh = c.offsetHeight;
	// Großes Ziel (Poster): Hinweis in die Mitte, sonst darüber oder darunter
	let top, left;
	if (r.height > innerHeight * 0.4) {
		top = r.top + r.height * 0.3;
		left = r.left + r.width / 2 - w / 2;
	} else {
		const oben = r.top > hh + 24;
		top = oben ? r.top - hh - 12 : r.bottom + 12;
		left = r.left + r.width / 2 - w / 2;
		c.classList.add(oben ? 'oben' : 'unten');
	}
	c.style.left = Math.max(10, Math.min(innerWidth - w - 10, left)) + 'px';
	c.style.top = Math.max(10, Math.min(innerHeight - hh - 10, top)) + 'px';
	if (!reducedMotion()) c.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE });
	/** @type {HTMLElement} */ (c.querySelector('.coach-ok')).onclick = () => zeigeTipp(i + 1);
	/** @type {HTMLElement} */ (c.querySelector('.coach-x')).onclick = fertig;
}

/* ---------- „Gespeichert ✓“ ---------- */
let gespTimer = 0;
export function gespeichertZeigen() {
	const e = document.getElementById('gespeichert');
	if (!e) return;
	e.classList.add('on');
	clearTimeout(gespTimer);
	gespTimer = window.setTimeout(() => e.classList.remove('on'), 1800);
}

/* ---------- Favoriten & Vergleich ---------- */
const FAV_KEY = 'kartenstudio.favoriten.v1';
/** @returns {{t:number, place:string, S:any}[]} */
function favoriten() {
	try {
		const v = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
		return Array.isArray(v) ? v.filter((f) => f && f.S && f.S.view) : [];
	} catch (e) {
		return [];
	}
}
/** @param {{t:number, place:string, S:any}[]} l */
function favSpeichern(l) {
	try {
		localStorage.setItem(FAV_KEY, JSON.stringify(l.slice(0, 12)));
		return true;
	} catch (e) {
		msg('Speicher voll – bitte einen Favoriten löschen', 'err');
		return false;
	}
}
const hier = () => favoriten().filter((f) => app.DATA && f.place === app.DATA.place);

/** Vorschaubild eines gespeicherten Zustands (klein = kleines Bild für die Liste) @param {any} S @param {number} w */
function bildVon(S, w) {
	const keep = app.S;
	let svg = '';
	try {
		app.S = kopie(S);
		clampView(app.S.view);
		svg = w < 400 ? vorschauSVG() : buildSVG(true);
	} finally {
		app.S = keep;
	}
	return alsBild(svg, w);
}

/** @type {string[]} */
let favUrls = [];
let favKey = '';
export function favoritenZeichnen() {
	const box = document.getElementById('favBox');
	if (!box || !app.DATA) return;
	const l = hier();
	const key = String(app.DATA.place) + l.map((f) => f.t).join();
	if (key === favKey) return;
	favKey = key;
	favUrls.forEach((u) => URL.revokeObjectURL(u));
	favUrls = [];
	box.hidden = !l.length;
	$('favN').textContent = String(l.length);
	$('favCmp').hidden = l.length < 2;
	const grid = $('favGrid');
	grid.innerHTML = l.map((f) => `<div class="fav" data-t="${f.t}"><button type="button" class="fav-img" data-t="${f.t}" aria-label="Favorit übernehmen"><img alt=""></button><button type="button" class="fav-x" data-x="${f.t}" aria-label="Favorit löschen">×</button></div>`).join('');
	l.forEach((f, i) =>
		setTimeout(async () => {
			if (favKey !== key) return;
			const u = await bildVon(f.S, 140);
			if (favKey !== key) return URL.revokeObjectURL(u);
			favUrls.push(u);
			const img = /** @type {HTMLImageElement|null} */ (grid.querySelector(`[data-t="${f.t}"] img`));
			if (img) img.src = u;
		}, 60 * i)
	);
}

function merken() {
	if (!app.DATA || !app.S) return;
	const l = favoriten();
	const jetzt = JSON.stringify(app.S);
	if (l.some((f) => f.place === app.DATA.place && JSON.stringify(f.S) === jetzt)) {
		msg('Diesen Entwurf hast du schon gemerkt', 'ok');
		return;
	}
	if (!favSpeichern([{ t: Date.now(), place: app.DATA.place, S: kopie(app.S) }, ...l])) return;
	const h = $('favBtn');
	h.classList.add('on');
	if (!reducedMotion()) h.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 360, easing: EASE });
	setTimeout(() => h.classList.remove('on'), 1200);
	msg('Gemerkt ♥ – unter „Gestalten“ kannst du Favoriten vergleichen', 'ok');
	favoritenZeichnen();
}
/** @param {number} t */
function uebernehmen(t) {
	const f = favoriten().find((x) => x.t === t);
	if (!f) return;
	change(() => {
		app.S = kopie(f.S);
		clampView(app.S.view);
	});
	msg('Favorit übernommen', 'ok');
}

function vergleichAuf() {
	const l = hier();
	const o = $('favOverlay');
	const g = $('favCmpGrid');
	g.style.setProperty('--n', String(Math.min(l.length, 4)));
	g.innerHTML = l.map((f) => `<button type="button" class="fc" data-t="${f.t}"><img alt=""><span>Diesen nehmen</span></button>`).join('');
	l.forEach(async (f) => {
		const u = await bildVon(f.S, 900);
		const img = /** @type {HTMLImageElement|null} */ (g.querySelector(`[data-t="${f.t}"] img`));
		if (img) img.src = u;
		else URL.revokeObjectURL(u);
	});
	o.hidden = false;
	if (!reducedMotion()) /** @type {HTMLElement} */ (o.firstElementChild).animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
}
function vergleichZu() {
	const o = $('favOverlay');
	o.hidden = true;
	$('favCmpGrid')
		.querySelectorAll('img')
		.forEach((i) => URL.revokeObjectURL(i.src));
}

/* ---------- Vorschau als Bild teilen ---------- */
async function bildTeilen() {
	if (!app.DATA) return;
	const btn = /** @type {HTMLButtonElement} */ ($('shareImg'));
	btn.disabled = true;
	try {
		const cv = await renderPNG(1400);
		// Weißer Hintergrund, damit das Bild im Messenger nicht schwarz erscheint
		const c2 = document.createElement('canvas');
		c2.width = cv.width;
		c2.height = cv.height;
		const x = /** @type {CanvasRenderingContext2D} */ (c2.getContext('2d'));
		x.fillStyle = '#ffffff';
		x.fillRect(0, 0, c2.width, c2.height);
		x.drawImage(cv, 0, 0);
		const blob = await new Promise((res) => c2.toBlob(res, 'image/jpeg', 0.9));
		const name = `${String(app.DATA.place || 'poster').replace(/[^\p{L}\p{N}]+/gu, '-')}-vorschau.jpg`;
		const file = new File([/** @type {Blob} */ (blob)], name, { type: 'image/jpeg' });
		const nav = /** @type {any} */ (navigator);
		if (nav.canShare && nav.canShare({ files: [file] })) {
			try {
				await nav.share({ files: [file], title: 'Mein Kartenposter', text: `Wie findest du mein Poster von ${app.DATA.place}?` });
			} catch (e) {
				/* abgebrochen */
			}
		} else {
			dlPlain(name, /** @type {Blob} */ (blob));
			msg('Vorschaubild gespeichert – jetzt z. B. per WhatsApp verschicken', 'ok');
		}
	} finally {
		btn.disabled = false;
	}
}

export function initDirekt() {
	$('favBtn').onclick = merken;
	$('favGrid').addEventListener('click', (e) => {
		const z = /** @type {HTMLElement} */ (e.target);
		const x = z.closest('[data-x]');
		if (x) {
			favSpeichern(favoriten().filter((f) => f.t !== +(/** @type {HTMLElement} */ (x).dataset.x || 0)));
			favoritenZeichnen();
			return;
		}
		const b = z.closest('.fav-img');
		if (b) uebernehmen(+(/** @type {HTMLElement} */ (b).dataset.t || 0));
	});
	$('favCmp').onclick = vergleichAuf;
	$('favClose').onclick = vergleichZu;
	$('favOverlay').addEventListener('click', (e) => {
		if (e.target === $('favOverlay')) return vergleichZu();
		const b = /** @type {HTMLElement} */ (e.target).closest('.fc');
		if (b) {
			uebernehmen(+(/** @type {HTMLElement} */ (b).dataset.t || 0));
			vergleichZu();
		}
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && !$('favOverlay').hidden) vergleichZu();
	});
	$('shareImg').onclick = bildTeilen;
	addEventListener('ks-gespeichert', gespeichertZeigen);
}
