# Shop & Druckpartner – Fahrplan

Stand: November 2026. Die App kann schon alles, was ein Druckpartner braucht (druckfertiges PDF mit Beschnitt, feste Größen, Produktwahl, Preisanzeige). Es fehlen nur Konto, Bezahlung und die Übergabe.

## Was schon fertig ist
- **Druckdatei:** `editor/druck.js` → `buildPDF()` (Endformat + 3 mm Beschnitt, TrimBox/BleedBox, bis 300 dpi).
- **Produkte & Größen:** `editor/mockup.js` (`PRODUCTS`, `FRAMES`), `editor/druck.js` (`SIZES`).
- **Preise:** `shop/preise.js` – Beispielpreise, eine Stelle zum Anpassen.
- **Rechtstexte:** `/impressum`, `/datenschutz`, `/agb` als Vorlagen mit gelben Platzhaltern.

## Was der Inhaber entscheiden / anlegen muss
1. **Druckpartner wählen** und Konto anlegen. Kandidaten:
   - **Gelato** – Poster, Rahmen, Leinwand, Shirts, Tassen; druckt in DE; gute API; Preise pro Stück.
   - **Prodigi** – sehr gute Rahmen/Fine-Art, API, Druck u. a. in DE/UK.
   - **Printful** – stark bei Shirts/Tassen, Poster ok, Lager in Lettland/Spanien.
   - Für Shirts zusätzlich: Shirtinator/Spreadshirt (eher ohne offene API).
2. **Zahlungsanbieter:** Stripe (Karte, Apple/Google Pay, Klarna, PayPal über Stripe) – Konto anlegen.
3. **Rechtsform / Gewerbe, Impressum-Daten, Steuer** (Kleinunternehmer ja/nein).
4. **Eigene Domain** (z. B. kartenstudio.de) – siehe unten.

## Technischer Aufbau (Empfehlung)
API-Schlüssel dürfen **nie** im Browser liegen. Deshalb kommt ein kleiner Server-Baustein dazu – z. B. eine **Cloudflare Worker**-Funktion (kostenlos bis 100.000 Aufrufe/Tag) oder eine Funktion beim eigenen Hoster:

```
Browser (Kartenstudio)
  1. erzeugt Druck-PDF (wie heute)
  2. lädt PDF + Auftragsdaten hoch ───────▶  Worker /bestellung
                                              3. legt Stripe-Checkout an ──▶ Stripe
  4. Weiterleitung zur Bezahlung  ◀─────────  (Link)
                                              5. Stripe meldet „bezahlt“ (Webhook)
                                              6. Auftrag an Druckpartner-API (PDF-Link, Produkt, Adresse)
                                              7. Bestätigungs-E-Mail
```

Speicher für die PDFs: Cloudflare R2 (passt zur späteren eigenen Karten-Infrastruktur, siehe Roadmap 6).

## Auftragsdaten (pro Bestellung)
| Feld | Quelle in der App |
|---|---|
| Produkt (poster / gerahmt / leinwand / shirt / tasse) | `S.product.type` |
| Größe | `S.print.k`, `S.print.q` (quer) |
| Rahmenfarbe, Passepartout | `S.product.frame`, `S.product.mat` |
| Shirtfarbe | `S.product.shirt` |
| Druckdatei | `buildPDF()` (Poster) bzw. PNG transparent (Shirt/Tasse) |
| Preis (zur Kontrolle) | `shop/preise.js → preis()` |
| Entwurf zum Nachbearbeiten | `entwurf.js → draftPayload()` |

Die Zuordnung zu den Artikelnummern (SKUs) des Druckpartners kommt in `shop/preise.js` dazu, sobald der Partner feststeht.

## Eigene Domain
1. Domain bei einem Anbieter kaufen (z. B. INWX, Strato, Cloudflare).
2. In GitHub → Settings → Pages → „Custom domain“ eintragen, beim Domain-Anbieter einen CNAME auf `prynz.github.io` setzen.
3. In `.github/workflows/pages.yml` den `BASE_PATH` leer setzen (die Seite liegt dann im Wurzelverzeichnis).
