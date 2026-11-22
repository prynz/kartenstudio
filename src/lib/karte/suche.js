// Ortssuche (Photon-Geocoder): Vorschläge schon beim Tippen, zuletzt gesuchte Orte, „Mein Standort“.
import { esc } from '../editor/basis.js';
/** @param {string} id @returns {any} */
const $ = (id) => document.getElementById(id);
import { KONFIG } from '../konfig.js';

const VERLAUF = 'kartenstudio.zuletzt.v1';

/** Zuletzt gewählte Orte (max. 5) */
function verlauf() {
	try {
		const v = JSON.parse(localStorage.getItem(VERLAUF) || '[]');
		return Array.isArray(v) ? v.filter((f) => f && f.geometry && f.properties).slice(0, 5) : [];
	} catch (e) {
		return [];
	}
}
/** @param {any} f */
function merken(f) {
	try {
		const p = f.properties;
		const klein = {
			type: 'Feature',
			geometry: { type: 'Point', coordinates: f.geometry.coordinates },
			properties: { name: p.name, county: p.county, state: p.state, city: p.city, country: p.country, osm_value: p.osm_value, extent: p.extent }
		};
		const alt = verlauf().filter((x) => x.properties.name !== p.name || x.geometry.coordinates.join() !== f.geometry.coordinates.join());
		localStorage.setItem(VERLAUF, JSON.stringify([klein, ...alt].slice(0, 5)));
	} catch (e) {}
}

/** Unterzeile eines Treffers @param {any} p */
const zeile = (p) => [p.city && p.city !== p.name ? p.city : '', p.county, p.state, p.country].filter(Boolean).join(', ');

/**
 * Suchfeld verbinden.
 * @param {string} inp @param {string} btn @param {string} box @param {(f:any, q:string)=>void} onPick
 */
export function attachSearch(inp, btn, box, onPick) {
	const R = () => $(box);
	let nr = 0;
	/** Trefferliste zeigen @param {any[]} feats @param {string} q @param {string} [titel] */
	function liste(feats, q, titel) {
		const r = R();
		r.innerHTML = titel ? `<div class="info">${esc(titel)}</div>` : '';
		feats.forEach((f) => {
			const p = f.properties;
			const b = document.createElement('button');
			b.type = 'button';
			b.innerHTML = `<b>${esc(p.name || '(ohne Namen)')}</b><small>${esc(zeile(p))}</small>`;
			b.onclick = () => {
				r.classList.add('hidden');
				merken(f);
				onPick(f, q);
			};
			r.appendChild(b);
		});
		r.classList.toggle('hidden', !feats.length && !titel);
	}
	/** @param {boolean} [leise] beim Tippen: keine „Suche …“-Meldung */
	async function run(leise) {
		const q = $(inp).value.trim();
		if (!q) return;
		const meine = ++nr;
		const r = R();
		if (!leise) {
			r.classList.remove('hidden');
			r.innerHTML = '<div class="info">Suche …</div>';
		}
		try {
			const res = await fetch(KONFIG.geocoder + '?lang=de&limit=6&q=' + encodeURIComponent(q));
			const j = await res.json();
			if (meine !== nr) return; // inzwischen weitergetippt
			if (!j.features || !j.features.length) {
				r.classList.remove('hidden');
				r.innerHTML = '<div class="info">Nichts gefunden. Versuche Ort und Gemeinde, z. B. „Siegritz Heiligenstadt“.</div>';
				return;
			}
			liste(j.features, q);
		} catch (e) {
			if (meine !== nr) return;
			r.classList.remove('hidden');
			r.innerHTML = '<div class="info" style="color:var(--err)">Keine Verbindung zum Suchdienst. Ist das Internet da?</div>';
		}
	}
	$(btn).onclick = () => run();
	let t = 0;
	$(inp).addEventListener('input', () => {
		clearTimeout(t);
		const q = $(inp).value.trim();
		if (q.length < 3) {
			if (!q) zeigeVerlauf();
			else R().classList.add('hidden');
			return;
		}
		// Vorschläge erscheinen beim Tippen – kurz warten, damit nicht jeder Buchstabe eine Anfrage auslöst
		t = window.setTimeout(() => run(true), 320);
	});
	function zeigeVerlauf() {
		const v = verlauf();
		if (v.length) liste(v, '', 'Zuletzt gesucht');
		else R().classList.add('hidden');
	}
	$(inp).addEventListener('focus', () => {
		if (!$(inp).value.trim()) zeigeVerlauf();
	});
	$(inp).addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
		if (e.key === 'Enter') {
			clearTimeout(t);
			run();
		}
		if (e.key === 'Escape') R().classList.add('hidden');
	});
	document.addEventListener('pointerdown', (e) => {
		const z = /** @type {Node} */ (e.target);
		if (!R().contains(z) && z !== $(inp) && z !== $(btn)) R().classList.add('hidden');
	});
	return () => run();
}

/**
 * „Mein Standort“: Position vom Gerät holen und den Ort dazu suchen.
 * @param {(f:any, q:string)=>void} onPick @param {(t:string)=>void} meldung
 */
export function meinStandort(onPick, meldung) {
	if (!navigator.geolocation) return meldung('Dein Gerät gibt keinen Standort heraus.');
	meldung('Standort wird bestimmt …');
	navigator.geolocation.getCurrentPosition(
		async (pos) => {
			const { latitude: lat, longitude: lon } = pos.coords;
			let f = { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { name: 'Mein Ort', osm_value: 'village' } };
			try {
				const r = await fetch(KONFIG.geocoder.replace(/api\/?$/, 'reverse') + `?lang=de&lon=${lon}&lat=${lat}`);
				const j = await r.json();
				const g = j.features && j.features[0];
				if (g) {
					const p = g.properties;
					f = { ...f, properties: { ...p, name: p.city || p.name || 'Mein Ort', osm_value: p.city ? 'town' : 'village' } };
				}
			} catch (e) {}
			meldung('');
			merken(f);
			onPick(f, f.properties.name);
		},
		() => meldung('Standort nicht verfügbar – bitte Ort eintippen.'),
		{ enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
	);
}
