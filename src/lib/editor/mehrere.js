// Mehrere Orte auf einem Poster (z. B. „Kennengelernt – Geheiratet – Zuhause“).
// Der aktuell geladene Ort ist Ort 1; bis zu zwei weitere werden im Hintergrund geladen.
// Alle Orte teilen sich Stil und Farben; jeder Ort bekommt einen Kreis und eine Beschriftung.
import { app as appUntyped } from './app.js';
import { MW, esc } from './basis.js';
import { begin, change, commit, defView } from './zustand.js';
import { attachSearch } from '../karte/suche.js';
import { placeBounds } from '../karte/ortswahl-start.js';
import { render } from './zeichnen.js';
import { DESIGNS } from '../themen/designs.js';
import { PRESETS } from '../themen/vorlagen.js';
import { applyDesign, inkColor } from '../themen/designs.js';
import { mapContent, TCP } from './zeichnen.js';
import { tileData } from './laden.js';

/** @type {any} */
const app = appUntyped;

/** Geladene Kartendaten der Zusatzorte, Schlüssel = Ausschnitt */
const CACHE = new Map();
/** @type {Set<string>} */
const LOADING = new Set();
/** @type {() => void} */
let onLoaded = () => {};
/** @param {() => void} fn */
export const setMultiLoaded = (fn) => (onLoaded = fn);

/** @param {any} b */
const keyOf = (b) => [b.w, b.n, b.e, b.s].map((x) => (+x).toFixed(5)).join(',');

/** Daten eines Zusatzorts (lädt beim ersten Mal im Hintergrund) @param {any} it */
export function itemData(it) {
	const k = keyOf(it.b);
	if (CACHE.has(k)) return CACHE.get(k);
	if (!LOADING.has(k)) {
		LOADING.add(k);
		tileData(it.b, { name: it.name, region: '', center: [(it.b.w + it.b.e) / 2, (it.b.n + it.b.s) / 2] }).then((d) => {
			LOADING.delete(k);
			CACHE.set(k, d || false);
			onLoaded();
		});
	}
	return null;
}
export const multiOn = () => !!(app.S && app.S.multi && app.S.multi.on);
/** Alle Orte (Ort 1 = aktueller) mit Daten, soweit geladen */
export function multiItems() {
	const M = app.S.multi;
	const first = { name: (app.DATA && app.DATA.place) || 'Ort 1', label: M.label0 ?? '', z: M.z0 || 1, data: app.DATA, main: true };
	return [first, ...(M.items || []).map((/** @type {any} */ it) => ({ ...it, data: itemData(it) }))];
}

/**
 * Zusammengesetzte Karte: alle Orte als Kreise in der Kartenfläche (Breite MW × Höhe MH).
 * Das Ergebnis wird in die Ansicht der Hauptkarte gesetzt, die äußere Verschiebung wird aufgehoben.
 * @param {boolean} forExport
 */
export function multiSVG(forExport) {
	const S = app.S,
		v = S.view,
		MH = MW * v.a;
	const items = multiItems();
	const n = items.length;
	// Kreise nebeneinander oder untereinander – je nachdem, was größer wird
	const lab = Math.max(40, Math.min(70, MW * 0.06));
	const dCols = Math.min(MW / n, MH - lab) * 0.86;
	const dRows = Math.min(MW, MH / n - lab) * 0.86;
	const cols = dCols >= dRows;
	const d = Math.max(40, cols ? dCols : dRows);
	// Schrift auf dem Papier (nicht im Balken): passend zum Hintergrund
	const ink = inkColor(S);
	const font = S.sub.font === 'SgFR' ? 'SgFR' : 'SgMD'; // Schriften: siehe buildSVG (werden für den Export eingebettet)
	let o = `<g transform="translate(${(v.cx - MW / 2 / v.z).toFixed(3)},${(v.cy - MH / 2 / v.z).toFixed(3)}) scale(${(1 / v.z).toFixed(6)})">`;
	if (S.bg !== 'none') o += `<rect width="${MW}" height="${MH.toFixed(1)}" fill="${S.bg}"/>`;
	const keep = { DATA: app.DATA, view: S.view, ov: S.ov, scale: S.scale };
	items.forEach((it, i) => {
		const cx = cols ? (MW / n) * (i + 0.5) : MW / 2;
		const cy = cols ? (MH - lab) / 2 : (MH / n) * i + (MH / n - lab) / 2;
		const r = d / 2;
		o += `<defs><clipPath id="mo${i}"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"/></clipPath></defs>`;
		if (it.data) {
			try {
				// Ort vorübergehend als „aktuelle Karte“ einsetzen und zeichnen
				app.DATA = it.data;
				const iv = { ...defView(), z: it.z || 1 };
				iv.a = 1;
				S.view = iv;
				S.ov = it.main ? keep.ov : {};
				S.scale = keep.scale * Math.min(1.6, Math.max(0.55, (MW / d) * 0.55));
				TCP.p = `m${i}t`;
				const half = MW / 2 / iv.z;
				const vr = [iv.cx - half, iv.cy - half, iv.cx + half, iv.cy + half];
				let defs = '';
				(it.data.tiles || []).forEach((/** @type {number[]} */ t, /** @type {number} */ j) => {
					defs += `<clipPath id="m${i}t${j}"><rect x="${t[0].toFixed(2)}" y="${t[1].toFixed(2)}" width="${t[2].toFixed(2)}" height="${t[2].toFixed(2)}"/></clipPath>`;
				});
				const k = d / (2 * half);
				o += `<defs>${defs}</defs><g clip-path="url(#mo${i})"><g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) scale(${k.toFixed(5)}) translate(${(-iv.cx).toFixed(2)},${(-iv.cy).toFixed(2)})">${mapContent(true, vr)}</g></g>`;
			} finally {
				app.DATA = keep.DATA;
				S.view = keep.view;
				S.ov = keep.ov;
				S.scale = keep.scale;
				TCP.p = 'tc';
			}
		} else {
			o += `<text x="${cx.toFixed(1)}" y="${(cy + 8).toFixed(1)}" text-anchor="middle" font-family="SgMD" font-size="22" fill="${ink}" fill-opacity=".5">${it.data === false ? 'Keine Kartendaten' : 'lädt …'}</text>`;
		}
		o += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${ink}" stroke-width="${Math.max(2, d / 140).toFixed(1)}"/>`;
		// Beschriftung: Ortsname groß, darunter die eigene Zeile (z. B. „Kennengelernt · 2015“)
		const ty = cy + r + lab * 0.52;
		o += `<text x="${cx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" font-family="SgXB" font-size="${(lab * 0.4).toFixed(1)}" letter-spacing="${(lab * 0.08).toFixed(1)}" fill="${ink}">${esc(String(it.name).toUpperCase())}</text>`;
		if (it.label) o += `<text x="${cx.toFixed(1)}" y="${(ty + lab * 0.42).toFixed(1)}" text-anchor="middle" font-family="${font}" font-size="${(lab * 0.3).toFixed(1)}" fill="${ink}" fill-opacity=".85">${esc(it.label)}</text>`;
	});
	return o + '</g>';
}

/** Schlüssel für den Karten-Zwischenspeicher */
export function multiKey() {
	if (!multiOn()) return 0;
	return [app.S.multi, (app.S.multi.items || []).map((/** @type {any} */ it) => CACHE.has(keyOf(it.b)))];
}

/* ---------- Bedienung (Schritt „Ort“) ---------- */
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** Mehrere Orte ein-/ausschalten @param {boolean} on */
function setMulti(on) {
	change(() => {
		const S = app.S;
		S.multi = { items: [], label0: '', z0: 1, ...(S.multi || {}), on };
		if (on) {
			S.motif = 'karte';
			S.mode = 'art';
			// Kreise brauchen ein Design mit rechteckiger Kartenfläche und Text darunter
			const D = /** @type {any} */ (DESIGNS)[S.design || 'siegritz'];
			if (!D || D.aspect || (D.lay && D.lay.shape && D.lay.shape !== 'rect')) {
				applyDesign(S, 'galerie', /** @type {any} */ (PRESETS)[S.preset], true);
				if (S.aPrev) S.view.a = S.aPrev;
			}
			if (!S.print) S.view.a = 0.8;
		}
	});
}

export function initMulti() {
	setMultiLoaded(() => render());
	$('multiOn').addEventListener('change', (e) => setMulti(/** @type {HTMLInputElement} */ (e.target).checked));
	attachSearch('mq', 'mgo', 'mresults', (/** @type {any} */ f, /** @type {string} */ q) => {
		const p = f.properties;
		const [lon, lat] = f.geometry.coordinates;
		if ((app.S.multi.items || []).length >= 2) return;
		const it = { name: String(p.name || q).slice(0, 40), label: '', z: 1, b: placeBounds(p, lon, lat, 1) };
		change(() => (app.S.multi = { ...app.S.multi, items: [...(app.S.multi.items || []), it] }));
		/** @type {HTMLInputElement} */ ($('mq')).value = '';
	});
	// Ereignisse der Liste (einmal am Container, Liste wird neu gezeichnet)
	$('multiList').addEventListener('click', (e) => {
		const b = /** @type {HTMLElement} */ (e.target).closest('button');
		if (!b) return;
		const i = +(b.dataset.i || 0);
		const M = app.S.multi;
		if (b.dataset.act === 'rm') change(() => M.items.splice(i - 1, 1));
		if (b.dataset.act === 'zin' || b.dataset.act === 'zout') {
			const f = b.dataset.act === 'zin' ? 1.25 : 0.8;
			change(() => {
				if (i === 0) M.z0 = Math.min(4, Math.max(0.6, (M.z0 || 1) * f));
				else M.items[i - 1].z = Math.min(4, Math.max(0.6, (M.items[i - 1].z || 1) * f));
			});
		}
	});
	$('multiList').addEventListener('input', (e) => {
		const t = /** @type {HTMLInputElement} */ (e.target);
		if (!t.dataset.i) return;
		const i = +t.dataset.i;
		begin();
		if (i === 0) app.S.multi.label0 = t.value;
		else app.S.multi.items[i - 1].label = t.value;
		render();
	});
	$('multiList').addEventListener('change', () => commit());
}

let listKey = '';
export function syncMulti() {
	const M = app.S.multi;
	const on = !!(M && M.on);
	/** @type {HTMLInputElement} */ ($('multiOn')).checked = on;
	$('multiBox').classList.toggle('hidden', !on);
	if (!on) return;
	const items = [{ name: (app.DATA && app.DATA.place) || 'Ort 1', label: M.label0 || '' }, ...(M.items || [])];
	const key = JSON.stringify(items.map((x) => x.name)) + items.length;
	$('multiAdd').classList.toggle('hidden', items.length >= 3);
	if (key !== listKey) {
		listKey = key;
		$('multiList').innerHTML = items
			.map(
				(it, i) => `<div class="mo-row"><div class="mo-head"><b>${i + 1}. ${esc(it.name)}</b>
<span><button type="button" data-act="zout" data-i="${i}" aria-label="Ort ${i + 1} herauszoomen">−</button><button type="button" data-act="zin" data-i="${i}" aria-label="Ort ${i + 1} hineinzoomen">+</button>${i ? `<button type="button" data-act="rm" data-i="${i}" aria-label="Ort ${i + 1} entfernen">✕</button>` : ''}</span></div>
<input class="inp" data-i="${i}" placeholder="${['z. B. Kennengelernt · 2015', 'z. B. Geheiratet · 2019', 'z. B. Zuhause seit 2021'][i]}" value="${esc(it.label || '')}"></div>`
			)
			.join('');
	} else {
		document.querySelectorAll('#multiList input[data-i]').forEach((el) => {
			const inp = /** @type {HTMLInputElement} */ (el);
			const v = items[+(inp.dataset.i || 0)].label || '';
			if (document.activeElement !== inp && inp.value !== v) inp.value = v;
		});
	}
}
