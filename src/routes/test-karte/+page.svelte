<script lang="ts">
	// Testbereich: Live-Karte mit MapLibre (Grafikchip statt Zeichnen im Browser) – zum direkten
	// Vergleich mit dem Editor. Gleiche Kartendaten (OpenFreeMap), Stadtplan-Look als MapLibre-Stil.
	// Bewusst eigenständig: nutzt keine Editor-Bausteine, damit der Vergleich fair bleibt.
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { KONFIG } from '#lib/konfig.js';

	type Ort = { name: string; info: string; lon: number; lat: number; extent?: number[]; small: boolean };

	let mapEl: HTMLDivElement;
	let map: any = null;
	let q = $state('');
	let treffer = $state<Ort[]>([]);
	let titel = $state('BAMBERG');
	let unter = $state('Oberfranken');
	let koord = $state('');
	let gebaeude = $state(true);
	let nacht = $state(false);
	let ladezeit = $state('–');
	let fps = $state('–');
	let laedt = $state(true);

	// Farben der beiden Looks (Stadtplan wie im Editor, dazu eine Nachtvariante)
	const LOOK = {
		hell: { bg: '#ffffff', gruen: '#f7f8f5', wasser: '#a9c4e2', haus: '#dde0e4', hausRand: '#9fa4ab', haupt: '#111111', neben: '#1d1d1f', weg: '#5a5d63', bahn: '#a4a7ad', text: '#111111' },
		nacht: { bg: '#14171f', gruen: '#181c25', wasser: '#2b3a55', haus: '#262b36', hausRand: '#3a4150', haupt: '#f2f2f2', neben: '#c9ccd3', weg: '#7d828c', bahn: '#5a5f69', text: '#f2f2f2' }
	};

	/** Breite je Zoomstufe (Linien werden beim Hineinzoomen dicker, wie bei gedruckten Stadtplänen) */
	const breite = (stufen: number[][]) => ['interpolate', ['exponential', 1.5], ['zoom'], ...stufen.flat()];

	function stil(L: (typeof LOOK)['hell']): any {
		const strasse = (id: string, klassen: string[], farbe: string, b: number[][], min = 0) => ({
			id,
			type: 'line',
			source: 'omt',
			'source-layer': 'transportation',
			minzoom: min,
			filter: ['in', ['get', 'class'], ['literal', klassen]],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: { 'line-color': farbe, 'line-width': breite(b) }
		});
		return {
			version: 8,
			sources: { omt: { type: 'vector', url: KONFIG.tileJson } },
			layers: [
				{ id: 'hintergrund', type: 'background', paint: { 'background-color': L.bg } },
				{ id: 'gruen', type: 'fill', source: 'omt', 'source-layer': 'landcover', filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'farmland']]], paint: { 'fill-color': L.gruen } },
				{ id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': L.gruen } },
				{ id: 'wasser', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': L.wasser } },
				{ id: 'fluss', type: 'line', source: 'omt', 'source-layer': 'waterway', layout: { 'line-cap': 'round' }, paint: { 'line-color': L.wasser, 'line-width': breite([[10, 0.6], [14, 1.6], [18, 5]]) } },
				{ id: 'haeuser', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13, paint: { 'fill-color': L.haus, 'fill-outline-color': L.hausRand } },
				strasse('bahn', ['rail', 'transit'], L.bahn, [[10, 0.4], [14, 0.8], [18, 2]], 10),
				strasse('wege', ['path', 'track', 'pier'], L.weg, [[13, 0.25], [15, 0.6], [18, 1.6]], 13),
				strasse('neben', ['minor', 'service'], L.neben, [[11, 0.25], [14, 0.8], [16, 2], [18, 5]], 11),
				strasse('mittel', ['tertiary', 'secondary'], L.neben, [[9, 0.4], [12, 0.9], [14, 1.6], [16, 3.5], [18, 8]]),
				strasse('haupt', ['primary', 'trunk', 'motorway'], L.haupt, [[7, 0.6], [10, 1.2], [12, 1.8], [14, 2.8], [16, 5], [18, 11]])
			]
		};
	}

	function koordText(lon: number, lat: number) {
		const k = (v: number, p: string, n: string) => {
			const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60);
			return `${d}°${String(m).padStart(2, '0')}′ ${v < 0 ? n : p}`;
		};
		return `${k(lat, 'N', 'S')}   ${k(lon, 'O', 'W')}`;
	}

	/** Ladezeit messen: vom Auftrag bis die Karte fertig gezeichnet ist (Ereignis „idle“) */
	function messeLaden() {
		const t0 = performance.now();
		laedt = true;
		map.once('idle', () => {
			ladezeit = (performance.now() - t0) / 1000 < 0.05 ? 'sofort' : ((performance.now() - t0) / 1000).toFixed(1).replace('.', ',') + ' s';
			laedt = false;
		});
	}

	/** Bilder pro Sekunde während des Ziehens/Zoomens */
	function fpsMessen() {
		let n = 0, t0 = 0, an = false;
		const tick = (t: number) => {
			if (!an) return;
			n++;
			requestAnimationFrame(tick);
		};
		map.on('movestart', () => { n = 0; t0 = performance.now(); an = true; requestAnimationFrame(tick); });
		map.on('moveend', () => {
			an = false;
			const s = (performance.now() - t0) / 1000;
			if (s > 0.25) fps = Math.min(60, Math.round(n / s)) + ' Bilder/s';
			const c = map.getCenter();
			koord = koordText(c.lng, c.lat);
		});
	}

	function zuOrt(o: Ort) {
		treffer = [];
		q = o.name;
		titel = o.name.toUpperCase();
		unter = o.info;
		messeLaden();
		// Gleiche Regel wie im Editor: ganzer Ort, Städte höchstens 10 km, Dörfer höchstens 1,8 km
		const cos = Math.cos((o.lat * Math.PI) / 180);
		let wm = o.small ? 1300 : 2500;
		if (o.extent) {
			const e = o.extent; // [west, nord, ost, süd]
			const ew = (e[2] - e[0]) * 111320 * cos, eh = (e[1] - e[3]) * 110540;
			wm = Math.max(o.small ? 900 : 1500, Math.min(o.small ? 1800 : 10000, Math.max(ew, eh / 1.15) * (o.small ? 1.08 : 0.9)));
		}
		const px = mapEl.clientWidth || 500;
		const zoom = Math.log2((40075016.686 * cos * px) / (512 * wm));
		map.jumpTo({ center: [o.lon, o.lat], zoom });
		koord = koordText(o.lon, o.lat);
	}

	let suchTimer = 0;
	function suchen() {
		clearTimeout(suchTimer);
		const text = q.trim();
		if (text.length < 2) return (treffer = []);
		suchTimer = window.setTimeout(async () => {
			try {
				const r = await fetch(`${KONFIG.geocoder}?q=${encodeURIComponent(text)}&lang=de&limit=6&osm_tag=place`);
				const j = await r.json();
				treffer = (j.features || []).map((f: any) => {
					const p = f.properties;
					return {
						name: p.name,
						info: (p.county || p.state || p.country || '').replace(/^Landkreis /, ''),
						lon: f.geometry.coordinates[0],
						lat: f.geometry.coordinates[1],
						extent: p.extent,
						small: /^(village|hamlet|suburb|neighbourhood|quarter|locality|isolated_dwelling|farm)$/.test(p.osm_value || '')
					};
				});
			} catch {
				treffer = [];
			}
		}, 300);
	}

	function gebaeudeUmschalten() {
		gebaeude = !gebaeude;
		map.setLayoutProperty('haeuser', 'visibility', gebaeude ? 'visible' : 'none');
	}

	/** Look wechseln: nur Farben ändern – die Karte muss dafür nichts neu laden */
	function lookWechseln() {
		nacht = !nacht;
		const L = nacht ? LOOK.nacht : LOOK.hell;
		const t0 = performance.now();
		map.setPaintProperty('hintergrund', 'background-color', L.bg);
		for (const id of ['gruen', 'park']) map.setPaintProperty(id, 'fill-color', L.gruen);
		map.setPaintProperty('wasser', 'fill-color', L.wasser);
		map.setPaintProperty('fluss', 'line-color', L.wasser);
		map.setPaintProperty('haeuser', 'fill-color', L.haus);
		map.setPaintProperty('haeuser', 'fill-outline-color', L.hausRand);
		map.setPaintProperty('bahn', 'line-color', L.bahn);
		map.setPaintProperty('wege', 'line-color', L.weg);
		for (const id of ['neben', 'mittel']) map.setPaintProperty(id, 'line-color', L.neben);
		map.setPaintProperty('haupt', 'line-color', L.haupt);
		map.once('idle', () => (ladezeit = 'Stilwechsel ' + Math.round(performance.now() - t0) + ' ms'));
	}

	onMount(() => {
		let weg = false;
		Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'), import('maplibre-gl/dist/maplibre-gl.css')]).then(([m, w]) => {
			if (weg) return;
			const lib: any = (m as any).default || m;
			if (lib.setWorkerUrl) lib.setWorkerUrl((w as any).default);
			map = new lib.Map({
				container: mapEl,
				style: stil(LOOK.hell),
				center: [10.8978, 49.8917],
				zoom: 12.6,
				minZoom: 8,
				maxZoom: 18,
				dragRotate: false,
				pitchWithRotate: false,
				attributionControl: { compact: true, customAttribution: '© OpenStreetMap-Mitwirkende · OpenMapTiles · OpenFreeMap' },
				// neue Kacheln blenden weich ein (wie bei Cartida/Momenterie)
				fadeDuration: 300
			});
			map.touchZoomRotate.disableRotation();
			// Quellenhinweis zugeklappt (nur das ⓘ), damit er die Karte nicht verdeckt
			map.once('load', () => mapEl.querySelector('.maplibregl-compact-show')?.classList.remove('maplibregl-compact-show'));
			map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
			koord = koordText(10.8978, 49.8917);
			messeLaden();
			fpsMessen();
		});
		return () => {
			weg = true;
			if (map) map.remove();
		};
	});
</script>

<svelte:head>
	<title>Test: Live-Karte (MapLibre) · Kartenstudio</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="tk" class:nacht>
	<aside>
		<a class="zurueck" href={resolve("/")} data-sveltekit-reload>‹ Zum Editor</a>
		<h1>Testbereich: Live-Karte</h1>
		<p class="erkl">
			Diese Karte wird vom <b>Grafikchip</b> gezeichnet (MapLibre) – so ähnlich wie bei Cartida oder Momenterie. Gleiche Kartendaten wie im Editor, Look „Stadtplan“. Zum Vergleichen ziehen, zoomen und Orte suchen.
		</p>

		<label class="lab" for="tkSuche">Ort</label>
		<div class="suche">
			<input id="tkSuche" bind:value={q} oninput={suchen} placeholder="z. B. Hamburg, Bamberg, Siegritz" autocomplete="off" />
			{#if treffer.length}
				<ul>
					{#each treffer as o}
						<li><button type="button" onclick={() => zuOrt(o)}><b>{o.name}</b> <small>{o.info}</small></button></li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="lab">Darstellung</div>
		<div class="knoepfe">
			<button type="button" class:an={gebaeude} onclick={gebaeudeUmschalten}>Gebäude {gebaeude ? 'an' : 'aus'}</button>
			<button type="button" class:an={nacht} onclick={lookWechseln}>{nacht ? 'Nacht' : 'Hell'}</button>
		</div>

		<div class="lab">Messwerte</div>
		<dl>
			<dt>Fertig geladen</dt><dd>{laedt ? 'lädt …' : ladezeit}</dd>
			<dt>Beim Ziehen/Zoomen</dt><dd>{fps}</dd>
		</dl>
		<p class="hinweis">Gebäude erscheinen ab näherem Zoom (wie bei den Vorbildern). Die Druckdatei würde weiter mit der scharfen Vektor-Technik des Editors entstehen.</p>
	</aside>

	<main>
		<div class="poster">
			<div class="karte" bind:this={mapEl}>
				{#if laedt}<span class="lade"><i></i>Karte lädt</span>{/if}
			</div>
			<div class="text">
				<div class="titel">{titel}</div>
				<div class="unter">{unter}</div>
				<div class="koord">{koord}</div>
			</div>
		</div>
	</main>
</div>

<style>
	.tk {
		--navy: #262c3a;
		display: grid;
		grid-template-columns: 340px 1fr;
		min-height: 100dvh;
		background: #efebe4;
		font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
		color: #1c1f26;
	}
	aside {
		background: #fff;
		padding: 22px 22px 28px;
		border-right: 1px solid #e6e2da;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.zurueck {
		color: #2f6fe4;
		text-decoration: none;
		font-size: 13px;
	}
	h1 {
		font-size: 20px;
		margin: 4px 0 0;
	}
	.erkl,
	.hinweis {
		font-size: 13px;
		line-height: 1.5;
		color: #5b616d;
		margin: 0;
	}
	.lab {
		font-size: 13px;
		font-weight: 600;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #eee;
	}
	.suche {
		position: relative;
	}
	input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid #d9d5cd;
		border-radius: 10px;
		padding: 11px 12px;
		font: inherit;
		font-size: 15px;
	}
	input:focus {
		outline: 2px solid var(--navy);
		outline-offset: 1px;
	}
	ul {
		list-style: none;
		margin: 6px 0 0;
		padding: 4px;
		border: 1px solid #e6e2da;
		border-radius: 10px;
		background: #fff;
		box-shadow: 0 10px 24px rgba(20, 24, 35, 0.12);
		position: absolute;
		inset: 100% 0 auto;
		z-index: 5;
	}
	li button {
		all: unset;
		cursor: pointer;
		display: block;
		width: 100%;
		box-sizing: border-box;
		padding: 8px 10px;
		border-radius: 8px;
		font-size: 14px;
	}
	li button:hover,
	li button:focus-visible {
		background: #f3f1ec;
	}
	li small {
		color: #7a808b;
	}
	.knoepfe {
		display: flex;
		gap: 8px;
	}
	.knoepfe button {
		all: unset;
		cursor: pointer;
		flex: 1;
		text-align: center;
		padding: 10px;
		border-radius: 10px;
		border: 1px solid #d9d5cd;
		font-size: 14px;
		transition: background 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.knoepfe button.an {
		background: var(--navy);
		color: #fff;
		border-color: var(--navy);
	}
	dl {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 6px 10px;
		margin: 0;
		font-size: 14px;
	}
	dt {
		color: #5b616d;
	}
	dd {
		margin: 0;
		font-weight: 600;
	}
	main {
		display: grid;
		place-items: center;
		padding: 28px;
	}
	.poster {
		background: #fff;
		width: min(560px, 100%, calc((100dvh - 56px) * 0.72));
		padding: 5.5% 5.5% 4%;
		box-sizing: border-box;
		box-shadow: 0 1px 2px rgba(20, 24, 35, 0.06), 0 26px 60px -12px rgba(20, 24, 35, 0.25);
		transition: background 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.karte {
		position: relative;
		aspect-ratio: 4 / 4.6;
		background: #fff;
		touch-action: none;
	}
	.text {
		text-align: center;
		padding-top: 7%;
	}
	.titel {
		font-size: clamp(26px, 5.4vw, 42px);
		font-weight: 500;
		letter-spacing: 0.12em;
		line-height: 1;
	}
	.unter {
		font-size: 13px;
		letter-spacing: 0.14em;
		margin-top: 10px;
		color: #3d424c;
	}
	.koord {
		font-size: 11px;
		letter-spacing: 0.08em;
		margin-top: 6px;
		color: #8a8f98;
	}
	.nacht .poster,
	.nacht .karte {
		background: #14171f;
	}
	.nacht .titel {
		color: #f2f2f2;
	}
	.nacht .unter {
		color: #c9ccd3;
	}
	.lade {
		position: absolute;
		left: 50%;
		top: 12px;
		transform: translateX(-50%);
		z-index: 2;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(38, 44, 58, 0.88);
		color: #fff;
		font-size: 12px;
		padding: 6px 12px;
		border-radius: 999px;
		pointer-events: none;
	}
	.lade i {
		width: 10px;
		height: 10px;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #fff;
		border-radius: 50%;
		animation: dreh 0.8s linear infinite;
	}
	@keyframes dreh {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lade i {
			animation: none;
		}
	}
	/* Handy: Karte oben, Einstellungen darunter */
	@media (max-width: 900px) {
		.tk {
			grid-template-columns: 1fr;
		}
		main {
			order: -1;
			padding: 16px;
		}
		aside {
			border-right: 0;
			border-top: 1px solid #e6e2da;
			padding: 18px 16px 28px;
		}
		.poster {
			width: min(100%, 460px);
		}
	}
</style>
