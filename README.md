# Kartenstudio

Einen beliebigen Ort suchen, Kartenausschnitt wählen, als Poster- oder T-Shirt-Motiv gestalten und als Druckdatei (SVG/PNG) herunterladen.

**Live-Vorschau:** https://prynz.github.io/kartenstudio/

## Entwickeln

```bash
npm install
npm run dev        # Entwicklungsserver, auch im WLAN erreichbar (Adresse steht im Terminal)
npm run build      # statische Seite nach ./build
npm run check      # Typprüfung
```

Rauchtest im Browser (braucht Playwright mit Chromium):

```bash
npm run build && npm run preview
npm run test:smoke -- http://localhost:4173/
```

## Ordner

- `src/` – die Web-App (SvelteKit). Aufbau siehe `CLAUDE.md`.
- `prototyp/` – der ursprüngliche Einzeldatei-Prototyp mit Quellen und Testhilfen (Referenz).
- `design/` – Ursprungsdesign Siegritz-Shirt.

Kartendaten © OpenStreetMap-Mitwirkende (ODbL), Kacheln von OpenFreeMap.
