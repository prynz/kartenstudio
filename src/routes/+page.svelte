<script lang="ts">
	// Kartenstudio – Editor-Seite.
	// Das HTML-Gerüst stammt aus dem Prototyp; die Logik liegt in #lib/editor, #lib/karte, #lib/themen, #lib/export.
	import '#lib/editor/editor.css';
	import '#lib/startseite.css';
	import { onMount } from 'svelte';
	import { resolve, asset } from '$app/paths';
	import { PREISE, FESTPREISE, fmt } from '#lib/shop/preise.js';

	// Startseite: Preise „ab …“ aus der Preisliste, Anlässe und Motive zum Antippen
	const P: Record<string, Record<string, number>> = PREISE;
	const F: Record<string, number> = FESTPREISE;
	const ab = (k: string) => fmt(F[k] ?? Math.min(...Object.values(P[k] || { x: 0 })));
	const ANL = [
		['hochzeit', 'Hochzeit', 'Herzform mit Herz an eurem Ort'],
		['geburt', 'Geburt', 'Rund, sanftes Pastell, mit Stern'],
		['zuhause', 'Neues Zuhause', 'Klar und modern, mit Koordinaten'],
		['heimat', 'Heimat', 'Navy-Balken und Fraktur – der Klassiker'],
		['urlaub', 'Urlaub', 'Sonnige Farben im Polaroid-Look'],
		['verein', 'Verein & Firma', 'Kräftig, ideal fürs Vereins-Shirt']
	];
	const MOTIVE = [
		['bamberg-sterne', 'Sternenhimmel', 'Der echte Himmel über deinem Ort an deinem Datum'],
		['erlangen-koord', 'Koordinaten', 'Große Koordinaten mit deiner Geschichte'],
		['kulmbach-geburt', 'Wortwolke', 'Namen und Daten in Herz, Kreis oder Haus'],
		['bamberg-typo', 'Typografie', 'Der Ortsname in riesigen Buchstaben'],
		['pottenstein-hoehen', 'Höhenlinien', 'Berge und Täler als feine Linien'],
		['lindau-insel', 'Insel & See', 'Land und Wasser als klare Silhouette']
	];
	const PROD = [
		['poster', 'Poster', 'Mattes Premiumpapier, A4 bis 70 × 100'],
		['gerahmt', 'Mit Rahmen', '7 Rahmen, mit Passepartout'],
		['leinwand', 'Leinwand', 'Auf Keilrahmen gespannt'],
		['alu', 'Alu-Dibond', 'Edel, matt, mit Aufhängung'],
		['shirt', 'T-Shirt', '7 Farben, Motiv auf der Brust'],
		['tasse', 'Tasse', 'Keramik, spülmaschinenfest']
	];
	const PICON: Record<string, string> = {
		poster: '<rect x="9" y="5" width="22" height="30" rx="1.5"/>',
		gerahmt: '<rect x="7" y="3" width="26" height="34" rx="2" stroke-width="3.2"/><rect x="12" y="9" width="16" height="22"/>',
		leinwand: '<path d="M8 6h22v28H8z"/><path d="M30 6l3 3v28l-3-3M8 34l3 3h22"/>',
		alu: '<rect x="8" y="5" width="24" height="30" rx="1"/><path d="M11 8h18v24" stroke-opacity=".45"/>',
		shirt: '<path d="M14 5c2 3 10 3 12 0l8 4 4 9-6 3-1-2v17H9V19l-1 2-6-3 4-9z"/>',
		tasse: '<path d="M7 8h20v22c0 3-3 5-10 5S7 33 7 30z"/><path d="M27 13c7-1 7 11 0 10"/>'
	};
	/** Zur Suche oben springen */
	function zurSuche() {
		document.getElementById('landing')?.scrollTo({ top: 0, behavior: 'smooth' });
		setTimeout(() => document.getElementById('lq')?.focus({ preventScroll: true }), 350);
	}
	/** Anlass vormerken (wie die Knöpfe oben) und zur Suche */
	function anlass(k: string) {
		const b = document.querySelector<HTMLButtonElement>(`.occ-landing button[data-k="${k}"]`);
		if (b && !b.classList.contains('on')) b.click();
		zurSuche();
	}
	/** Ein Beispiel aus der Galerie öffnen */
	function beispiel(id: string) {
		document.querySelector<HTMLButtonElement>(`#bspStrip [data-id="${id}"]`)?.click();
	}

	/**
	 * Den Editor erst laden, wenn er gebraucht wird – die Startseite ist so schneller bedienbar.
	 * Auslöser: erste Bedienung (Tippen, Klicken, Tastatur), Beispiel-Streifen kommt in Sicht,
	 * Link mit Entwurf/Ort, gespeicherter Entwurf (für „Weiter mit …“) – spätestens kurz nach dem Laden.
	 */
	onMount(() => {
		let bereit = false;
		let laedt: Promise<void> | null = null;
		let warteKlick: HTMLElement | null = null;
		const EREIGNISSE = ['pointerdown', 'keydown', 'focusin', 'touchstart'];
		const los = () =>
			(laedt ||= import('#lib/editor/start.js').then(({ start }) => {
				start();
				bereit = true;
				EREIGNISSE.forEach((e) => removeEventListener(e, los, true));
				removeEventListener('click', klick, true);
				// schon getippt, bevor der Editor da war → Vorschläge jetzt zeigen
				const q = document.getElementById('lq') as HTMLInputElement | null;
				if (q && q.value.trim()) q.dispatchEvent(new Event('input'));
				// Klick, der vor dem Laden kam, nachholen
				if (warteKlick) setTimeout(() => warteKlick?.click(), 0);
			}));
		// Klicks auf Knöpfe der Startseite, bevor der Editor da ist: merken und danach ausführen
		const klick = (e: MouseEvent) => {
			if (bereit) return;
			const t = e.target as HTMLElement;
			const el = t.closest('#landing button, #resumeBtn') as HTMLElement | null;
			if (!el || t.closest('a[href]')) return;
			e.preventDefault();
			e.stopPropagation();
			warteKlick = el;
			los();
		};
		addEventListener('click', klick, true);
		EREIGNISSE.forEach((e) => addEventListener(e, los, { capture: true, passive: true }));
		let entwurf = false;
		try {
			entwurf = !!localStorage.getItem('kartenstudio.entwurf.v1');
		} catch (e) {}
		if (location.hash.length > 1 || entwurf) los();
		else {
			// Beispiel-Streifen braucht den Editor-Code → laden, bevor er in Sicht kommt
			const strip = document.getElementById('bspStrip');
			if (strip && 'IntersectionObserver' in window) {
				const io = new IntersectionObserver((x) => x.some((y) => y.isIntersecting) && (io.disconnect(), los()), { rootMargin: '600px 0px' });
				io.observe(strip);
			}
			const spaeter = () => setTimeout(los, 1500);
			if (document.readyState === 'complete') spaeter();
			else addEventListener('load', spaeter, { once: true });
		}
		return () => {
			EREIGNISSE.forEach((e) => removeEventListener(e, los, true));
			removeEventListener('click', klick, true);
		};
	});
</script>

<svelte:head>
	<title>Kartenstudio – deine Heimat als Poster</title>
	<meta name="description" content="Deine Heimat als Kartenposter, Shirt oder Tasse – Ort eintippen, Poster steht sofort. Über 25 Designs, Sternenhimmel, Wortwolke, Koordinaten." />
	<meta name="theme-color" content="#262c3a" />
</svelte:head>

<header>
<div class="brand"><div class="logo"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6"><rect x="1.5" y="1.5" width="13" height="13" rx="2.5"/><path d="M1.5 10.5 6 7l3 2.5 5.5-4"/></svg></div>Kartenstudio<small>Beta</small></div>
<div class="hsp"></div>
<button class="ibtn chat-btn" id="chatBtn" aria-controls="chat" aria-expanded="false" title="Fragen? Hilfe-Chat öffnen"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1v.5"/><circle cx="12" cy="16.3" r=".6" fill="currentColor"/></svg><span>Hilfe</span></button>
<span id="hdrEdit" class="hidden hdr-edit">
<button type="button" class="hdr-projekt" id="hdrProjekt" title="Ort ändern"><span class="hdr-sl">/</span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c-3.9-4-7-7.6-7-11.2a7 7 0 0 1 14 0C19 13.4 15.9 17 12 21z"/><circle cx="12" cy="9.8" r="2.6"/></svg><b id="hdrOrt">Mein Ort</b></button>
<span class="hdr-mitte">
<button class="ibtn" id="undo" title="Rückgängig (Strg+Z)" aria-label="Rückgängig"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4.5 9.5 9 5"/><path d="M4.5 9.5H15a4.5 4.5 0 0 1 0 9h-3"/></svg></button><button class="ibtn" id="redo" title="Wiederholen (Strg+Y)" aria-label="Wiederholen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 14 4.5-4.5L15 5"/><path d="M19.5 9.5H9a4.5 4.5 0 0 0 0 9h3"/></svg></button>
<span class="gesp" id="gespeichert" aria-live="polite"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>Gespeichert</span></span>
</span>
<span class="hdr-rechts">
<button class="btn primary hdr-fertig" id="hdrFertig" type="button">Fertig</button>
<button class="btn primary hdr-dl" id="dlBtn"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg><span>Herunterladen</span></button>
</span>
</span>
<div class="pop hidden" id="dlPop">
<h4>Design herunterladen</h4>
<div class="lab" style="margin-top:0">Format</div>
<div class="seg" id="dlFmt"><button data-f="png" class="on">PNG</button><button data-f="svg">SVG</button><button data-f="pdfv">PDF Vektor</button><button data-f="pdf">PDF Bild</button></div>
<div id="dlSizeRow"><div class="lab">Breite</div>
<select class="inp" id="pngW" style="width:100%"><option value="2400">2400 px · Web & kleine Drucke</option><option value="3600" selected>3600 px · 30 cm bei 300 dpi</option><option value="4800">4800 px · 40 cm bei 300 dpi</option></select></div>
<button class="btn accent" id="dlGo" style="width:100%;margin-top:14px;justify-content:center">Datei erstellen</button>
<div class="hint" id="msg2" style="margin-top:8px;min-height:16px"></div>
</div>
</header>
<div class="app">
<aside id="side" class="nodata">
<div class="sheet-grip" id="sheetGrip" role="slider" aria-label="Einstellungen größer oder kleiner ziehen" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0"></div>
<!-- Geführter Ablauf (Assistent): immer nur ein Schritt sichtbar -->
<div class="wiz" id="wiz">
<nav class="wz-steps" id="wzSteps" aria-label="Werkzeuge">
<span class="wz-ind" id="wzInd" aria-hidden="true"></span>
<button data-step="ort" data-tip="Ort" data-key="1" aria-label="Ort"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21c-3.9-4-7-7.6-7-11.2a7 7 0 0 1 14 0C19 13.4 15.9 17 12 21z"/><circle cx="12" cy="9.8" r="2.6"/></svg><span>Ort</span></button>
<button data-step="stil" data-tip="Stil" data-key="2" aria-label="Stil"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.7-.8 1.7-1.7 0-1.3-1-1.7-1-2.8 0-.9.8-1.6 1.7-1.6h2.1a4 4 0 0 0 4-4c0-3.8-3.8-6.9-8.5-6.9z"/><circle cx="7.6" cy="11.4" r="1" fill="currentColor"/><circle cx="10.2" cy="7.6" r="1" fill="currentColor"/><circle cx="14.6" cy="7.6" r="1" fill="currentColor"/></svg><span>Stil</span></button>
<button data-step="design" data-tip="Design" data-key="3" aria-label="Design"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M4.5 14.5h15M9.5 17.5h5"/></svg><span>Design</span></button>
<button data-step="text" data-tip="Text" data-key="4" aria-label="Text"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 7.5V5h13v2.5M12 5v14M9.5 19h5"/></svg><span>Text</span></button>
<button data-step="extras" data-tip="Extras" data-key="5" aria-label="Extras"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.5 4l1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6z"/><path d="M17.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg><span>Extras</span></button>
<i class="wz-trenn" aria-hidden="true"></i>
<button data-step="fertig" class="wz-fertig" data-tip="Fertig" data-key="6" aria-label="Fertig"><svg class="wz-ring" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" class="wz-ring-bg"/><circle cx="28" cy="28" r="26" class="wz-ring-fg" id="wzRing" pathLength="100" stroke-dasharray="0 100"/></svg><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2 8.8-9.4"/></svg><span>Fertig</span></button>
<div class="wz-unten">
<button type="button" class="wz-rail" data-bsp-open data-tip="Beispiele" aria-label="Beispiele ansehen"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/></svg></button>
<button type="button" class="wz-rail" data-adv-open data-tip="Alle Einstellungen" aria-label="Alle Einstellungen"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg></button>
<button type="button" class="wz-rail" id="railHilfe" data-tip="Hilfe" aria-label="Hilfe-Chat öffnen"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.4a2.4 2.4 0 1 1 3.3 2.2c-.6.3-1 .8-1 1.4v.4"/><circle cx="12" cy="16.6" r=".4" fill="currentColor"/></svg></button>
</div>
</nav>
<div class="wz-panes">
<div class="wz-kopf" id="wzKopf"><div><small id="wzKopfNr">Schritt 1 von 6</small><h2 id="wzKopfT">Ort</h2><p id="wzKopfD"></p></div><button type="button" class="wz-zu" id="wzZu" aria-label="Einstellungen schließen"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></button></div>
<section class="wz-pane" data-step="ort">
<h3>Welcher Ort?</h3>
<div class="wz-place"><div class="pin">⌖</div><div><b id="wzPlace">–</b><span id="wzPlaceInfo"></span></div></div>
<div class="search wz-search"><input id="wq" type="search" placeholder="Anderen Ort suchen …" autocomplete="off" enterkeyhint="search"><button class="btn primary" id="wgo">Suchen</button><div class="results hidden" id="wresults"></div></div>
<button type="button" class="lp-geo" id="wgeo"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>Mein Standort</button>
</section>
<section class="wz-pane" data-step="ausschnitt">
<h3>Ausschnitt</h3>
<p class="wz-hint">Tipp: <b>Karte im Poster ziehen</b> und mit zwei Fingern oder dem Mausrad zoomen.</p>
<div class="lab">Wie viel vom Ort?</div>
<div class="wz-chips" id="wzUmfang"><button type="button" data-z="kern">Ortskern</button><button type="button" data-z="ort">Ganzer Ort</button><button type="button" data-z="weit">Mit Umgebung</button></div>
<div class="lab">Zoom</div>
<div class="wz-zoom"><button class="btn" id="wzZOut" aria-label="Herauszoomen">−</button><button class="btn" id="wzZIn" aria-label="Hineinzoomen">+</button><button class="btn ghost" id="wzReset">Zurücksetzen</button></div>
<button type="button" class="wz-link" id="wzPick">Ausschnitt auf der Landkarte neu wählen ›</button>
<button type="button" class="wz-link" id="wzWider">Größere Gegend laden (Inseln, Seen, Regionen bis 40 km) ›</button>
<details class="wz-more"><summary>Mehr: Anlass-Vorlage, Route, mehrere Orte</summary>
<div class="lab">Vorlage für einen Anlass</div>
<div class="occ" data-occ></div>
<div class="lab">Route einzeichnen</div>
<p class="wz-hint">Wanderung, Lauf oder Radtour aus deiner Sport-App (Datei .gpx) – die Karte richtet sich nach der Strecke.</p>
<button type="button" class="btn" id="routeBtn">GPS-Datei laden (.gpx)</button>
<input type="file" id="routeFile" accept=".gpx,.geojson,.json,application/gpx+xml,application/geo+json" hidden>
<div class="rt hidden" id="routeBox"><div class="rt-info" id="routeInfo"></div>
<div class="mk-sw" id="routeCol"></div>
<div class="row"><span class="k">Linienstärke</span><input type="range" id="routeW" min="2" max="18" step="1"></div>
<button type="button" class="wz-link" id="routeRm">Route entfernen</button></div>
<div class="lab">Mehrere Orte</div>
<label class="tog wz-tog"><input type="checkbox" id="multiOn"><span>Bis zu 4 Orte auf einem Poster</span></label>
<div class="mo hidden" id="multiBox">
<div class="tabs2" id="multiForm" role="tablist"><button type="button" data-f="kreis">Kreise</button><button type="button" data-f="raster">Raster (bis 4)</button></div>
<div id="multiList"></div>
<div class="search wz-search" id="multiAdd"><input id="mq" type="search" placeholder="Weiteren Ort hinzufügen" autocomplete="off" enterkeyhint="search"><button class="btn primary" id="mgo">Suchen</button><div class="results hidden" id="mresults"></div></div>
</div>
</details>
</section>
<section class="wz-pane" data-step="stil">
<div class="wz-head"><h3>Stil</h3><button type="button" class="wz-dice wz-bsp" data-bsp-open><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="6" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="12.5" width="7" height="8" rx="1.5"/></svg>Beispiele</button><button type="button" class="wz-dice" data-dice><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>Überrasch mich</button></div>
<div class="fav-box" id="favBox" hidden><div class="lab">Deine Favoriten <i id="favN"></i><button type="button" class="wz-link fav-cmp" id="favCmp" hidden>Vergleichen ›</button></div><div class="fav-grid" id="favGrid"></div></div>
<div class="lab vs-lab">Vorschläge für deinen Ort</div>
<div class="vs-grid" id="wzVorschlaege"></div>
<div class="lab">Oder selbst wählen</div>
<div class="tabs2 wz-mode wz-mode3" id="wzMode"><button data-m="art">Gezeichnet</button><button data-m="std">Landkarte</button><button data-m="sterne">Sternenhimmel</button><button data-m="koord">Koordinaten</button><button data-m="wolke">Wortwolke</button></div>
<div class="wz-kat" id="wzStilKat" role="tablist" aria-label="Themenwelten"></div>
<div class="wz-cards kurz" id="wzStyles"></div>
<button type="button" class="wz-link wz-alle" data-alle="wzStyles">Alle Farbstile anzeigen ›</button>
<div class="wz-hoehe" id="wzHoehe"><label class="tog wz-tog"><input type="checkbox" id="hoehenOn"><span>Höhenlinien (Berge &amp; Täler)</span></label><p class="wz-hint" id="hoehenInfo"></p></div>
<div class="wz-cards wz-bases hidden" id="wzBases"></div>
<div class="wz-koord hidden" id="wzKoord">
<p class="wz-hint">Große Koordinaten, der Ortsname und dein eigener Text – ganz ohne Karte. Den Ortsnamen änderst du im Schritt „Text“.</p>
<label class="wz-field"><span>Dein Text <i>optional</i></span><textarea id="koordText" class="inp" rows="5" maxlength="600" placeholder="Eine kleine Geschichte zu diesem Ort …"></textarea></label>
<div class="lab">Ausrichtung</div>
<div class="wz-chips" id="koordAlign"><button type="button" data-a="links">Linksbündig</button><button type="button" data-a="mitte">Zentriert</button></div>
</div>
<div class="wz-wolke hidden" id="wzWolke">
<p class="wz-hint">Namen, Daten und Wörter füllen eine Form. Wichtige Wörter mit <b>*</b> markieren – sie werden groß.</p>
<label class="wz-field"><span>Wörter (mit Komma getrennt)</span><textarea id="wolkeText" class="inp" rows="4" maxlength="800" placeholder="Emil*, 11.02.2025*, Mama, Papa, Liebe …"></textarea></label>
<div class="lab">Form</div>
<div class="wz-chips" id="wolkeForm"></div>
<label class="tog wz-tog"><input type="checkbox" id="wolkeSchrift"><span>Schreibschrift untermischen</span></label>
</div>
<div class="wz-sky hidden" id="wzSky">
<p class="wz-hint">So stand der Himmel über <b id="skyPlace">deinem Ort</b> – aus echten Sterndaten berechnet.</p>
<div class="wz-row2"><label class="wz-field"><span>Datum</span><input id="skyDate" class="inp" type="date"></label>
<label class="wz-field"><span>Uhrzeit</span><input id="skyTime" class="inp" type="time" step="300"></label></div>
<div class="lab">Himmelsfarbe</div>
<div class="mk-sw" id="skyThemes"></div>
<div class="lab">Anzeigen</div>
<label class="tog wz-tog"><input type="checkbox" id="skyLines"><span>Sternbilder verbinden</span></label>
<label class="tog wz-tog"><input type="checkbox" id="skyNames"><span>Namen der Sternbilder</span></label>
<label class="tog wz-tog"><input type="checkbox" id="skyMw"><span>Milchstraße</span></label>
<label class="tog wz-tog"><input type="checkbox" id="skyGrid"><span>Gitternetz &amp; Himmelsrichtungen</span></label>
<label class="tog wz-tog"><input type="checkbox" id="skyReal"><span>Echte Sternfarben</span></label>
</div>
</section>
<section class="wz-pane" data-step="design">
<h3>Design</h3>
<p class="wz-hint">Wie Rahmen, Karte und Text angeordnet sind. Die Farben kommen vom Stil.</p>
<div class="wz-kat" id="wzDesignKat" role="tablist" aria-label="Themenwelten"></div>
<div class="wz-cards wz-designs kurz" id="wzDesigns"></div>
<button type="button" class="wz-link wz-alle" data-alle="wzDesigns">Alle Designs anzeigen ›</button>
<div class="hidden" id="wzFokus"><div class="lab">Fokus anpassen</div>
<div class="wz-sublab">Form</div><div class="wz-chips" id="wzFokusForm"><button type="button" data-v="fleck">Fleck</button><button type="button" data-v="kreis">Kreis</button><button type="button" data-v="herz">Herz</button><button type="button" data-v="raute">Raute</button></div>
<div class="wz-sublab">Farbe</div><div class="wz-chips wz-farben" id="wzFokusFarben"><button type="button" data-c="" title="Wie der Stil">Stil</button><button type="button" data-c="#cf2e2e" style="--c:#cf2e2e" aria-label="Rot"></button><button type="button" data-c="#262c3a" style="--c:#262c3a" aria-label="Navy"></button><button type="button" data-c="#d8a93b" style="--c:#d8a93b" aria-label="Gold"></button><button type="button" data-c="#2440d8" style="--c:#2440d8" aria-label="Blau"></button><button type="button" data-c="#2f8f5b" style="--c:#2f8f5b" aria-label="Grün"></button><button type="button" data-c="#f08aa8" style="--c:#f08aa8" aria-label="Rosa"></button><label class="wz-eigen" title="Eigene Farbe"><input type="color" id="wzFokusEigen" aria-label="Eigene Farbe für den Fokus"></label></div>
<div class="row wz-kipp"><span class="k">Größe</span><input type="range" id="wzFokusGr" min="0.12" max="0.5" step="0.01" aria-label="Größe des Fokus"></div>
<div class="row wz-kipp"><span class="k">Waagrecht</span><input type="range" id="wzFokusX" min="0.1" max="0.9" step="0.01" aria-label="Fokus nach links oder rechts"></div>
<div class="row wz-kipp"><span class="k">Senkrecht</span><input type="range" id="wzFokusY" min="0.1" max="0.9" step="0.01" aria-label="Fokus nach oben oder unten"></div>
</div>
<div class="hidden" id="wzForm"><div class="lab">Eigene Form</div>
<div class="wz-form"><svg id="wzFormBild" viewBox="0 0 100 100" aria-hidden="true"></svg><div><label class="btn primary wz-hoch"><input type="file" id="wzFormDatei" accept="image/*" hidden>Bild hochladen</label><button type="button" class="wz-link hidden" id="wzFormWeg">Wieder Buchstabe</button></div></div>
<p class="wz-hint">Am besten eine <b>Silhouette</b>, ein Logo oder ein <b>freigestelltes Foto</b> (durchsichtiger Hintergrund). Tipp iPhone: In „Fotos“ das Motiv lange gedrückt halten → „Teilen“ → „Bild sichern“ – dann ist der Hintergrund schon weg.</p>
<div class="hidden" id="wzFormBildOpt"><label class="tog wz-tog"><input type="checkbox" id="wzFormUm"><span>Umkehren (Hintergrund wird zur Form)</span></label>
<div class="row wz-kipp" id="wzFormSchwRow"><span class="k">Schwelle</span><input type="range" id="wzFormSchw" min="10" max="245" step="1" aria-label="Hell/Dunkel-Schwelle"></div></div>
<div class="wz-sublab">… oder ein Buchstabe, eine Zahl</div><div class="wz-zeile"><input id="wzFormText" class="inp" type="text" maxlength="6" autocomplete="off" placeholder="z. B. B, ♥ oder 25"><button type="button" class="btn" id="wzFormTextGo">Übernehmen</button></div>
</div>
<div class="hidden" id="wzTypo"><div class="lab">Typografie anpassen</div>
<div class="wz-sublab">Stil</div><div class="wz-chips" id="wzTypoStil"><button type="button" data-v="voll">Gefüllt</button><button type="button" data-v="umriss">Umriss</button><button type="button" data-v="schnitt">Karte in Buchstaben</button></div>
<div class="wz-sublab">Schrift</div><div class="wz-chips" id="wzTypoSchrift"><button type="button" data-v="SgXB"><b style="font-family:SgXB">Fett</b></button><button type="button" data-v="SgMD"><span style="font-family:SgMD">Fein</span></button><button type="button" data-v="SgBR"><span style="font-family:SgBR;font-size:17px">Pinsel</span></button><button type="button" data-v="SgSC"><span style="font-family:SgSC;font-size:19px">Schrift</span></button><button type="button" data-v="SgFR"><span style="font-family:SgFR">Fraktur</span></button></div>
<div class="wz-sublab">Zeilen</div><div class="wz-chips" id="wzTypoZeilen"><button type="button" data-v="0">Auto</button><button type="button" data-v="1">1</button><button type="button" data-v="2">2</button><button type="button" data-v="3">3</button></div>
<div class="wz-sublab">Farbe der Buchstaben</div><div class="wz-chips wz-farben" id="wzTypoFarben"><button type="button" data-c="" title="Wie der Stil">Stil</button><button type="button" data-c="#ffffff" style="--c:#ffffff" aria-label="Weiß"></button><button type="button" data-c="#1b1f2a" style="--c:#1b1f2a" aria-label="Schwarz"></button><button type="button" data-c="#cf2e2e" style="--c:#cf2e2e" aria-label="Rot"></button><button type="button" data-c="#262c3a" style="--c:#262c3a" aria-label="Navy"></button><button type="button" data-c="#d8a93b" style="--c:#d8a93b" aria-label="Gold"></button><button type="button" data-c="#2440d8" style="--c:#2440d8" aria-label="Blau"></button><button type="button" data-c="#2f8f5b" style="--c:#2f8f5b" aria-label="Grün"></button><button type="button" data-c="#f08aa8" style="--c:#f08aa8" aria-label="Rosa"></button><label class="wz-eigen" title="Eigene Farbe"><input type="color" id="wzTypoEigen" aria-label="Eigene Farbe für die Buchstaben"></label></div>
<div class="row wz-kipp"><span class="k">Deckkraft</span><input type="range" id="wzTypoDeck" min="0.2" max="1" step="0.05" aria-label="Deckkraft der Buchstaben"></div>
</div>
</section>
<section class="wz-pane" data-step="text">
<h3>Text</h3>
<label class="wz-field"><span>Titel</span><input id="wzTitle" class="inp" type="text" autocomplete="off"></label>
<label class="wz-field"><span>Untertitel</span><input id="wzSub" class="inp" type="text" autocomplete="off"></label>
<div class="lab">Schriften</div>
<div class="wz-chips wz-fonts" id="wzFonts"><button type="button" data-t="SgXB" data-s="SgFR"><b style="font-family:SgXB">AB</b> <span style="font-family:SgFR">Fraktur</span></button><button type="button" data-t="SgXB" data-s="SgMD"><b style="font-family:SgXB">AB</b> <span style="font-family:SgMD">Modern</span></button><button type="button" data-t="SgXB" data-s="SgSC"><b style="font-family:SgXB">AB</b> <span style="font-family:SgSC;font-size:17px">Schrift</span></button><button type="button" data-t="SgSC" data-s="SgMD"><b style="font-family:SgSC;font-size:19px;font-weight:400">Schreibschrift</b></button><button type="button" data-t="SgBR" data-s="SgMD"><b style="font-family:SgBR;font-size:18px;font-weight:400">Pinsel</b></button></div>
<label class="wz-field"><span>Datum oder Widmung <i>optional</i></span><input id="wzNote" class="inp" type="text" autocomplete="off" placeholder="z. B. 12.06.2021 · Hier hat alles begonnen"></label>
<div class="wz-ideen" id="wzNoteIdeen"></div>
<label class="tog wz-tog"><input type="checkbox" id="wzCoords"><span>Koordinaten anzeigen</span></label>
<div class="hidden" id="wzInfo"><div class="lab">Zusatztexte <i>für dieses Design</i></div>
<label class="wz-field" data-info="kopf"><span>Kopfzeile <i>leer = Untertitel</i></span><input id="wzInfoKopf" class="inp" type="text" autocomplete="off" placeholder="z. B. Orte in Franken"></label>
<label class="wz-field" data-info="nr"><span>Nummer <i>optional</i></span><input id="wzInfoNr" class="inp" type="text" autocomplete="off" placeholder="z. B. 03/10"></label>
<label class="wz-field" data-info="kicker"><span>Kleine Zeile über dem Titel</span><input id="wzInfoKicker" class="inp" type="text" autocomplete="off" placeholder="z. B. Stadtplan · Am"></label>
<label class="wz-field" data-info="absatz"><span>Text oben <i>leer = Vorschlag</i></span><textarea id="wzInfoAbsatz" class="inp" rows="3" placeholder="Wofür ist dein Ort bekannt? Ein paar Sätze …"></textarea></label>
<label class="wz-field" data-info="fakten"><span>Fakten <i>eine pro Zeile, leer = automatisch</i></span><textarea id="wzInfoFakten" class="inp" rows="4" placeholder="Einwohner: 1.240&#10;Höhe: 420 m&#10;Erstmals erwähnt: 1124"></textarea></label>
</div>
</section>
<section class="wz-pane" data-step="extras">
<h3>Extras</h3>
<div class="lab">Orte markieren</div>
<p class="wz-hint">Herz, Pin oder Stern ins Poster setzen und an die richtige Stelle ziehen.</p>
<div class="wz-pinadd" id="wzPinAdd"></div>
<div class="wz-pins" id="wzPins"></div>
<div class="mk-sw wz-pincol" id="wzPinCol"></div>
<div class="lab">Effekte</div>
<label class="tog wz-tog"><input type="checkbox" id="fxPaper"><span>Papier-Struktur</span></label>
<label class="tog wz-tog"><input type="checkbox" id="fxVig"><span>Vignette (Rand abdunkeln)</span></label>
<label class="tog wz-tog"><input type="checkbox" id="fxGlow"><span>Leuchten (Lichtschein in der Mitte)</span></label>
<div class="wz-3d" id="wz3d"><div class="lab">3D-Effekte</div>
<label class="tog wz-tog"><input type="checkbox" id="fxH3d"><span>3D-Häuser (Gebäude in die Höhe)</span></label>
<label class="tog wz-tog"><input type="checkbox" id="fxSchatten"><span>Häuser mit Schatten</span></label>
<label class="tog wz-tog"><input type="checkbox" id="fxRelief"><span>Relief – Berge &amp; Täler schattiert</span></label>
<label class="tog wz-tog nur-std"><input type="checkbox" id="fxGelaende"><span>Gelände plastisch (Berge in 3D)</span></label>
<div class="row wz-kipp"><span class="k">Perspektive</span><input type="range" id="fxKipp" min="0" max="60" step="5" aria-label="Perspektive kippen"><output id="fxKippV">aus</output></div>
<div class="row wz-kipp"><span class="k">Drehen</span><input type="range" id="fxDreh" min="-180" max="180" step="15" aria-label="Karte drehen"><output id="fxDrehV">Nord</output></div>
<p class="wz-hint" id="wz3dHint">Für Karten – bei Sternenhimmel, Koordinaten, Wortwolke und mehreren Orten nicht verfügbar.</p>
<p class="wz-hint nur-std" id="wz3dStd">Echte 3D-Ansicht: Kamera kippen und drehen, Gebäude und Berge in 3D. Markierungen lassen sich dabei nicht verschieben.</p></div>
</section>
<section class="wz-pane" data-step="produkt">
<div class="tabs2 fz-tabs" id="fertigTabs" role="tablist" aria-label="Fertig"><button type="button" role="tab" data-t="produkt">Produkt</button><button type="button" role="tab" data-t="laden">Herunterladen</button><button type="button" role="tab" data-t="teilen">Teilen</button></div>
<div data-fsub="produkt">
<div class="wz-prod" id="wzProd"></div>
<div class="price" id="wzPrice"><b id="priceVal">–</b><span>inkl. MwSt. · <i>Beispielpreis</i></span><small id="priceDet"></small><small class="ship" id="priceShip"></small></div>
<button type="button" class="btn wz-order" disabled title="Kommt bald"><span id="orderLabel">Bestellen</span><small>bald verfügbar</small></button>
<div class="mk-opt" data-for="poster gerahmt leinwand alu download"><div class="lab">Größe</div><div class="wz-chips wz-sizes" data-sizes></div>
<label class="tog wz-tog wz-quer"><input type="checkbox" data-quer><span>Querformat</span></label>
<div class="wz-free" id="wzFree"><div class="lab">Seitenverhältnis der Karte</div>
<div class="wz-chips" id="wzFmt"><button data-a="0.8805">8 : 7</button><button data-a="1">1 : 1</button><button data-a="1.25">4 : 5</button><button data-a="1.3333">3 : 4</button><button data-a="0.6667">3 : 2</button></div></div>
</div>
<div class="mk-opt" data-for="gerahmt aufsteller"><div class="lab">Rahmen</div><div class="mk-sw" id="mkFrameSw"></div>
<label class="tog wz-tog"><input type="checkbox" id="mkMat"><span>Passepartout (heller Rand)</span></label></div>
<div class="mk-opt" data-for="shirt"><div class="lab">Shirtfarbe</div><div class="mk-sw" id="mkShirtSw"></div>
<label class="tog wz-tog"><input type="checkbox" id="mkModel"><span>Am Model zeigen</span></label></div>
<details class="wz-more mk-opt" data-for="poster gerahmt leinwand alu aufsteller"><summary>Vorschau anpassen: Raum, Wandfarbe, 3er-Set</summary>
<div class="mk-opt" data-for="poster gerahmt leinwand alu aufsteller"><div class="lab">Raum</div><div class="mk-sw mk-rooms" id="mkRoomSw"></div></div>
<div class="mk-opt" data-for="poster gerahmt leinwand alu aufsteller"><div class="lab">Wandfarbe</div><div class="mk-sw" id="mkWallSw"></div></div>
<div class="mk-opt" data-for="poster gerahmt leinwand alu"><label class="tog wz-tog"><input type="checkbox" id="mkSet"><span>Als 3er-Set zeigen (Koordinaten · Karte · Sternenhimmel)</span></label></div>
</details>
<p class="wz-hint mk-note">Bestellen kommt bald – die Druckdatei gibt es schon jetzt unter „Herunterladen“.</p>
</div>
</section>
<section class="wz-pane" data-step="fertig">
<div data-fsub="laden">
<div class="qa" id="wzQa"></div>
<label class="tog wz-tog wz-proof"><input type="checkbox" id="softproof"><span>Druckfarben simulieren</span></label>
<div class="wz-dl">
<button data-f="pdfv"><b>PDF für die Druckerei</b><span>Vektor · gestochen scharf in jeder Größe · 3 mm Beschnitt</span></button>
<button data-f="pdf"><b>PDF als Bild</b><span id="wzPdfInfo">Endformat + 3 mm Beschnitt</span></button>
<button data-f="png" data-w="3600"><b>PNG für den Druck</b><span>3600 px · ca. 30 cm bei 300 dpi</span></button>
<button data-f="png" data-w="4800"><b>PNG groß</b><span>4800 px · ca. 40 cm bei 300 dpi</span></button>
<button data-f="svg"><b>SVG (Vektor)</b><span>beliebig skalierbar · für Druckereien</span></button>
</div>
<p class="wz-hint">PNG und SVG haben einen transparenten Hintergrund – ideal für T-Shirts.</p>
</div>
<div data-fsub="teilen">
<div class="lab">Meinung einholen</div>
<button type="button" class="btn wz-share" id="shareImg"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>Vorschau als Bild teilen</button>
<p class="wz-hint">Schick das Bild per WhatsApp &amp; Co. an Familie oder Freunde.</p>
<div class="lab">Verschenken</div>
<label class="wz-field"><span>Deine Botschaft</span><textarea id="giftMsg" class="inp" rows="3" maxlength="280" placeholder="z. B. Damit du deine Heimat immer bei dir hast."></textarea></label>
<label class="wz-field"><span>Von</span><input id="giftFrom" class="inp" type="text" maxlength="60" placeholder="z. B. Anna &amp; Tom"></label>
<div class="wz-gift"><button type="button" class="btn" id="giftLink">Geschenk-Link kopieren</button><button type="button" class="btn" id="giftCard">Geschenkkarte (Bild)</button></div>
<p class="wz-hint">Der Link öffnet das Poster mit deiner Botschaft – der Beschenkte kann es dann selbst anpassen oder herunterladen.</p>
<div class="lab">Teilen</div>
<button type="button" class="btn wz-share" id="wzShare"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>Link zum Entwurf kopieren</button>
<p class="wz-legal"><a href={resolve('/impressum')} data-sveltekit-reload>Impressum</a> · <a href={resolve('/datenschutz')} data-sveltekit-reload>Datenschutz</a> · <a href={resolve('/agb')} data-sveltekit-reload>AGB</a> · <a href={resolve('/lizenzen')} data-sveltekit-reload>Lizenzen</a></p>
<p class="wz-hint">Dein Entwurf wird automatisch in diesem Browser gemerkt. Mit dem Link kannst du ihn auf einem anderen Gerät öffnen oder jemandem zeigen.</p>
</div>
</section>
<button type="button" class="wz-link wz-alllink" data-adv-open>Alle Einstellungen für den Feinschliff ›</button>
</div>
<div class="wz-foot">
<button class="wz-back" id="wzBack" aria-label="Zurück"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
<button class="wz-advbtn" id="wzAdv" title="Alle Detailregler: Linien, einzelne Häuser, Farben tauschen …"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg><span>Erweitert</span></button>
<button class="wz-next" id="wzNext"><span class="nx"><small id="wzNextSmall">Weiter</small><b id="wzNextLabel">Gestalten</b></span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>
</div>
</div>

<!-- Erweiterte Einstellungen: alle Detailregler aus dem Prototyp -->
<div class="adv hidden" id="adv">
<button class="adv-back" id="advBack">‹ Zurück zum Assistenten</button>
<div class="place"><div class="pin">⌖</div><div style="flex:1;min-width:0"><b id="placeName">Noch kein Ort gewählt</b><span id="placeInfo">Suche einen Ort, um zu starten</span></div><button class="btn sm" id="openPicker2">Ändern</button></div>

<div class="sec open" data-s="ausschnitt"><button class="sh"><span class="num">01</span><span class="tt">Ausschnitt</span><span class="sum" id="sumA"></span><span class="chev">▾</span></button><div class="sb">
<div class="lab">Format</div>
<div class="seg" id="fmt2"><button data-a="0.8805">8 : 7</button><button data-a="1">1 : 1</button><button data-a="1.25">4 : 5</button><button data-a="1.3333">3 : 4</button><button data-a="0.6667">3 : 2</button></div>
<select id="aspect2" class="hidden"><option value="0.8805">8 : 7</option><option value="1">1 : 1</option><option value="1.25">4 : 5</option><option value="1.3333">3 : 4</option><option value="0.6667">3 : 2</option></select>
<div class="lab">Kartenzoom</div>
<div class="row"><button class="btn sm" id="zOut" title="Herauszoomen">−</button><input id="vZoom" type="range" min="0" max="100" step="1"><button class="btn sm" id="zIn" title="Hineinzoomen">+</button></div>
<div class="hint">Feinjustieren: Werkzeug <b>✋ Verschieben</b> unten in der Vorschau wählen, Karte ziehen, mit dem Mausrad zoomen.</div>
<div class="row" style="margin-top:12px"><button class="btn sm" id="vReset">Ausschnitt zurücksetzen</button><button class="btn sm ghost" id="openPicker3">Anderen Ort wählen</button></div>
</div></div>

<div class="sec" data-s="stil"><button class="sh"><span class="num">02</span><span class="tt">Stil</span><span class="sum" id="sumS"></span><span class="chev">▾</span></button><div class="sb">
<div class="tabs2" id="modeTabs"><button data-m="art">Künstlerisch</button><button data-m="std">Standard</button></div>
<div id="artBox">
<div class="hint" style="margin:8px 0 10px">Gezeichnete Karte – jedes Haus und jede Straße bleibt einzeln bearbeitbar. Ideal für Druck.</div>
<div class="styles" id="styles"></div>
<div class="tdesc" id="themeDesc"></div>
<details class="cust"><summary>Eigene Farben</summary>
<div class="cgrid">
<label><input type="color" id="cBg">Hintergrund</label><label><input type="color" id="cHaus">Gebäude</label>
<label><input type="color" id="cHausL">Gebäudelinie</label><label><input type="color" id="cHaupt">Hauptstraßen</label>
<label><input type="color" id="cNeben">Nebenstraßen</label><label><input type="color" id="cWasser">Wasser</label>
<label><input type="color" id="cGruen">Grünflächen</label></div></details>
<div class="lab">Linienstärke gesamt</div>
<div class="row"><input type="range" id="gScale" min="0.4" max="2.5" step="0.05"><span class="v" id="gScalev"></span></div>
</div>
<div id="stdBox" class="hidden">
<div class="hint" style="margin:8px 0 10px">Fertig gezeichnete Straßenkarte oder Luftbild (Bayern) – wie bei Online-Karten.</div>
<div class="bases" id="bases"></div>
<div class="row" style="margin-top:12px"><label class="tog"><input type="checkbox" id="labelsOn"> Ortsnamen & Beschriftungen</label></div>
<div class="hint">Diese Stile sind Bilder: Einzelne Häuser oder Straßen lassen sich hier nicht umfärben. Beim starken Hineinzoomen wird das Bild unschärfer.</div>
</div>
</div></div>

<div class="sec" data-s="elemente"><button class="sh"><span class="num">03</span><span class="tt">Kartenelemente</span><span class="sum" id="sumE"></span><span class="chev">▾</span></button><div class="sb">
<div id="elStd" class="hidden card hint" style="margin-top:4px">Im Stil <b>Standard</b> ist die Karte ein fertiges Bild. Um einzelne Häuser und Straßen zu färben, wechsle bei <b>02 Stil</b> auf <b>Künstlerisch</b>.</div>
<div id="elArt">
<div class="lab">Ganze Gruppe bearbeiten</div>
<div class="chips" id="grpbtns"></div>
<div class="lab">Auswahl</div>
<div class="card"><div class="selinfo"><span id="selinfo">Nichts ausgewählt</span><button class="btn sm ghost" id="desel">Aufheben</button></div>
<div class="hint" id="selhint" style="margin-top:6px">Klicke in der Vorschau auf Häuser oder Straßen – oder ziehe mit gedrückter Maus einen Rahmen um mehrere.</div>
<div id="pMap" class="hidden" style="margin-top:6px">
<div class="row"><span class="k">Linienfarbe</span><div class="col"><input type="color" id="mStroke"><div class="sw" data-for="mStroke"></div></div></div>
<div class="row"><span class="k">Füllung</span><div class="col"><label class="tog"><input type="checkbox" id="mFillOn"></label><input type="color" id="mFill"></div></div>
<div class="row"><span class="k">Linienstärke</span><input type="range" id="mW" min="0" max="16" step="0.1"><span class="v" id="mWv"></span></div>
<div class="row"><span class="k"></span><button class="btn sm" id="mHide">Ausblenden</button><button class="btn sm" id="mShow">Einblenden</button></div>
</div></div>
<span id="mHead" class="hidden"></span>
</div>
</div></div>

<div class="sec" data-s="rahmen"><button class="sh"><span class="num">04</span><span class="tt">Rahmen & Fläche</span><span class="sum" id="sumR"></span><span class="chev">▾</span></button><div class="sb">
<div class="lab">Rahmen</div>
<div class="row"><span class="k">Farbe</span><div class="col"><input type="color" id="fColor"><div class="sw" data-for="fColor"></div></div></div>
<div class="row"><span class="k">Stärke</span><input type="range" id="fW" min="0" max="40" step="1"><span class="v" id="fWv"></span></div>
<div class="row"><span class="k">Ecken</span><input type="range" id="fR" min="0" max="120" step="1"><span class="v" id="fRv"></span></div>
<div class="row"><span class="k">Innenabstand</span><input type="range" id="fP" min="0" max="80" step="1"><span class="v" id="fPv"></span></div>
<div class="lab">Textbalken</div>
<div class="row"><span class="k">Anzeigen</span><label class="tog"><input type="checkbox" id="bOn"></label></div>
<div class="row"><span class="k">Farbe</span><div class="col"><input type="color" id="bColor"><div class="sw" data-for="bColor"></div></div></div>
<div class="row"><span class="k">Höhe</span><input type="range" id="bH" min="60" max="500" step="1"><span class="v" id="bHv"></span></div>
<div class="row"><span class="k"></span><label class="tog"><input type="checkbox" id="bAuto"> automatisch an Text anpassen</label></div>
<div class="row"><span class="k">Zeilenabstand</span><input type="range" id="bGap" min="0" max="80" step="1"><span class="v" id="bGapv"></span></div>
<div class="lab">Kartenhintergrund</div>
<div class="row"><span class="k">Füllen</span><div class="col"><label class="tog"><input type="checkbox" id="bgOn"></label><input type="color" id="bgColor"><div class="sw" data-for="bgColor"></div></div></div>
</div></div>

<div class="sec" data-s="text"><button class="sh"><span class="num">05</span><span class="tt">Text</span><span class="sum" id="sumT"></span><span class="chev">▾</span></button><div class="sb">
<div class="tabs2"><button id="tabTitle" class="on">Titel</button><button id="tabSub">Untertitel</button></div>
<div class="row"><input type="text" class="inp" id="tText" placeholder="Text eingeben"><label class="tog" title="anzeigen"><input type="checkbox" id="tOn"></label></div>
<div class="row"><span class="k">Schrift</span><select class="inp" id="tFont"><option value="SgXB">Inter Extra Bold</option><option value="SgMD">Inter Medium</option><option value="SgFR">Fraktur</option><option value="SgSC">Schreibschrift</option><option value="SgBR">Pinsel</option><option value="SgBE">Plakat (schmal)</option></select></div>
<div class="row"><span class="k">Größe</span><input type="range" id="tSize" min="10" max="160" step="1"><span class="v" id="tSizev"></span></div>
<div class="row"><span class="k">Abstand</span><input type="range" id="tLs" min="-5" max="40" step="0.5"><span class="v" id="tLsv"></span></div>
<div class="row"><span class="k">Farbe</span><div class="col"><input type="color" id="tColor"><div class="sw" data-for="tColor"></div></div></div>
<div class="row"><span class="k"></span><button class="btn sm" id="tCoord">⌖ Koordinaten einsetzen</button></div>
<div class="lab">Quellenangabe</div>
<label class="tog"><input type="checkbox" id="attrOn"> „© OpenStreetMap-Mitwirkende“</label>
<div class="hint" style="margin-top:6px">Für Kartendaten aus OpenStreetMap ist diese Angabe auf dem Druck Pflicht.</div>
</div></div>

<div class="sec" data-s="farben"><button class="sh"><span class="num">06</span><span class="tt">Farben tauschen</span><span class="sum"></span><span class="chev">▾</span></button><div class="sb">
<div class="hint" style="margin-bottom:8px">Eine Farbe überall im Design durch eine andere ersetzen.</div>
<div class="row"><span class="k">Alte Farbe</span><select class="inp" id="rOld"></select></div>
<div class="row"><span class="k">Neue Farbe</span><div class="col"><input type="color" id="rNew" value="#000000"><button class="btn sm" id="rGo">Ersetzen</button></div></div>
</div></div>
</div>
</aside>

<section class="stage">
<!-- svelte-ignore a11y_no_noninteractive_tabindex (scrollbare Fläche muss per Tastatur erreichbar sein) -->
<div class="canvas checker" id="canvas" role="region" tabindex="0" aria-label="Poster-Vorschau"><svg id="poster" xmlns="http://www.w3.org/2000/svg"></svg></div>
<div class="poster-tools" id="posterTools" role="toolbar" aria-label="Vorschau">
<button type="button" class="pt" id="ptOut" title="Vorschau verkleinern" aria-label="Vorschau verkleinern"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h12"/></svg></button>
<button type="button" class="pt pt-proz" id="ptProz" title="Auf Fenstergröße einpassen">100 %</button>
<button type="button" class="pt" id="ptIn" title="Vorschau vergrößern" aria-label="Vorschau vergrößern"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg></button>
<i class="pt-trenn" aria-hidden="true"></i>
<button type="button" class="pt" id="ptFit" title="Einpassen" aria-label="Poster einpassen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/></svg></button>
<i class="pt-trenn" aria-hidden="true"></i>
<button type="button" class="pt fav-btn" id="favBtn" title="Diesen Entwurf merken" aria-label="Entwurf merken"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg><span>Merken</span></button>
<button type="button" class="pt" id="ptVgl" hidden title="Favoriten nebeneinander vergleichen"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="7" height="14" rx="1.5"/><rect x="13.5" y="5" width="7" height="14" rx="1.5"/></svg><span>Vergleichen</span></button>
</div>
<div class="mockup" id="mockup" aria-live="polite"><div class="mk-scene" id="mkScene"></div></div>
<div class="toolhint" id="toolHint"></div>
<div class="dock" id="dock">
<button class="tb on" id="toolSel" title="Auswählen (V)">↖ Auswählen</button>
<button class="tb" id="toolMove" title="Ausschnitt verschieben (H)">✋ Verschieben</button>
<span class="sep"></span>
<span class="zl" style="font-size:12px;color:var(--muted);padding:0 4px">Ansicht</span><input id="zoom" type="range" min="40" max="300" value="100" title="Vorschau-Größe">
<span class="sep"></span>
<div class="bgs" title="Vorschau-Hintergrund"><button data-bg="checker" class="on" style="background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/8px 8px" title="Transparent"></button><button data-bg="#ffffff" style="background:#fff" title="Weiß"></button><button data-bg="#d9d9d9" style="background:#d9d9d9" title="Grau"></button><button data-bg="#1c2333" style="background:#1c2333" title="Navy"></button><button data-bg="#111111" style="background:#111" title="Schwarz"></button></div>
</div>
<div class="toast" id="msg"></div>
<div id="marq"></div>

<div class="landing lp" id="landing">
<section class="lp-hero">
<div class="lp-hero-txt">
<span class="lp-eyebrow">Personalisierte Kartenposter · Shirts · Tassen</span>
<h1>Deine Heimat als Poster – in Sekunden gestaltet.</h1>
<p class="lp-lead">Ort eintippen, und dein Kartenposter steht sofort. Dann Stil, Design und Text wählen und direkt an Wand, Shirt oder Tasse ansehen.</p>
<div class="occ occ-landing" data-occ aria-label="Anlass (optional)"></div>
<div class="search lp-search"><input id="lq" placeholder="Dorf, Stadt oder Adresse" autocomplete="off" enterkeyhint="search" aria-label="Ort suchen"><button class="btn primary" id="lgo">Poster gestalten</button><div class="results hidden" id="lresults"></div></div>
<button type="button" class="lp-geo" id="lgeo"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>Mein Standort</button>
<button class="demo resume hidden" id="resumeBtn"><span class="dpin">↺</span><span><b>Weiter mit deinem Entwurf</b><small></small></span></button>
<ul class="lp-trust"><li>Ohne Anmeldung</li><li>Vorschau sofort</li><li>Poster ab {ab('poster')}</li></ul>
</div>
<div class="lp-collage" aria-hidden="true">
<img class="c1" src={asset('beispiele/bamberg-typo.webp')} alt="" />
<img class="c2" src={asset('beispiele/nuernberg-nacht.webp')} alt="" />
<img class="c3" src={asset('beispiele/bamberg-sterne.webp')} alt="" />
</div>
</section>

<section class="lp-band" aria-label="Vorteile">
<div><b>Jeder Ort der Welt</b><span>vom Dorf bis zur Großstadt</span></div>
<div><b>Über 25 Designs</b><span>und mehr als 20 Farbwelten</span></div>
<div><b>Echte Vorschau</b><span>maßstäblich im Raum</span></div>
<div><b>Druckfertige Datei</b><span>Vektor-PDF mit Beschnitt</span></div>
</section>

<section class="lp-sec">
<div class="lp-head"><h2>Beliebte Designs</h2><p>Antippen – das Poster öffnet sich fertig gestaltet. Danach ist alles änderbar.</p></div>
<div class="bsp-strip" id="bspStrip"></div>
</section>

<section class="lp-sec">
<div class="lp-head"><h2>Für jeden Anlass</h2><p>Wähle einen Anlass, und Stil, Herz-Markierung und Widmung sind schon passend gesetzt.</p></div>
<div class="lp-anl">
{#each ANL as [k, titel, text] (k)}<button type="button" onclick={() => anlass(k)}><b>{titel}</b><span>{text}</span></button>{/each}
</div>
</section>

<section class="lp-sec">
<div class="lp-head"><h2>Mehr als eine Karte</h2><p>Sechs Motive, alle im gleichen Editor.</p></div>
<div class="lp-motive">
{#each MOTIVE as [id, titel, text] (id)}<button type="button" onclick={() => beispiel(id)}><img src={asset(`beispiele/${id}.webp` as any)} alt="" loading="lazy" /><b>{titel}</b><span>{text}</span></button>{/each}
</div>
</section>

<section class="lp-sec">
<div class="lp-head"><h2>Dein Motiv auf …</h2><p>Sieh dein Design vor dem Kauf an der Wand, auf dem Shirt oder auf der Tasse.</p></div>
<div class="lp-prod">
{#each PROD as [k, name, d] (k)}<div><svg viewBox="0 0 40 40" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">{@html PICON[k]}</svg><b>{name}</b><span>{d}</span><em>ab {ab(k)}</em></div>{/each}
</div>
<p class="lp-note">Beispielpreise inkl. MwSt. – die Bestellung startet in Kürze. Die Druckdatei kannst du schon heute herunterladen.</p>
</section>

<section class="lp-sec lp-how">
<div class="lp-head"><h2>So einfach geht's</h2></div>
<ol>
<li><b>Ort eintippen</b><span>Das Poster ist sofort fertig eingestellt: Ortskern, Name, Region.</span></li>
<li><b>Gestalten</b><span>Stil, Design, Schrift, Herz-Markierung und Datum wählen.</span></li>
<li><b>Ansehen</b><span>Als Poster, im Rahmen, auf Leinwand, Shirt oder Tasse.</span></li>
<li><b>Herunterladen</b><span>Druckfertige Datei, bald auch direkt bestellen.</span></li>
</ol>
</section>

<section class="lp-sec lp-faq">
<div class="lp-head"><h2>Häufige Fragen</h2></div>
<details><summary>Kann ich wirklich jeden Ort wählen?</summary><p>Ja – jedes Dorf, jede Stadt und jede Adresse weltweit. Die Kartendaten stammen aus OpenStreetMap und sind sehr detailliert, gerade auch auf dem Land.</p></details>
<details><summary>Brauche ich ein Konto?</summary><p>Nein. Dein Entwurf wird automatisch in deinem Browser gemerkt, und per Link kannst du ihn auf einem anderen Gerät öffnen oder teilen.</p></details>
<details><summary>Welche Dateien bekomme ich?</summary><p>Ein druckfertiges PDF mit Beschnitt für die Druckerei, ein hochaufgelöstes PNG mit transparentem Hintergrund (ideal für Shirts) und eine SVG-Vektordatei.</p></details>
<details><summary>Kann ich direkt bestellen?</summary><p>Die Bestellung von Postern, Rahmen, Leinwand, Shirts und Tassen kommt in Kürze. Bis dahin kannst du die Druckdatei herunterladen und selbst drucken lassen.</p></details>
<button type="button" class="lp-link" onclick={() => document.getElementById('chatBtn')?.click()}>Weitere Fragen? Frag unseren Hilfe-Chat ›</button>
</section>

<section class="lp-cta">
<h2>Welchen Ort willst du verewigen?</h2>
<button type="button" class="btn" onclick={zurSuche}>Jetzt Poster gestalten</button>
</section>

<footer class="lp-foot">
<a class="orte-link" href={resolve('/poster')} data-sveltekit-reload>Ortsposter aus Franken und Bayern ›</a>
<div class="legal"><a href={resolve('/impressum')} data-sveltekit-reload>Impressum</a> · <a href={resolve('/datenschutz')} data-sveltekit-reload>Datenschutz</a> · <a href={resolve('/agb')} data-sveltekit-reload>AGB</a> · <a href={resolve('/lizenzen')} data-sveltekit-reload>Lizenzen</a></div>
<small>Kartendaten © OpenStreetMap-Mitwirkende</small>
</footer>
</div>
</section>
</div>

<div class="bsp-ov" id="favOverlay" hidden><div class="bsp-panel fav-panel" role="dialog" aria-modal="true" aria-labelledby="favTitel">
<div class="bsp-ph"><div><b id="favTitel">Favoriten vergleichen</b><small>Antippen übernimmt den Entwurf.</small></div><button class="ibtn" id="favClose" aria-label="Schließen">✕</button></div>
<div class="fav-cmpgrid" id="favCmpGrid"></div></div></div>
<div class="bsp-ov" id="bspOverlay" hidden><div class="bsp-panel" role="dialog" aria-modal="true" aria-labelledby="bspTitel">
<div class="bsp-ph"><div><b id="bspTitel">Beispiele zur Inspiration</b><small>Antippen übernimmt den Look für deinen Ort – Stil, Design und Motiv.</small></div><button class="ibtn" id="bspClose" aria-label="Schließen">✕</button></div>
<div class="bsp-grid" id="bspGrid"></div></div></div>

<div class="chat" id="chat" role="dialog" aria-label="Hilfe-Chat" aria-hidden="true">
<div class="chat-h"><div><b>Kartenstudio-Hilfe</b><small id="chatMode">Antwortet sofort</small></div><button class="ibtn" id="chatX" aria-label="Chat schließen">✕</button></div>
<div class="chat-log" id="chatLog" aria-live="polite"></div>
<form class="chat-f" id="chatForm"><input id="chatIn" class="inp" type="text" autocomplete="off" maxlength="500" placeholder="Deine Frage …" enterkeyhint="send"><button class="btn primary" type="submit" aria-label="Senden">➤</button></form>
</div>

<div class="picker hidden" id="picker">
<div class="pk">
<div class="pkh">
<div class="search"><input id="q" placeholder="Ort suchen …" autocomplete="off"><button class="btn sm primary" id="go">Suchen</button><div class="results hidden" id="results"></div></div>
<div class="seg" id="fmt1"><button data-a="0.8805" class="on">8 : 7</button><button data-a="1">1 : 1</button><button data-a="1.25">4 : 5</button><button data-a="1.3333">3 : 4</button><button data-a="0.6667">3 : 2</button></div>
<input type="hidden" id="aspect" value="0.8805">
<button class="ibtn" id="pClose" title="Schließen">✕</button>
</div>
<div id="mapwrap"><div id="map"></div><div id="frameov"></div>
<div id="loader"><div class="lt" id="loadText">Wir rollen die Landkarte aus …</div><div class="bar"><i id="loadBar"></i></div><div class="ls" id="loadSub">Daten kommen frisch aus OpenStreetMap</div></div>
<div id="maperr">Die Karte konnte nicht geladen werden. Prüfe die Internetverbindung und lade die Seite neu.</div></div>
<div class="pkf">
<div class="info"><b>Karte verschieben und zoomen</b>, bis dein Ausschnitt im Rahmen liegt. <span id="sizeinfo"></span><div id="pStatus"></div></div>
<button class="btn" id="pCancel">Abbrechen</button>
<button class="btn accent" id="gen">✓ Ausschnitt übernehmen</button>
</div>
</div>
</div>
