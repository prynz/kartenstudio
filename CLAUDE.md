# Kartenstudio – Projektübergabe

> Diese Datei ist die Übergabe aus einem früheren Claude-Chat. Sie beschreibt Ziel, Stand, Technik und nächste Schritte.
> **Sprache:** Antworte immer auf Deutsch. Der Projektinhaber ist kein Entwickler: Erkläre Entscheidungen verständlich und logisch („warum“ statt nur „was“), ohne Fachjargon-Wände.

## 1. Ziel

Eine Website/Web-App, auf der Nutzer **einen beliebigen Ort suchen, einen Kartenausschnitt wählen, ihn als Poster- oder T-Shirt-Motiv frei gestalten und als Druck bestellen** (später) bzw. als Druckdatei herunterladen.

- Vorbild: **mapposter.xyz** – aber benutzerfreundlicher, übersichtlicher, kompakter, moderner.
- Ursprung: ein T-Shirt-Design für das Dorf **Siegritz (Fränkische Schweiz, Landkreis Bamberg)** – Kartenlinien, Rahmen, Navy-Balken mit „SIEGRITZ“ und Fraktur-Untertitel „Fränkische Schweiz“, gedruckt über Shirtinator.
- Wunsch des Inhabers: **möglichst selbst betrieben, ohne Abhängigkeit von Drittanbieter-Diensten** im Livebetrieb.

## 2. Was es schon gibt

### `prototyp/Kartenstudio_Prototyp.html` – lauffähiger Prototyp (eine Datei, ohne Build)
Im Browser öffnen (Chrome/Safari/Edge). Braucht Internet für Suche und Karten; der Button **„Beispiel öffnen: Siegritz“** funktioniert offline.

Funktionen:
- **Startseite** mit Suche (Photon-Geocoder), Beispiel-Chips und Offline-Beispiel.
- **Ortswahl** als Vollbild-Fenster: MapLibre-Karte, Rahmen in Formatgröße (8:7, 1:1, 4:5, 3:4, 3:2), „✓ Ausschnitt übernehmen“.
- **Daten laden:** zuerst **Vektorkacheln von OpenFreeMap** (eigener MVT/Protobuf-Decoder, z14, Schema OpenMapTiles), Rückfall auf **Overpass** (3 Server, gestaffelte Anfragen, Timeouts). Es wird ein größerer Bereich geladen, damit man im Editor nachjustieren kann.
- **Editor:** Seitenleiste mit nummerierten Schritten (Akkordeon):
  01 Ausschnitt (Format, Zoom, Verschieben im Poster) · 02 Stil · 03 Kartenelemente · 04 Rahmen & Fläche · 05 Text · 06 Farben tauschen.
- **Stil „Künstlerisch“:** Karte wird als **SVG gezeichnet**; 13 Farbthemen mit Live-Vorschaubild (Umriss/Siegritz, Nachtblau, Minimal, Nur Straßen, Cyber Noir, Mittelmeer-Sonne, Solar Flare, Vulkanglas, Blaupause, Vintage-Papier, Waldgrün, Tusche & Rot, Pastell) + „Eigene Farben“.
- **Stil „Standard“:** fertige Kartenstile von OpenFreeMap (Klassisch/Liberty, Hell/Positron, Bunt/Bright, Dunkel, Fjord) und **Satellit (Esri – nur Test, nicht lizenziert für Verkauf!)**, Beschriftungen an/aus. Wird über eine versteckte MapLibre-Karte als hochaufgelöstes Bild gerendert und ins Poster gesetzt.
- **Einzelbearbeitung:** Häuser/Straßen anklicken oder per Rahmen markieren, Farbe/Füllung/Stärke ändern, ausblenden. Gruppen (Häuser, Haupt-, Nebenstraßen, Wege, Wasser, Bahn, Grünflächen) gesammelt ändern.
- Rahmen (Farbe, Stärke, runde Ecken, Innenabstand), Textbalken (auto-Höhe), Titel/Untertitel (Schrift, Größe, Laufweite, Farbe, Koordinaten einsetzen), **Pflicht-Quellenangabe** „© OpenStreetMap-Mitwirkende“.
- Werkzeuge: Auswählen (V) / Verschieben (H), Mausrad-Zoom, Undo/Redo (Strg+Z/Y), Vorschau-Hintergründe.
- **Export:** SVG (Vektor, Schriften eingebettet) und PNG transparent (2400/3600/4800 px).
- Mobile-Ansicht funktioniert grundsätzlich.

### `prototyp/src/` – Quellen des Prototyps
- `shell.html` – HTML/CSS-Gerüst mit Platzhalter `__SCRIPT__`
- `script.js` – gesamte Logik (in `<script>`-Tags), Platzhalter `__XB__ __MD__ __FR__` für Schriften
- `build.py` – baut daraus die fertige Einzeldatei (bettet Schriften als base64 ein)

Wichtige Funktionen in `script.js`: `PRESETS`/`TH()` (Themen), `BASES` (Standard-Stile), `newState`, `defView/clampView/vT` (Ansicht), `fetchTiles/decodeTile/classifyTile/buildDataTiles` (Kacheln), `fetchOSM/classify/buildData` (Overpass), `generate/loadData`, `buildSVG/render`, `ensureRaster` (Standard-Stile), Zeigerbedienung auf `#canvas`, `panel()` (Seitenleiste füllen), `renderPNG/download`, `loadDemo`.

Datenmodell: `DATA = {feats:[{id, fid, k (Klasse), a (Fläche?), d (SVG-Pfad), pts, bx (Bounding Box), t (Kachel-Index)}], tiles, MH0, ext, proj:{x0,y0,sc}, place, region}`; Poster-Kartenbreite `MW = 1004`. Zustand `S` (Klassen-Stile `S.cls`, Einzel-Overrides `S.ov`, frame, bar, title, sub, view, mode, base …) – Undo per JSON-Snapshot.

### `prototyp/test/` – Testhilfen
- `fixture.json` – Siegritz-Testdaten (Overpass-JSON + Ausschnitt)
- `mkmvt.py` – erzeugt daraus Fake-Vektorkacheln zum Offline-Testen
- `t13.py` – Playwright-Beispieltest (MapLibre gestubbt, Netz gemockt)

### `design/` – Fonts & Referenzdesign
- `inter-xb.woff`, `inter-md.woff` (Inter Extra Bold / Medium), `frak.woff` (KaTeX Fraktur Bold, ergänzt um ä ö ü Ä Ö Ü)
- `Siegritz_Shirt_Design_v8_navy_rund.svg/png` – das finale Ursprungsdesign (Navy `#262c3a`, abgerundeter Rahmen)

## 2a. Web-App (seit Schritt 1)

Die echte App liegt im Repo-Wurzelverzeichnis: **SvelteKit 3 + Svelte 5 + Vite, TypeScript**, gebaut als **statische Seite** (`@sveltejs/adapter-static`, `ssr = false`). Damit läuft sie auf jedem Webspace/eigenen Server.

- **Live-Vorschau:** https://prynz.github.io/kartenstudio/ – GitHub Action `.github/workflows/pages.yml` baut bei jedem Push auf `main` (Basis-Pfad über `BASE_PATH`).
- **Lokal:** `npm install`, `npm run dev` (öffnet auf Port 5173, auch im WLAN erreichbar) · `npm run build` · `npm run check` (Typprüfung).
- **Rauchtest:** `npm run build && npm run preview`, dann `npm run test:smoke -- http://localhost:4173/` (Playwright; prüft Beispiel, Stile, Undo, Text, SVG/PNG-Export, iPhone-Ansicht, echte Suche + Vektorkacheln + Standard-Stil). `OFFLINE=1` überspringt die Online-Prüfungen.
- **Konfiguration:** in SvelteKit 3 steht sie in `vite.config.ts` (nicht mehr `svelte.config.js`); Alias für `src/lib` ist `#lib`.

Aufbau (`src/lib`), aus `prototyp/src/script.js` maschinell (Babel) zerlegt – Logik unverändert:
- `editor/app.js` – **gemeinsamer Zustand** `app` (früher globale Variablen: `app.DATA`, `app.S`, `app.sel`, `app.map` …)
- `editor/` – `basis` (Konstanten, `$`, Schriften), `zustand` (newState, Ansicht, Undo), `laden` (generate/loadData), `zeichnen` (geo/buildSVG/render/drawSel), `bedienung` (Zeiger/Zoom), `seitenleiste` (panel, Schritte 01–06), `farben`, `ansicht` (Undo-Knöpfe, Tasten, Meldungen), `beispiel` (+ `beispiel-siegritz.json`), `animation` (neu: Akkordeon, Übergang Start → Editor), `sheet` (neu: Handy-Bottom-Sheet – Poster bleibt oben fest, Einstellungen scrollen separat, Griff mit 3 Rastpunkten; `revealSection` holt geöffnete Schritte in Sicht), `start.js` (verbindet alle Bausteine mit der Seite, `init…`-Funktionen in Prototyp-Reihenfolge), `editor.css`
- `editor/assistent.js` – **geführter Ablauf** (Handy + PC): Schritte Ort → Ausschnitt → Stil → Design → Text → Produkt → Fertig, immer ein Schritt sichtbar, „Weiter/Zurück“, Fortschrittspunkte. Im Assistenten ist das Werkzeug „Verschieben“ aktiv (Karte direkt im Poster ziehen, Dock ausgeblendet, `body.wiz-on`). „Erweiterte Einstellungen“ zeigt das alte Akkordeon (`#adv`) mit allen Detailreglern; Klicks im Poster, die einen Abschnitt öffnen wollen, laufen über `wizardOpenSec`. Fußleiste: Zurück-Pfeil · „Erweitert“ (blau, immer sichtbar) · „Weiter: <nächster Schritt>“. Vorschau-Hintergrund (Karomuster = transparent) wird in `render()` als `#vorschau`-Rechteck in der Umrissform des Posters (`clip-path: cOut`) gezeichnet, nicht als CSS-Hintergrund – sonst sieht man ihn hinter abgerundeten Ecken. Design-Vorschaubilder = `buildSVG(true)` mit temporärem Zustand als `<img>` (Blob-URL, damit SVG-IDs nicht kollidieren).
- `themen/designs.js` – **22 Poster-Designs** (Aufbau, unabhängig vom Farbthema): Siegritz, Klassisch, Balken oben, Mit Koordinaten, Galerie, Minimal, Elegant (Zierlinie), Passepartout, Doppelrahmen, Breiter Rahmen, Polaroid, Abgerundet, Randlos, Text oben, Kreis, Bogenfenster, Sechseck, Herz, Runder Rahmen, Galerie + Koordinaten, Kreis + Koordinaten, Bogen elegant. Formen (`shape`: circle/heart/hex/arch/rounded) in `mapShape()`; Formen mit festem Seitenverhältnis (`aspect`) merken sich das vorige in `S.aPrev`. Ein Design setzt `S.design`, `S.lay` (`kind` bar/bartop/below/top/over, `rule` Zierlinie, `textPad`, `inner`/`innerGap` Innenlinie, `shape` rect/circle, `coords`, `fade`), Rahmenmaße und Schriftgrößen. `geo()` in `zeichnen.js` rechnet alle Varianten; Schriftfarbe außerhalb des Balkens per `inkColor()` aus dem Thema. Beim Wechsel des Farbthemas bleibt das Design erhalten (`newState` → `applyDesign`).
- `editor/mockup.js` – **Produkt-Mockups** (Schritt „Produkt“ im Assistenten, `body.mk-on` blendet `#mockup` über die Vorschau): Poster, gerahmt (7 Rahmen inkl. Holz/Gold/Alu, Passepartout), Leinwand, T-Shirt (7 Farben), Tasse; Wandfarben. Szenen selbst gezeichnet (HTML/CSS mit Container-Query-Einheiten `cqw/cqh`, Shirt/Tasse als SVG), Motiv = `buildSVG(true)` als Blob-URL. Auswahl in `S.product` (`product()` liefert Standardwerte).
- `themen/pop.js` – **Pop-Art** (Themen `popart`, `konfetti` in `vorlagen.js`, nach dem Vorbild illustrierter Wimmelbild-Stadtpläne): Symbole stehen in Reihen ENTLANG der Straßen (in Straßenrichtung gedreht), Straßen/Gewässer bleiben als saubere Kanäle frei, gefüllt wird nur der bebaute Ort (Nähe zu Gebäuden → Ortsform sichtbar), Lücken per versetztem Raster. Häuser/Fußwege nicht als Grundriss. `popK()` skaliert Symbole/Straßen mit dem Maßstab (Städte → kleiner, Untergrenze 0,5 für Tempo). Symbole sind Vielecke und werden **je Farbe zu einem einzigen `<path>`** zusammengefasst – tausende Einzelelemente machten das Handy zäh. Zustand `S.pop`.
- **Tempo (wichtig!):** `render()` baut die Karte nur neu, wenn sich Kartenrelevantes ändert (`mapKey()`, Zwischenspeicher `MC`, Zeichenbereich mit 60 % Rand `cullRect()`); sonst bleibt der Kartenknoten im DOM und nur Rahmen/Text werden ersetzt (Knoten nie aus- und wieder einhängen – das erzwingt teures Neu-Layout). Beim Ziehen/Mausrad nur `renderView()` (Transform ändern), volles Neuzeichnen 140 ms nach der letzten Bewegung. Poster-Schatten per `box-shadow` (+ `border-radius` in `zoom()`), nicht `filter: drop-shadow`. Messen mit Longtask-Observer (siehe Verlauf), Handy mit 4× CPU-Drosselung.
- **Optimierungsrunde (Bedienung, Druck, PWA):**
  - **Suche → fertiges Poster direkt:** `pickPlace` (`karte/ortswahl-start.js`) berechnet mit `placeBounds()` einen Ausschnitt um den Ortskern (Dorf ≈ 1,1 km, Stadt nach Ausdehnung, max. 2 km) und ruft `loadBounds(b)` (`editor/laden.js`) auf – ohne Kartenfenster. Das Kartenfenster (Feinwahl) gibt es weiter über „Ausschnitt auf der Landkarte neu wählen“ (`#wzPick`). Untertitel-Vorschlag `regionOf()` (Landkreis ohne „Landkreis“). Ladeanzeige wird dorthin verschoben, wo man gerade ist.
  - **MapLibre lädt erst bei Bedarf** (`loadMaplibre()` in `ortswahl.js`, auch für `raster.js`), Beispiel-JSON ebenfalls dynamisch → schlanker Start.
  - **Zwei-Finger-Zoom** in `bedienung.js` (Zeiger-Map `PTS`, Kartenpunkt unter der Fingermitte bleibt stehen, `renderView()` während der Geste).
  - **Entwurf merken & teilen** (`editor/entwurf.js`, `editor/wiederherstellen.js`): localStorage-Schlüssel `kartenstudio.entwurf.v1` (Ausschnitt `lastB`, Ort, Demo-Flag, Schritt, `S`), gespeichert 0,7 s nach jeder Änderung (`updUndo` → `saveDraftSoon`). Startseite zeigt „Weiter mit …“ (`#resumeBtn`). Link `#e=z…` = JSON, deflate-raw, base64url. **Sicherheitsprüfung `validDraft()`**: fremde Links dürfen nur harmlose Zeichen in Farben/Schlüsseln haben (Werte landen ungefiltert im SVG); freie Texte werden mit `esc()` gezeichnet.
  - **Überrasch mich** (`surprise()` in `assistent.js`), Stil-/Design-/Größenwechsel mit weicher Überblendung `smooth()` (View Transitions, `#poster{view-transition-name:poster}`, im Mockup ausgeschaltet).
  - **Pins & Widmung:** `S.pins` [{i: herz|pin|stern|punkt, x, y in Kartenkoordinaten}], `S.pinColor`, eigene Ebene `#pins/#pinsAnsicht` (Größe zoomunabhängig, in `renderView` mitverschoben), im Poster ziehbar (`data-pin`). `S.note.text` = zusätzliche Zeile `#widmung` (in `geo()` als `yN`).
  - **Druck** (`editor/druck.js`): `SIZES` (A4 … 70×100, Quadrate), `S.print = {k, q}` (q = quer) oder `null` (frei). `fitPrint()` setzt das Kartenverhältnis so, dass das **ganze Poster** exakt aufs Papier passt (läuft in `render()`); Formen mit festem Verhältnis (Kreis …) bekommen im PDF Rand. **PDF mit 3 mm Beschnitt** komplett im Browser (eigener kleiner PDF-Schreiber, JPEG, TrimBox/BleedBox, bis 300 dpi; Handy max. 16 MP). **Qualitäts-Ampel** `quality()`: dünnste Linie in mm, Bild-dpi bei Standard-Stilen, Export-dpi.
  - **Standard-Stile scharf beim Zoomen:** `raster.js` zeichnet 450 ms nach dem Zoomen ein Detailbild nur für den sichtbaren Bereich (`DETAIL`, `detailRaster()`), das über das Grundbild gelegt wird.
  - **Mockups maßstäblich:** `ROOMS` (Sideboard, Sofa, Flur, Büro) in echten cm; CSS-Einheit `--u` (cm → Bildschirm), kleine Poster werden „näher fotografiert“ (Möbel ragen unten heraus), Größenetikett `.mk-size`. Shirt optional am Model (`product.model`).
  - **PWA:** `static/manifest.webmanifest`, Icons, `src/service-worker.js` (SvelteKit 3: `$app/manifest` + `$app/env`, nicht mehr `$service-worker`). App-Dateien aus dem Speicher (`ignoreVary`!), Seitenaufruf Netz zuerst, Vektorkacheln werden gemerkt (max. 600). App startet offline, Beispiel funktioniert offline.
- **Ideen-Runde (nach Cartida-Vergleich):**
  - `themen/anlaesse.js` – Anlass-Vorlagen (Hochzeit, Geburt, Zuhause, Heimat, Urlaub, Verein); vor der Suche gewählt → `app.occasionPending`, nach dem Laden angewendet (`applyOccasion`). Effekte `S.fx` (Papier-Struktur nur auf farbigem Grund, Vignette). „Druckfarben simulieren“ + Neon-Farbhinweis (`neonColors` in `druck.js`).
  - `themen/himmel.js` + `himmel-daten.js` (d3-celestial, BSD-3, lazy) – **Sternenhimmel** `S.motif='sterne'`, `S.sky` (date, min = Minuten, theme, lines/names/mw/grid/real, lat/lon). Stereografisch, Zenit Mitte, Norden oben, Osten links; Zeitzone Europe/Berlin per Intl. Ziehen/Zoomen/Pins im Himmel aus.
  - `editor/mehrere.js` – **bis 3 Orte** (`S.multi`), Zusatzorte über `tileData()` im Hintergrund; Zeichnen durch Tausch von `app.DATA`/`S.view` und eigene Kachel-Clip-IDs (`TCP.p`).
  - `editor/route.js` – **GPX/GeoJSON-Route** (`S.route`, Douglas-Peucker ≤ 1200 Punkte), `loadBounds(b,{maxW:40000})`; `fetchTiles` wählt bei großen Gebieten eine gröbere Zoomstufe (≤ 100 Kacheln).
  - `karte/hoehen.js` – **Höhenlinien** aus Terrarium-Kacheln (Marching Squares, Hauptlinie jede 5.), `S.hoehen`, Ergebnis an `DATA._contours`.
  - Designs **Typografie** (`lay.kind='typo'`, `typoLines`) und **Haus** (`shape:'house'`); Schrift **Great Vibes** `SgSC` (OFL), Schrift-Paare im Text-Schritt.
  - Luftbild **Bayern** (DOP 40, CC BY 4.0) statt Esri; `inBayern()` sperrt den Knopf außerhalb.
  - `shop/preise.js` (Beispielpreise, hier anpassen), `shop/geschenk.js` (Geschenk-Link mit `gift` im Teilen-Link + Geschenkkarte-PNG), Rechtsseiten `/impressum`, `/datenschutz`, `/agb` (Vorlagen, `ssr=true`).
  - **Vektor-PDF** `buildVectorPDF()` (jsPDF 4 + svg2pdf, lazy): Inter als TrueType-Fassung `inter-*-tt.ttf` (CFF kann jsPDF nicht), Laufweite → Einzelbuchstaben-tspans, TrimBox/BleedBox.
  - MapLibre **6** (Worker-URL per `setWorkerUrl`, `canvasContextAttributes`). `src/lib/konfig.js` = alle Dienst-Adressen (per `VITE_*` überschreibbar). GitHub Action testet vor dem Veröffentlichen (`OFFLINE=1`).
  - **Hilfe-Chat** `hilfe/chat.js` + Wissen `hilfe/wissen.js` (Stichwort-Bot, Knöpfe springen zu Schritten); optional KI über `server/chat-worker` (Cloudflare Worker, Claude Opus 5.5, effort low, `fallbacks:"default"`, CORS + Rate-Limit), aktiv wenn `VITE_CHAT_API` gesetzt. Doku `docs/chatbot.md`.
  - Docs: `docs/shop-plan.md`, `docs/eigene-infrastruktur.md`, `docs/LIZENZEN.md`. Marktcheck/Recht/Kosten-Übersicht als Artifact: https://claude.ai/artifact/BJoqb3u3av2Vy4KB2Zjfva
  - **Wichtig rechtlich:** GitHub Pages erlaubt keinen Shop → vor dem Verkauf umziehen; Photon/Overpass nur zum Testen.
- `docs/vergleich-cartida.md` – Wettbewerbsvergleich und Ideenliste (Pins, Datum, Sternenhimmel, Raumszenen, Shop).
- `karte/` – `ortswahl`, `ortswahl-start`, `suche` (Photon), `kacheln` (MVT-Decoder), `overpass`, `daten` (buildData/buildDataTiles), `raster` (Standard-Stile via MapLibre)
- `themen/` – `vorlagen` (PRESETS), `standard` (BASES)
- `export/` – SVG/PNG
- `src/routes/+page.svelte` – HTML-Gerüst aus `shell.html`; startet den Editor in `onMount`.

Die übernommenen Module tragen `// @ts-nocheck` – beim Überarbeiten jeweils typisieren und in Svelte-Komponenten überführen. MapLibre (4.7.1) ist als npm-Paket eingebunden, Schriften liegen in `src/lib/assets/fonts` (für den Export per `?inline` als base64).

**Gestaltungsziel des Inhabers:** smoothe, klare Animationen und ein hochwertiges Look & Feel. Animationen kurz (≈0,2–0,3 s), Kurve `cubic-bezier(.2,.8,.2,1)`, `prefers-reduced-motion` respektieren.

## 3. Gelernte Lektionen

- **Öffentliche Overpass-Server sind unzuverlässig** (Timeouts, Überlast) → Vektorkacheln sind schneller (≈0,2 s statt Minuten) und zuverlässiger.
- mapposter.xyz ist schnell, weil es **vorbereitete Vektorkacheln** nutzt, nicht Live-Abfragen.
- Kachelnähte: pro Kachel ein SVG-`clipPath`, Gebäude-Fragmente über Feature-ID gruppieren.
- Artefakt-/App-Vorschauen blockieren Netzwerkzugriffe → Offline-Beispiel nötig.
- Beim Zoomen im Editor werden Standard-Stile (Rasterbild) unscharf → in der Web-App neu rendern.

## 4. Technische Empfehlung für die echte Web-App

- **Frontend:** SvelteKit oder Next.js (TypeScript), MapLibre GL, Editor-Logik aus dem Prototyp in Module zerlegen (karte/, editor/, export/, themen/).
- **Karten selbst hosten:** Protomaps/**PMTiles** (OSM-Extrakt Deutschland/Europa, wöchentlich neu gebaut) auf Cloudflare R2 oder eigenem Server + CDN. Stile selbst hosten. Geocoder: eigener Photon- oder Nominatim-Server (oder vorerst öffentlich mit Fallback).
- **Hosting/Vorschau:** Vercel, Netlify oder Cloudflare Pages; Code auf **GitHub**.
- **Druck & Bestellung (später):** Print-on-Demand-Anbieter mit API (z. B. Gelato, Printful, Prodigi; für Shirts evtl. Shirtinator/Spreadshirt prüfen), Bezahlung über Stripe.
- **Lizenzen:** OSM-Daten ODbL → Quellenangabe auf jedem Druck. Satellitenbilder: Esri NICHT für Verkauf; Alternative z. B. amtliche Luftbilder Bayern (DOP, CC BY 4.0) für Bayern.

## 5. Geplante Schritte (Roadmap)

1. ✅ **Grundgerüst** (erledigt): Repo anlegen, Framework aufsetzen, Prototyp-Editor übernehmen und modularisieren, Live-Vorschau per URL (Handy-tauglich).
2. **UX-Überarbeitung** (großteils erledigt: Suche direkt ins Poster, schlaue Startwerte, Touch-Zoom, Entwurf merken/teilen, scharfe Standard-Stile):
   - Ortswahl direkt im Poster-Rahmen (kein separates Fenster) – Suche → fertiges Poster in einem Schritt
   - Schlaue Vorschläge: Ausschnitt automatisch auf Ortskern, Titel/Untertitel aus Ortsdaten, Stilvorschläge
   - Mobile: Bottom-Sheet für Einstellungen, Touch-Gesten
   - Kartenformen (Kreis, Herz, Sechseck), Effekte (Vignette)
   - Standard-Stile beim Zoomen neu rendern
3. ✅ **Mockups live** (erste Version): Poster/Rahmen/Leinwand an der Wand, Shirt, Tasse. Ideen: mehr Raumszenen, Größe maßstäblich, Pins/Datum (siehe `docs/vergleich-cartida.md`).
4. ✅ **Speichern & Teilen** (im Browser + Link). Später: Konto/Server-Speicher.
5. **Shop:** Größe/Material/Preis, Bezahlung, automatische Übergabe an Druckdienst.
6. **Eigene Karteninfrastruktur** (PMTiles, Geocoder) statt öffentlicher Dienste.

## 6. Arbeitsweise mit dem Inhaber

- Arbeitet iterativ, oft mit Screenshots (auch vom iPhone) und kurzen Rückmeldungen.
- Möchte sichtbare Ergebnisse schnell testen können – idealerweise per Link am Handy.
- Vor größeren Umbauten kurz den Plan erklären; Backups/Versionen behalten (Git-Branches).
- Design-Geschmack: klar, modern, kompakt, viel Weißraum, Navy `#262c3a` als Akzent.
