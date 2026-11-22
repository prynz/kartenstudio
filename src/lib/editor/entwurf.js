// Entwurf automatisch merken (im Browser) und per Link teilen.
// Gespeichert wird nur der Ausschnitt und die Gestaltung – die Kartendaten werden beim
// Öffnen neu geladen (schnell, weil der Browser die Kacheln zwischenspeichert).
import { app as appUntyped } from './app.js';

/** @type {any} */
const app = appUntyped;
const KEY = 'kartenstudio.entwurf.v1';

/** @typedef {{v:number, b:any, place:any, demo:boolean, step?:string, S:any, t?:number, gift?:{msg?:string, from?:string}}} Draft */

/** Aktueller Stand als speicherbares Objekt */
export function draftPayload() {
	return {
		v: 1,
		b: app.lastB,
		place: /** @type {any} */ (window)._place || null,
		demo: !!app.isDemo,
		step: app.wizStep || '',
		S: app.S
	};
}

let timer = 0;
/** Entwurf kurz nach der letzten Änderung speichern (nicht bei jedem Tastendruck) */
export function saveDraftSoon() {
	clearTimeout(timer);
	timer = window.setTimeout(saveDraft, 700);
}
export function saveDraft() {
	if (!app.DATA || !app.S || !app.lastB) return;
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...draftPayload(), t: Date.now() }));
		dispatchEvent(new Event('ks-gespeichert'));
	} catch (e) {
		/* Speicher voll oder privat – dann eben ohne */
	}
}
export function clearDraft() {
	try {
		localStorage.removeItem(KEY);
	} catch (e) {}
}
/** @returns {Draft|null} */
export function savedDraft() {
	try {
		const d = JSON.parse(localStorage.getItem(KEY) || 'null');
		return validDraft(d) ? d : null;
	} catch (e) {
		return null;
	}
}

/* ---------- Sicherheitsprüfung ----------
   Ein geteilter Link kommt von außen. Werte, die ungeprüft ins Poster-SVG geschrieben
   werden (Farben, Schriftnamen …), dürfen deshalb nur harmlose Zeichen enthalten.
   Freie Texte (Titel, Untertitel, Widmung, Pin-Namen) werden beim Zeichnen maskiert. */
const FREE = new Set(['title.text', 'sub.text', 'note.text', 'label', 'label0', 'name', 'koord.text', 'wolke.text', 'info.kopf', 'info.nr', 'info.kicker', 'info.fakten', 'info.absatz']);
const SAFE = /^[\w#.,%()\- ]*$/;
/** @param {any} v @param {string} path @returns {boolean} */
function safeVal(v, path) {
	if (v === null || typeof v === 'boolean') return true;
	if (typeof v === 'number') return Number.isFinite(v);
	if (typeof v === 'string') {
		const tail = path.split('.').slice(-2).join('.');
		if (FREE.has(tail) || FREE.has(path.split('.').pop() || '')) return v.length < 400;
		return v.length < 200 && SAFE.test(v);
	}
	if (Array.isArray(v)) return v.length < 5000 && v.every((x, i) => safeVal(x, path + '.' + i));
	if (typeof v === 'object') return Object.keys(v).length < 20000 && Object.entries(v).every(([k, x]) => /^[\w-]{1,40}$/.test(k) && safeVal(x, path ? path + '.' + k : k));
	return false;
}
/** @param {any} d */
export function validDraft(d) {
	if (!d || d.v !== 1 || !d.S || typeof d.S !== 'object' || !d.S.view || !d.S.cls) return false;
	const b = d.b;
	if (!d.demo) {
		if (!b || !['w', 'e', 'n', 's'].every((k) => Number.isFinite(b[k]))) return false;
		if (b.e - b.w <= 0 || b.e - b.w > 0.2 || b.n - b.s <= 0 || b.n - b.s > 0.2) return false;
	}
	if (d.place && (typeof d.place !== 'object' || !safeVal(d.place.lon ?? 0, 'lon'))) return false;
	if (d.gift && (typeof d.gift !== 'object' || String(d.gift.msg || '').length > 400 || String(d.gift.from || '').length > 100)) return false;
	return safeVal(d.S, '');
}

/* ---------- Link zum Teilen ---------- */
/** @param {Uint8Array} u */
const b64u = (u) => {
	let s = '';
	for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
/** @param {string} s */
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

/** @param {Uint8Array} data @param {CompressionStream|DecompressionStream} stream */
async function pipe(data, stream) {
	const res = new Response(new Blob([/** @type {BlobPart} */ (data)]).stream().pipeThrough(stream));
	return new Uint8Array(await res.arrayBuffer());
}

/** Kompakter Link, der den aktuellen Entwurf enthält */
/** @param {{msg?:string, from?:string}} [gift] Grußbotschaft für Geschenk-Links */
export async function shareLink(gift) {
	const json = new TextEncoder().encode(JSON.stringify(gift ? { ...draftPayload(), gift } : draftPayload()));
	let code = 'j' + b64u(json);
	if (typeof CompressionStream !== 'undefined') code = 'z' + b64u(await pipe(json, new CompressionStream('deflate-raw')));
	return location.origin + location.pathname + '#e=' + code;
}

/** Entwurf aus dem Link lesen (oder null) */
export async function draftFromHash() {
	const m = location.hash.match(/^#e=([zj])([\w-]+)$/);
	if (!m) return null;
	try {
		let bytes = unb64u(m[2]);
		if (m[1] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
		const d = JSON.parse(new TextDecoder().decode(bytes));
		return validDraft(d) ? d : null;
	} catch (e) {
		return null;
	}
}

/** „vor 5 Minuten“ usw. @param {number} t */
export function ago(t) {
	const m = Math.round((Date.now() - t) / 60000);
	if (m < 1) return 'gerade eben';
	if (m < 60) return `vor ${m} Min.`;
	const h = Math.round(m / 60);
	if (h < 24) return `vor ${h} Std.`;
	const d = Math.round(h / 24);
	return d === 1 ? 'gestern' : `vor ${d} Tagen`;
}
