<script lang="ts">
	// Kartenstudio – Editor-Seite.
	// Das HTML-Gerüst stammt aus dem Prototyp; die Logik liegt in #lib/editor, #lib/karte, #lib/themen, #lib/export.
	import '#lib/editor/editor.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		const { start } = await import('#lib/editor/start.js');
		start();
	});
</script>

<svelte:head>
	<title>Kartenstudio</title>
	<meta name="description" content="Deinen Ort als Poster- oder T-Shirt-Motiv gestalten." />
	<meta name="theme-color" content="#262c3a" />
</svelte:head>

<header>
<div class="brand"><div class="logo"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6"><rect x="1.5" y="1.5" width="13" height="13" rx="2.5"/><path d="M1.5 10.5 6 7l3 2.5 5.5-4"/></svg></div>Kartenstudio<small>Prototyp</small></div>
<div class="hsp"></div>
<span id="hdrEdit" class="hidden" style="display:flex;align-items:center;gap:4px">
<button class="ibtn" id="undo" title="Rückgängig (Strg+Z)">↶</button><button class="ibtn" id="redo" title="Wiederholen (Strg+Y)">↷</button>
<span style="width:8px"></span>
<button class="btn primary" id="dlBtn">Herunterladen <span style="opacity:.7">▾</span></button>
</span>
<div class="pop hidden" id="dlPop">
<h4>Design herunterladen</h4>
<div class="lab" style="margin-top:0">Format</div>
<div class="seg" id="dlFmt"><button data-f="png" class="on">PNG</button><button data-f="svg">SVG</button><button data-f="pdf">PDF Druck</button></div>
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
<nav class="wz-steps" id="wzSteps" aria-label="Schritte">
<button data-step="ort"><i>1</i><span>Ort</span></button>
<button data-step="ausschnitt"><i>2</i><span>Ausschnitt</span></button>
<button data-step="stil"><i>3</i><span>Stil</span></button>
<button data-step="design"><i>4</i><span>Design</span></button>
<button data-step="text"><i>5</i><span>Text</span></button>
<button data-step="produkt"><i>6</i><span>Produkt</span></button>
<button data-step="fertig"><i>7</i><span>Fertig</span></button>
</nav>
<div class="wz-panes">
<section class="wz-pane" data-step="ort">
<h3>Welcher Ort?</h3>
<div class="wz-place"><div class="pin">⌖</div><div><b id="wzPlace">–</b><span id="wzPlaceInfo"></span></div></div>
<p class="wz-hint">Du kannst jederzeit einen anderen Ort suchen.</p>
<div class="search wz-search"><input id="wq" type="search" placeholder="Dorf, Stadt oder Adresse" autocomplete="off" enterkeyhint="search"><button class="btn primary" id="wgo">Suchen</button><div class="results hidden" id="wresults"></div></div>
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
<label class="tog wz-tog"><input type="checkbox" id="multiOn"><span>Bis zu 3 Orte auf einem Poster</span></label>
<div class="mo hidden" id="multiBox">
<div id="multiList"></div>
<div class="search wz-search" id="multiAdd"><input id="mq" type="search" placeholder="Weiteren Ort hinzufügen" autocomplete="off" enterkeyhint="search"><button class="btn primary" id="mgo">Suchen</button><div class="results hidden" id="mresults"></div></div>
</div>
</section>
<section class="wz-pane" data-step="ausschnitt">
<h3>Ausschnitt</h3>
<p class="wz-hint"><b>Karte im Poster ziehen</b>, um sie zu verschieben. Zoomen mit <b>zwei Fingern</b>, <b>+ / −</b> oder am PC mit dem Mausrad.</p>
<div class="lab">Druckgröße</div>
<div class="wz-chips wz-sizes" data-sizes></div>
<label class="tog wz-tog wz-quer"><input type="checkbox" data-quer><span>Querformat</span></label>
<div class="wz-free" id="wzFree"><div class="lab">Seitenverhältnis der Karte</div>
<div class="wz-chips" id="wzFmt"><button data-a="0.8805">8 : 7</button><button data-a="1">1 : 1</button><button data-a="1.25">4 : 5</button><button data-a="1.3333">3 : 4</button><button data-a="0.6667">3 : 2</button></div></div>
<div class="lab">Zoom</div>
<div class="wz-zoom"><button class="btn" id="wzZOut" aria-label="Herauszoomen">−</button><button class="btn" id="wzZIn" aria-label="Hineinzoomen">+</button><button class="btn ghost" id="wzReset">Zurücksetzen</button></div>
<button type="button" class="wz-link" id="wzPick">Ausschnitt auf der Landkarte neu wählen ›</button>
</section>
<section class="wz-pane" data-step="stil">
<div class="wz-head"><h3>Stil</h3><button type="button" class="wz-dice" data-dice><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>Überrasch mich</button></div>
<div class="tabs2 wz-mode wz-mode3" id="wzMode"><button data-m="art">Gezeichnet</button><button data-m="std">Landkarte</button><button data-m="sterne">Sternenhimmel</button></div>
<div class="wz-cards" id="wzStyles"></div>
<div class="wz-hoehe" id="wzHoehe"><label class="tog wz-tog"><input type="checkbox" id="hoehenOn"><span>Höhenlinien (Berge &amp; Täler)</span></label><p class="wz-hint" id="hoehenInfo"></p></div>
<div class="wz-cards wz-bases hidden" id="wzBases"></div>
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
<div class="wz-head"><h3>Design</h3><button type="button" class="wz-dice" data-dice><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>Überrasch mich</button></div>
<p class="wz-hint">Wie Rahmen, Karte und Text angeordnet sind. Die Farben kommen vom Stil.</p>
<div class="wz-cards wz-designs" id="wzDesigns"></div>
<div class="lab">Effekte</div>
<label class="tog wz-tog"><input type="checkbox" id="fxPaper"><span>Papier-Struktur</span></label>
<label class="tog wz-tog"><input type="checkbox" id="fxVig"><span>Vignette (Rand abdunkeln)</span></label>
</section>
<section class="wz-pane" data-step="text">
<h3>Text</h3>
<label class="wz-field"><span>Titel</span><input id="wzTitle" class="inp" type="text" autocomplete="off"></label>
<label class="wz-field"><span>Untertitel</span><input id="wzSub" class="inp" type="text" autocomplete="off"></label>
<label class="wz-field"><span>Datum oder Widmung <i>optional</i></span><input id="wzNote" class="inp" type="text" autocomplete="off" placeholder="z. B. 12.06.2021 · Hier hat alles begonnen"></label>
<label class="tog wz-tog"><input type="checkbox" id="wzCoords"><span>Koordinaten anzeigen</span></label>
<div class="lab">Orte markieren</div>
<div class="wz-pinadd" id="wzPinAdd"></div>
<div class="wz-pins" id="wzPins"></div>
<div class="mk-sw wz-pincol" id="wzPinCol"></div>
</section>
<section class="wz-pane" data-step="produkt">
<h3>Produkt &amp; Vorschau</h3>
<p class="wz-hint">So sieht dein Motiv als fertiges Produkt aus.</p>
<div class="wz-prod" id="wzProd"></div>
<div class="mk-opt" data-for="poster gerahmt leinwand"><div class="lab">Größe</div><div class="wz-chips wz-sizes" data-sizes></div>
<label class="tog wz-tog wz-quer"><input type="checkbox" data-quer><span>Querformat</span></label></div>
<div class="mk-opt" data-for="poster gerahmt leinwand"><div class="lab">Raum</div><div class="mk-sw mk-rooms" id="mkRoomSw"></div></div>
<div class="mk-opt" data-for="gerahmt"><div class="lab">Rahmen</div><div class="mk-sw" id="mkFrameSw"></div>
<label class="tog wz-tog"><input type="checkbox" id="mkMat"><span>Passepartout (heller Rand)</span></label></div>
<div class="mk-opt" data-for="shirt"><div class="lab">Shirtfarbe</div><div class="mk-sw" id="mkShirtSw"></div>
<label class="tog wz-tog"><input type="checkbox" id="mkModel"><span>Am Model zeigen</span></label></div>
<div class="mk-opt" data-for="poster gerahmt leinwand"><div class="lab">Wandfarbe</div><div class="mk-sw" id="mkWallSw"></div></div>
<p class="wz-hint mk-note">Bestellen kommt in einem der nächsten Schritte. Die Druckdatei kannst du im nächsten Schritt schon herunterladen.</p>
</section>
<section class="wz-pane" data-step="fertig">
<h3>Fertig – herunterladen</h3>
<div class="qa" id="wzQa"></div>
<label class="tog wz-tog wz-proof"><input type="checkbox" id="softproof"><span>Druckfarben simulieren</span></label>
<div class="wz-dl">
<button data-f="pdf"><b>PDF für die Druckerei</b><span id="wzPdfInfo">Endformat + 3 mm Beschnitt</span></button>
<button data-f="png" data-w="3600"><b>PNG für den Druck</b><span>3600 px · ca. 30 cm bei 300 dpi</span></button>
<button data-f="png" data-w="4800"><b>PNG groß</b><span>4800 px · ca. 40 cm bei 300 dpi</span></button>
<button data-f="svg"><b>SVG (Vektor)</b><span>beliebig skalierbar · für Druckereien</span></button>
</div>
<p class="wz-hint">PNG und SVG haben einen transparenten Hintergrund – ideal für T-Shirts.</p>
<div class="lab">Teilen</div>
<button type="button" class="btn wz-share" id="wzShare"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>Link zum Entwurf kopieren</button>
<p class="wz-hint">Dein Entwurf wird automatisch in diesem Browser gemerkt. Mit dem Link kannst du ihn auf einem anderen Gerät öffnen oder jemandem zeigen.</p>
</section>
</div>
<div class="wz-foot">
<button class="wz-back" id="wzBack" aria-label="Zurück"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
<button class="wz-advbtn" id="wzAdv" title="Alle Detailregler: Linien, einzelne Häuser, Farben tauschen …"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg><span>Erweitert</span></button>
<button class="wz-next" id="wzNext"><span class="nx"><small>Weiter</small><b id="wzNextLabel">Stil</b></span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>
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
<div class="hint" style="margin:8px 0 10px">Fertig gezeichnete Straßenkarte oder Satellitenbild – wie bei Online-Karten.</div>
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
<div class="row"><span class="k">Schrift</span><select class="inp" id="tFont"><option value="SgXB">Inter Extra Bold</option><option value="SgMD">Inter Medium</option><option value="SgFR">Fraktur</option></select></div>
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
<div class="canvas checker" id="canvas"><svg id="poster" xmlns="http://www.w3.org/2000/svg"></svg></div>
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

<div class="landing" id="landing">
<div class="hero">
<span class="eyebrow">Karten als Poster- & Shirt-Motiv</span>
<h2>Welchen Ort willst du verewigen?</h2>
<p>Ort eintippen – dein Poster steht sofort. Dann nach Lust gestalten und herunterladen.</p>
<div class="occ occ-landing" data-occ aria-label="Anlass (optional)"></div>
<div class="search"><input id="lq" placeholder="Dorf, Stadt oder Adresse, z. B. Siegritz" autocomplete="off"><button class="btn primary" id="lgo">Suchen</button><div class="results hidden" id="lresults"></div></div>
<button class="demo resume hidden" id="resumeBtn"><span class="dpin">↺</span><span><b>Weiter mit deinem Entwurf</b><small></small></span></button>
<button class="demo" id="demoBtn"><span class="dpin">▶</span><span><b>Beispiel öffnen: Siegritz</b><small>Sofort ausprobieren – funktioniert auch ohne Internet</small></span></button>
<div class="orsep">oder Beispiel-Ort suchen</div>
<div class="examples" style="margin-top:8px"><button class="chip" data-q="Siegritz Heiligenstadt">Siegritz</button><button class="chip" data-q="Bamberg">Bamberg</button><button class="chip" data-q="Rothenburg ob der Tauber">Rothenburg</button><button class="chip" data-q="Nördlingen">Nördlingen</button></div>
<div class="steps"><span><b>1</b> Ort suchen</span><span><b>2</b> Gestalten</span><span><b>3</b> Vorschau</span><span><b>4</b> Herunterladen</span></div>
</div>
</div>
</section>
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
