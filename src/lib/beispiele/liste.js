// Beispiel-Galerie: fertige Designs zur Inspiration.
// Jedes Beispiel = Ort (aus seo/orte.js, oder 'demo' = Offline-Beispiel Siegritz) + Look (Stil, Design, Motiv …).
// Vorschaubilder liegen in static/beispiele/<id>.jpg und werden mit `node tests/beispielbilder.mjs <url>` neu erzeugt.

/**
 * @typedef {{
 *   id: string, titel: string, text: string, ort: string, breite?: number,
 *   preset: string, design: string, motif?: 'karte'|'sterne'|'koord'|'wolke',
 *   sub?: string, note?: string, pin?: string, pinColor?: string,
 *   fx?: {paper?: boolean, vig?: boolean, glow?: boolean}, hoehen?: boolean,
 *   sky?: Record<string, any>, koord?: {text?: string, align?: string}, wolke?: {text?: string, form?: string, schrift?: boolean},
 *   titelSchrift?: 'SgSC', info?: {kopf?: string, nr?: string, kicker?: string, fakten?: string, absatz?: string}
 * }} Beispiel
 */

/** @type {Beispiel[]} */
export const BEISPIELE = [
	{ id: 'waischenfeld-heimat', titel: 'Heimat-Original', text: 'Navy-Balken und Fraktur – der Klassiker fürs Heimatdorf', ort: 'waischenfeld', preset: 'umriss', design: 'siegritz', sub: 'Fränkische Schweiz' },
	{ id: 'bamberg-typo', titel: 'Typografie in Koralle', text: 'Riesige Buchstaben über der Stadt', ort: 'bamberg', breite: 1800, preset: 'koralle', design: 'typo' },
	{ id: 'nuernberg-nacht', titel: 'Nachtblau klassisch', text: 'Weiße Linien auf Nachtblau – der Klassiker', ort: 'nuernberg', breite: 2000, preset: 'dunkel', design: 'klassisch' },
	{ id: 'pottenstein-hoehen', titel: 'Vintage mit Höhenlinien', text: 'Täler und Felsen der Fränkischen Schweiz', ort: 'pottenstein', breite: 1600, preset: 'vintage', design: 'galerie', hoehen: true, sub: 'Fränkische Schweiz' },
	{ id: 'wuerzburg-popart', titel: 'Pop-Art', text: 'Bunte Symbole entlang der Straßen', ort: 'wuerzburg', breite: 1300, preset: 'popart', design: 'polaroid' },
	{ id: 'bamberg-sterne', titel: 'Sternenhimmel in Gold', text: 'Der Himmel über Bamberg am Hochzeitstag', ort: 'bamberg', preset: 'umriss', design: 'kreiskoord', motif: 'sterne', sky: { theme: 'gold', date: '2019-06-21', min: 1350, names: false }, sub: 'Unser Hochzeitstag' },
	{ id: 'lindau-insel', titel: 'Insel-Silhouette', text: 'Lindau im Bodensee – Land blau, Wasser weiß', ort: 'lindau', breite: 2600, preset: 'insel', design: 'randlos', sub: 'Bodensee' },
	{ id: 'muenchen-kreis', titel: 'Blaupause im Kreis', text: 'Rund ausgeschnitten, mit Koordinaten', ort: 'muenchen', breite: 2000, preset: 'blaupause', design: 'kreiskoord' },
	{ id: 'kulmbach-geburt', titel: 'Wortwolke zur Geburt', text: 'Name, Datum und liebe Wörter füllen ein Herz', ort: 'kulmbach', preset: 'pastell', design: 'galerie', motif: 'wolke', wolke: { text: 'Emil*, 11.02.2025*, Willkommen, Mama, Papa, Oma, Opa, Liebe, Glück, Baby, Familie, Wunder, Zuhause', form: 'herz', schrift: true }, sub: 'Willkommen, Emil' },
	{ id: 'forchheim-hochzeit', titel: 'Hochzeit in Herzform', text: 'Herz-Markierung, Papier-Struktur, Widmung', ort: 'forchheim', preset: 'umriss', design: 'herz', pin: 'herz', pinColor: '#d64545', note: 'Hier haben wir Ja gesagt', fx: { paper: true } },
	{ id: 'erlangen-koord', titel: 'Koordinaten-Poster', text: 'Große Koordinaten und eine kleine Geschichte', ort: 'erlangen', preset: 'petrol', design: 'minimal', motif: 'koord', koord: { text: 'Hier haben wir studiert, uns kennengelernt und unsere erste Wohnung bezogen.', align: 'links' } },
	{ id: 'rothenburg-mittelmeer', titel: 'Mittelmeer-Sonne', text: 'Warme Farben im Polaroid-Look', ort: 'rothenburg-ob-der-tauber', breite: 1200, preset: 'mittelmeer', design: 'polaroid' },
	{ id: 'regensburg-lavendel', titel: 'Lavendel, Schrift', text: 'Einfarbig mit Schreibschrift-Titel', ort: 'regensburg', breite: 1700, preset: 'lavendel', design: 'galerie', titelSchrift: 'SgSC' },
	// Nach Vorbildern aus Grafikdesign & Kartenkunst
	{ id: 'bamberg-fokus', titel: 'Fokus in Rot', text: 'Roter Fleck im Herzen der Stadt, Pinselschrift', ort: 'bamberg', breite: 2200, preset: 'japan', design: 'fokus', sub: 'Weltkulturerbe' },
	{ id: 'bayreuth-steckbrief', titel: 'Steckbrief', text: 'Kartenkreis mit Nordpfeil und Fakten – wie eine Sammelserie', ort: 'bayreuth', breite: 2400, preset: 'schwarzweiss', design: 'steckbrief', info: { kopf: 'Städte in Franken', nr: '03/10', kicker: 'Stadt Plan' } },
	{ id: 'coburg-studie', titel: 'Studie in Navy', text: 'Kartenkreis auf Weiß mit Info-Leiste', ort: 'coburg', breite: 1800, preset: 'dunkel', design: 'studie' },
	{ id: 'fuerth-puls', titel: 'Am Puls', text: 'Rote Straßen auf Farbverlauf, Textkasten in der Mitte', ort: 'fuerth', breite: 2600, preset: 'puls', design: 'kasten', info: { kicker: 'Am' } },
	{ id: 'erlangen-neon', titel: 'Neon-Nacht', text: 'Pink und Violett auf Schwarzblau', ort: 'erlangen', breite: 2600, preset: 'neon', design: 'nachtstadt' },
	{ id: 'regensburg-gold', titel: 'Gold & Nacht', text: 'Goldene Straßen, gesperrter Titel', ort: 'regensburg', breite: 2600, preset: 'goldnacht', design: 'nachtstadt' },
	{ id: 'augsburg-lichter', titel: 'Stadtlichter', text: 'Leuchtende Straßen auf Schwarz', ort: 'augsburg', breite: 3200, preset: 'lichter', design: 'leise', fx: { glow: true } },
	{ id: 'ansbach-dossier', titel: 'Dossier', text: 'Gestrichelter Kreis, Gitter und rote Häuser', ort: 'ansbach', breite: 1800, preset: 'dossier', design: 'dossier' },
	{ id: 'nuernberg-einsatz', titel: 'Einsatzkarte', text: 'Rot markiertes Viertel mit Route, Gitter und Kompass', ort: 'nuernberg', breite: 2400, preset: 'einsatz', design: 'einsatz' },
	{ id: 'bamberg-washi', titel: 'Fokus Kreis', text: 'Roter Punkt wie eine Sonne über dem Ort', ort: 'bamberg', breite: 2200, preset: 'washi', design: 'fokuskreis' },
	{ id: 'wuerzburg-typoschnitt', titel: 'Karte in Buchstaben', text: 'Der Ort erscheint nur im eigenen Namen', ort: 'wuerzburg', breite: 3200, preset: 'tanne', design: 'typoschnitt' },
	{ id: 'erlangen-typopinsel', titel: 'Typo Pinsel', text: 'Großer Pinselschriftzug quer über der Stadt', ort: 'erlangen', breite: 2400, preset: 'schiefer', design: 'typopinsel' },
	// Themenwelt „Sunset City“
	{ id: 'regensburg-album', titel: 'Album-Abend', text: 'Exakt die Farben des Abend-Plattencovers', ort: 'regensburg', breite: 2400, preset: 'albumabend', design: 'album' },
	{ id: 'lindau-spielkarte', titel: 'Spielkarte', text: 'Grünes Land, türkiser Küstensaum – wie eine Videospiel-Karte', ort: 'lindau', breite: 2600, preset: 'spielkarte', design: 'guide', sub: 'Bodensee' },
	{ id: 'regensburg-sonnenuntergang', titel: 'Sonnenuntergang', text: 'Retro-Sonne und Palmen über der Stadt', ort: 'regensburg', breite: 2600, preset: 'sunset', design: 'sonnenuntergang' },
	{ id: 'nuernberg-cover', titel: 'Cover-Raster', text: 'Panels und Titel-Plakette wie ein Spiele-Cover', ort: 'nuernberg', breite: 2600, preset: 'nachtfahrt', design: 'cover' },
	{ id: 'passau-lupe', titel: 'Lupe', text: 'Die Altstadt im Kreis hervorgehoben', ort: 'passau', breite: 2400, preset: 'schwarzweiss', design: 'lupe' },
	{ id: 'nuernberg-koenigsblau', titel: 'Königsblau', text: 'Zarte Straßen, Wasser und Parks in Blau', ort: 'nuernberg', breite: 3000, preset: 'koenigsblau', design: 'galerie' },
	{ id: 'wuerzburg-wimmel', titel: 'Wimmelbild', text: 'Illustrierter Stadtplan in Koralle und Türkis', ort: 'wuerzburg', breite: 1300, preset: 'wimmel', design: 'polaroid' },
	{ id: 'goessweinstein-heimat', titel: 'Heimat mit Vignette', text: 'Waldgrün, abgedunkelter Rand, Fraktur', ort: 'goessweinstein', preset: 'wald', design: 'linie', fx: { vig: true }, sub: 'Fränkische Schweiz' }
];
