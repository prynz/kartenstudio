// Wissen für den Hilfe-Chat. Wird zweimal genutzt:
// 1. vom eingebauten Antwort-Bot (ohne KI, sofort, kostenlos) über die Stichwörter `k`
// 2. als Grundlage für den KI-Bot (server/chat-worker) – dort wird alles in den System-Prompt geschrieben.
// HIER ANPASSEN, wenn sich Preise, Versand oder Funktionen ändern.

/**
 * @typedef {{ id: string, q: string, k: string[], a: string, act?: {label: string, step?: string, do?: string} }} Faq
 */

/** @type {Faq[]} */
export const FAQ = [
	{
		id: 'start',
		q: 'Wie funktioniert Kartenstudio?',
		k: ['funktioniert', 'anfangen', 'erstellen', 'gestalten', 'poster machen', 'anleitung', 'bedienung'],
		a: 'Ort eintippen – das Poster steht sofort. Dann Schritt für Schritt: Ausschnitt, Stil, Design, Text, Produkt und zum Schluss herunterladen. Unter „Erweitert“ kannst du jedes Detail einzeln ändern.'
	},
	{
		id: 'preis',
		q: 'Was kostet ein Poster?',
		k: ['preis', 'kosten', 'kostet', 'teuer', 'euro', '€', 'günstig'],
		a: 'Beispielpreise: Poster A4 ab 19,90 €, 50 × 70 cm 39,90 €, gerahmt ab 44,90 €, Leinwand ab 34,90 €, T-Shirt 29,90 €, Tasse 19,90 €. Den genauen Preis siehst du im Bereich „Fertig“. Die Druckdatei zum Selbstdrucken kannst du schon jetzt kostenlos herunterladen.',
		act: { label: 'Zum Bereich Produkt', step: 'produkt' }
	},
	{
		id: 'bestellen',
		q: 'Kann ich direkt bestellen?',
		k: ['bestellen', 'bestellung', 'kaufen', 'warenkorb', 'liefern', 'lieferung', 'versand', 'lieferzeit', 'wann kommt'],
		a: 'Die Bestellung mit Druck und Versand kommt bald. Schon jetzt kannst du dein Motiv als druckfertiges PDF (mit 3 mm Beschnitt), PNG oder SVG herunterladen und z. B. in einer Druckerei oder bei einem Fotodienst drucken lassen.',
		act: { label: 'Zum Herunterladen', step: 'fertig' }
	},
	{
		id: 'groesse',
		q: 'Welche Größen gibt es?',
		k: ['größe', 'groesse', 'format', 'a4', 'a3', 'a2', '50x70', '70x100', 'quer', 'querformat', 'quadrat'],
		a: 'A4, A3, A2, 30 × 40, 50 × 70, 70 × 100 cm sowie quadratisch 30 × 30 und 50 × 50 cm – jeweils auch quer. Wähl die Größe im Bereich „Fertig“ unter „Größe“; das Poster passt sich dann genau an.',
		act: { label: 'Größe wählen', step: 'produkt' }
	},
	{
		id: 'qualitaet',
		q: 'Ist die Datei gut genug für den Druck?',
		k: ['qualität', 'qualitaet', 'dpi', 'auflösung', 'scharf', 'unscharf', 'druckerei', 'pdf', 'vektor', 'beschnitt'],
		a: 'Ja. Das „PDF für die Druckerei“ ist eine Vektordatei: gestochen scharf in jeder Größe, Schriften eingebettet, mit 3 mm Beschnitt. Im Bereich „Fertig“ zeigt dir eine Ampel, ob alles gut druckbar ist (z. B. keine zu feinen Linien).',
		act: { label: 'Zur Qualitäts-Ampel', step: 'fertig' }
	},
	{
		id: 'download',
		q: 'Welche Dateien kann ich herunterladen?',
		k: ['download', 'herunterladen', 'datei', 'png', 'svg', 'transparent', 'shirt drucken'],
		a: 'PDF (Vektor, für Druckereien), PDF als Bild, PNG in 3600 oder 4800 px mit transparentem Hintergrund (ideal für T-Shirts) und SVG zum Weiterbearbeiten.'
	},
	{
		id: 'ort',
		q: 'Mein Ort wird nicht gefunden.',
		k: ['nicht gefunden', 'finde', 'suche', 'ort', 'dorf', 'adresse', 'straße'],
		a: 'Versuch es mit Ort und Gemeinde, z. B. „Siegritz Heiligenstadt“, oder mit einer Straße und Hausnummer. Du kannst den Ausschnitt danach auch auf der Landkarte frei wählen („Ausschnitt auf der Landkarte neu wählen“).'
	},
	{
		id: 'ausschnitt',
		q: 'Wie verschiebe oder zoome ich die Karte?',
		k: ['verschieben', 'zoomen', 'zoom', 'ausschnitt', 'größer', 'kleiner', 'näher'],
		a: 'Zieh die Karte direkt im Poster. Zoomen geht mit zwei Fingern, mit + / − im Bereich „Ort“ oder am PC mit dem Mausrad.',
		act: { label: 'Zum Ausschnitt', step: 'ausschnitt' }
	},
	{
		id: 'sterne',
		q: 'Gibt es einen Sternenhimmel?',
		k: ['stern', 'sterne', 'sternenhimmel', 'himmel', 'sternbild', 'nacht', 'geburt datum'],
		a: 'Ja: Im Bereich „Stil“ auf „Sternenhimmel“ tippen, Datum und Uhrzeit eintragen – der Himmel wird aus echten Sterndaten für genau diesen Ort und Moment berechnet. Sternbilder, Namen, Milchstraße und Farben sind einstellbar.',
		act: { label: 'Sternenhimmel öffnen', do: 'sterne' }
	},
	{
		id: 'route',
		q: 'Kann ich eine Route einzeichnen?',
		k: ['route', 'gpx', 'strecke', 'lauf', 'marathon', 'wanderung', 'radtour', 'strava', 'komoot'],
		a: 'Ja. Im Bereich „Ort“ eine GPS-Datei (.gpx oder GeoJSON) aus deiner Sport-App laden. Die Karte richtet sich nach der Strecke, Name und Länge stehen automatisch auf dem Poster.',
		act: { label: 'Zum Bereich Ort', step: 'ort' }
	},
	{
		id: 'mehrere',
		q: 'Kann ich mehrere Orte auf ein Poster bringen?',
		k: ['mehrere', 'zwei orte', 'drei orte', 'kennengelernt', 'kombinieren'],
		a: 'Ja, bis zu drei Orte nebeneinander (z. B. „Kennengelernt – Geheiratet – Zuhause“). Im Bereich „Ort“ unter „Mehrere Orte“ einschalten und weitere Orte suchen.',
		act: { label: 'Zum Bereich Ort', step: 'ort' }
	},
	{
		id: 'pins',
		q: 'Kann ich einen Ort markieren?',
		k: ['markieren', 'markierung', 'pin', 'herz', 'stern setzen', 'punkt', 'unser haus'],
		a: 'Ja: Im Bereich „Extras“ unter „Orte markieren“ Herz, Pin, Stern oder Punkt hinzufügen und im Poster an die richtige Stelle ziehen.',
		act: { label: 'Zu den Extras', step: 'extras' }
	},
	{
		id: 'text',
		q: 'Wie ändere ich Titel, Datum oder Schrift?',
		k: ['titel', 'text', 'untertitel', 'datum', 'widmung', 'schrift', 'schriftart', 'schreibschrift', 'koordinaten'],
		a: 'Im Bereich „Text“: Titel, Untertitel, eine Zeile für Datum oder Widmung, Koordinaten an/aus und vier Schrift-Kombinationen (z. B. Schreibschrift).',
		act: { label: 'Zum Bereich Text', step: 'text' }
	},
	{
		id: 'anlass',
		q: 'Gibt es Vorlagen für Anlässe?',
		k: ['anlass', 'vorlage', 'hochzeit', 'geburt', 'geschenk idee', 'umzug', 'zuhause', 'heimat', 'urlaub', 'verein', 'firma'],
		a: 'Ja: Hochzeit, Geburt, Neues Zuhause, Heimatdorf, Urlaub sowie Verein & Firma. Eine Vorlage setzt passenden Stil, Design, Markierung und Widmung – alles bleibt änderbar.',
		act: { label: 'Vorlagen ansehen', step: 'ort' }
	},
	{
		id: 'geschenk',
		q: 'Kann ich das Poster verschenken?',
		k: ['geschenk', 'verschenken', 'gutschein', 'schenken', 'karte'],
		a: 'Ja: Im Bereich „Fertig“ eine Botschaft schreiben und einen Geschenk-Link kopieren (öffnet das Poster mit deinem Gruß) oder eine Geschenkkarte als Bild herunterladen.',
		act: { label: 'Zum Verschenken', step: 'fertig' }
	},
	{
		id: 'speichern',
		q: 'Wird mein Entwurf gespeichert?',
		k: ['speichern', 'gespeichert', 'entwurf', 'weiter', 'später', 'teilen', 'link', 'anderes gerät'],
		a: 'Ja, automatisch in deinem Browser – beim nächsten Besuch steht „Weiter mit …“ auf der Startseite. Mit „Link zum Entwurf kopieren“ öffnest du ihn auf einem anderen Gerät.'
	},
	{
		id: 'produkte',
		q: 'Welche Produkte gibt es?',
		k: ['produkt', 'rahmen', 'leinwand', 'tasse', 'shirt', 't-shirt', 'mockup', 'vorschau', 'wand'],
		a: 'Poster, Poster mit Rahmen (7 Rahmen, optional Passepartout), Leinwand, T-Shirt (7 Farben) und Tasse. Im Bereich „Fertig“ siehst du alles maßstäblich im Raum oder am Model.',
		act: { label: 'Zum Bereich Produkt', step: 'produkt' }
	},
	{
		id: 'widerruf',
		q: 'Kann ich zurückgeben?',
		k: ['zurück', 'rückgabe', 'widerruf', 'umtausch', 'reklamation', 'kaputt', 'beschädigt'],
		a: 'Personalisierte Poster sind vom Widerrufsrecht ausgenommen, weil sie nur für dich gefertigt werden. Bei Druckfehlern oder Transportschäden gilt natürlich die gesetzliche Gewährleistung.'
	},
	{
		id: 'daten',
		q: 'Woher kommen die Kartendaten?',
		k: ['daten', 'openstreetmap', 'osm', 'aktuell', 'fehlt', 'falsch', 'haus fehlt', 'quelle'],
		a: 'Aus OpenStreetMap, der freien Weltkarte von Freiwilligen. Fehlt ein Haus, kann man es dort selbst eintragen – nach einigen Tagen erscheint es auch bei uns. Die Quellenangabe steht auf jedem Poster.'
	},
	{
		id: 'luftbild',
		q: 'Gibt es Satellitenbilder?',
		k: ['satellit', 'luftbild', 'foto', 'bayern'],
		a: 'Es gibt amtliche Luftbilder für Orte in Bayern (Stil „Landkarte“ → „Luftbild (Bayern)“). Für andere Regionen folgen sie, sobald es frei nutzbare Daten gibt.'
	},
	{
		id: 'hoehe',
		q: 'Gibt es Höhenlinien?',
		k: ['höhe', 'höhenlinien', 'berg', 'berge', 'gelände', 'relief'],
		a: 'Ja: Im Bereich „Stil“ „Höhenlinien“ einschalten – besonders schön bei hügeligen Orten.'
	},
	{
		id: 'datenschutz',
		q: 'Was passiert mit meinen Daten?',
		k: ['datenschutz', 'daten speichern', 'cookies', 'tracking', 'privat', 'dsgvo'],
		a: 'Kein Konto, keine Cookies, kein Tracking. Dein Entwurf bleibt in deinem Browser. Details stehen in der Datenschutzerklärung.'
	},
	{
		id: 'app',
		q: 'Gibt es eine App?',
		k: ['app', 'installieren', 'handy', 'homescreen', 'offline'],
		a: 'Kartenstudio lässt sich wie eine App installieren: Im Browser „Zum Home-Bildschirm“ wählen. Das Beispiel funktioniert sogar offline.'
	},
	{
		id: 'kontakt',
		q: 'Wie erreiche ich euch?',
		k: ['kontakt', 'mensch', 'mail', 'e-mail', 'telefon', 'support', 'hilfe'],
		a: 'Schreib uns gern – die Kontaktdaten stehen im Impressum. Wir antworten persönlich.'
	}
];

/** Hinweise für den KI-Bot (Ton, Grenzen) */
export const KI_REGELN = `Du bist der freundliche Hilfe-Assistent von „Kartenstudio“, einer Website, auf der man Orte als Poster, Shirt oder Tasse gestaltet.
- Antworte immer auf Deutsch, per Du, kurz (2–4 Sätze), klar und ohne Fachbegriffe.
- Nutze nur die Fakten aus dem Wissen unten. Wenn etwas nicht drinsteht (z. B. genaue Lieferzeiten, Rabattcodes), sag ehrlich, dass du es nicht weißt, und verweise auf den Kontakt im Impressum.
- Versprich nichts, was die Seite nicht kann. Bestellen mit Versand ist noch nicht möglich, Herunterladen schon.
- Keine Rechts- oder Steuerberatung. Keine Fragen außerhalb von Kartenstudio beantworten – lenke freundlich zurück.
- Nenne bei Bedienfragen den passenden Schritt im Assistenten (Ort, Ausschnitt, Stil, Design, Text, Produkt, Fertig).`;

/** Wissen als Text für den KI-Prompt */
export function wissenText() {
	return FAQ.map((f) => `F: ${f.q}\nA: ${f.a}`).join('\n\n');
}
