# Eigene Karten- und Suchserver (Roadmap Schritt 6)

Die App ist vorbereitet: Alle Dienst-Adressen stehen in `src/lib/konfig.js` und lassen sich beim Bauen per Umgebungsvariable umstellen – **ohne Code-Änderung**.

| Dienst | heute | selbst betreiben mit | Variable |
|---|---|---|---|
| Kartenkacheln (OpenMapTiles-Schema) | OpenFreeMap | **Planetiler** baut aus dem OSM-Deutschland-Extrakt (Geofabrik) eine `.mbtiles`/`.pmtiles`-Datei; ausliefern mit **Martin** oder **tileserver-gl** (liefert TileJSON + Kacheln) | `VITE_TILEJSON` |
| Kartenstile | OpenFreeMap | Stil-JSONs (liberty, positron …) kopieren und auf eigene Kachel-Adresse zeigen lassen | `VITE_STYLES` |
| Ortssuche | Photon (komoot) | **Photon** selbst hosten (Deutschland-Index, ~10 GB, 2–4 GB RAM) | `VITE_GEOCODER` |
| Höhenmodell | AWS Terrain Tiles | gleiche PNG-Kacheln für den eigenen Bereich (z. B. nur DACH) auf eigenen Speicher kopieren | `VITE_TERRAIN` |
| Luftbild Bayern | geoservices.bayern.de | bleibt beim Amt (offizieller, kostenloser Dienst) | `VITE_LUFTBILD` |

## Empfohlener Aufbau
- **Ein kleiner Server** (z. B. Hetzner CX32/CAX21, ca. 7–15 €/Monat) mit Martin (Kacheln) + Photon (Suche), dazu ein CDN (Cloudflare, kostenlos) davor.
- Wöchentlich per Zeitplan: OSM-Extrakt laden → Planetiler (ca. 20–40 min für Deutschland) → Datei austauschen.
- Alternativ ohne Server: `.pmtiles` auf **Cloudflare R2** (sehr günstig, kein Ausgangs-Traffic-Preis) – dafür bräuchte die App noch einen kleinen PMTiles-Leser (Paket `pmtiles`, ca. 15 KB).

## Bauen mit eigenen Servern
```bash
VITE_TILEJSON=https://karten.example.de/planet VITE_GEOCODER=https://suche.example.de/api/ npm run build
```
In GitHub Actions: die Variablen in `.github/workflows/pages.yml` beim Schritt `npm run build` unter `env:` eintragen.
