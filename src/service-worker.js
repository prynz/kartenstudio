// Service Worker: macht Kartenstudio installierbar und schneller beim zweiten Besuch.
// - App-Dateien werden beim Installieren zwischengespeichert (Start auch bei schlechtem Netz).
// - Kartenkacheln werden beim Benutzen gemerkt (begrenzt), damit gemerkte Entwürfe sofort wieder laden.
// - Ortssuche und Kartenstile kommen immer frisch aus dem Netz.
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));
const APP = `app-${version}`;
const TILES = 'kacheln-v1';
const MAX_TILES = 600;
// Pfade im Manifest sind relativ zum Basis-Pfad (z. B. /kartenstudio/)
const SCOPE = new URL(sw.registration.scope).pathname;
const abs = (/** @type {string} */ p) => SCOPE + p.replace(/^\//, '');
const ASSETS = [...immutable, ...assets, ...prerendered].map((x) => x.path).filter((p) => !/(^|\/)\./.test(p) && !/^poster\//.test(p) && !/^vorschau\//.test(p) && !/^archiv\//.test(p) && !/sitemap/.test(p)).map(abs);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(APP)
			// Einzeln speichern: eine fehlende Datei soll nicht die ganze Installation verhindern
			.then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== APP && k !== TILES).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

/** Ältere Kacheln entfernen, wenn zu viele gemerkt sind @param {Cache} c */
async function trim(c) {
	const keys = await c.keys();
	if (keys.length > MAX_TILES) await Promise.all(keys.slice(0, keys.length - MAX_TILES).map((k) => c.delete(k)));
}

sw.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);

	// Vektorkacheln: zuerst aus dem Speicher, sonst holen und merken
	if (/\.pbf$/.test(url.pathname) && url.hostname.endsWith('openfreemap.org')) {
		event.respondWith(
			caches.open(TILES).then(async (c) => {
				const hit = await c.match(req);
				if (hit) return hit;
				const res = await fetch(req);
				if (res.ok) {
					c.put(req, res.clone()).then(() => trim(c));
				}
				return res;
			})
		);
		return;
	}

	if (url.origin !== location.origin) return;

	// App-Dateien: aus dem Speicher (sie ändern sich nur mit einer neuen Version).
	// Programmteile mit Versionskennung im Namen werden beim ersten Abruf zusätzlich gemerkt.
	// Vorschaubilder der Stile/Designs: nicht vorab laden (sparsam), aber beim ersten Anzeigen merken
	const immut = url.pathname.startsWith(SCOPE + '_app/immutable/') || url.pathname.startsWith(SCOPE + 'vorschau/');
	if (immut || ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(req, { ignoreVary: true, ignoreSearch: true }).then(
				(r) =>
					r ||
					fetch(req).then((res) => {
						if (immut && res.ok) {
							const copy = res.clone();
							caches.open(APP).then((c) => c.put(req, copy));
						}
						return res;
					})
			)
		);
		return;
	}

	// Seitenaufrufe: Netz zuerst, bei Funkloch die gespeicherte Startseite
	if (req.mode === 'navigate') {
		event.respondWith(fetch(req).catch(async () => (await caches.match(SCOPE)) || (await caches.match(req)) || Response.error()));
	}
});
