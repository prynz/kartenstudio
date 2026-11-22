// Beispiel-Galerie: fertige Designs zur Inspiration.
// Jedes Beispiel = Ort (aus seo/orte.js, oder 'demo' = Offline-Beispiel Siegritz) + Look (Stil, Design, Motiv …).
// Vorschaubilder liegen in static/beispiele/<id>.jpg und werden mit `node tests/beispielbilder.mjs <url>` neu erzeugt.

/**
 * @typedef {{
 *   id: string, titel: string, text: string, ort: string, breite?: number,
 *   preset: string, design: string, motif?: 'karte'|'sterne'|'koord'|'wolke',
 *   sub?: string, note?: string, pin?: string, pinColor?: string,
 *   fx?: {paper?: boolean, vig?: boolean}, hoehen?: boolean,
 *   sky?: Record<string, any>, koord?: {text?: string, align?: string}, wolke?: {text?: string, form?: string, schrift?: boolean},
 *   titelSchrift?: 'SgSC'
 * }} Beispiel
 */

/** @type {Beispiel[]} */
export const BEISPIELE = [
	{ id: 'siegritz-original', titel: 'Siegritz-Original', text: 'Navy-Balken, Fraktur – das Shirt-Design, mit dem alles begann', ort: 'demo', preset: 'umriss', design: 'siegritz' },
	{ id: 'bamberg-typo', titel: 'Typografie in Koralle', text: 'Riesige Buchstaben über der Stadt', ort: 'bamberg', breite: 1800, preset: 'koralle', design: 'typo' },
	{ id: 'nuernberg-nacht', titel: 'Nachtblau klassisch', text: 'Weiße Linien auf Nachtblau – der Klassiker', ort: 'nuernberg', breite: 2000, preset: 'dunkel', design: 'klassisch' },
	{ id: 'pottenstein-hoehen', titel: 'Vintage mit Höhenlinien', text: 'Täler und Felsen der Fränkischen Schweiz', ort: 'pottenstein', breite: 1600, preset: 'vintage', design: 'galerie', hoehen: true, sub: 'Fränkische Schweiz' },
	{ id: 'wuerzburg-popart', titel: 'Pop-Art', text: 'Bunte Symbole entlang der Straßen', ort: 'wuerzburg', breite: 1300, preset: 'popart', design: 'polaroid' },
	{ id: 'bamberg-sterne', titel: 'Sternenhimmel in Gold', text: 'Der Himmel über Bamberg am Hochzeitstag', ort: 'bamberg', preset: 'umriss', design: 'kreiskoord', motif: 'sterne', sky: { theme: 'gold', date: '2019-06-21', min: 1350, names: false }, sub: 'Unser Hochzeitstag' },
	{ id: 'lindau-insel', titel: 'Insel-Silhouette', text: 'Lindau im Bodensee – Land blau, Wasser weiß', ort: 'lindau', breite: 2600, preset: 'insel', design: 'randlos', sub: 'Bodensee' },
	{ id: 'muenchen-kreis', titel: 'Blaupause im Kreis', text: 'Rund ausgeschnitten, mit Koordinaten', ort: 'muenchen', breite: 2000, preset: 'blaupause', design: 'kreiskoord' },
	{ id: 'siegritz-wolke', titel: 'Wortwolke im Herz', text: 'Namen, Daten und Wörter füllen ein Herz', ort: 'demo', preset: 'pastell', design: 'galerie', motif: 'wolke', wolke: { text: 'Siegritz*, Fränkische Schweiz, Heimat, Zuhause, Familie, Liebe, Freunde, Kirchweih, Sommer, Kindheit, Glück, Erinnerungen', form: 'herz', schrift: true } },
	{ id: 'forchheim-hochzeit', titel: 'Hochzeit in Herzform', text: 'Herz-Markierung, Papier-Struktur, Widmung', ort: 'forchheim', preset: 'umriss', design: 'herz', pin: 'herz', pinColor: '#d64545', note: 'Hier haben wir Ja gesagt', fx: { paper: true } },
	{ id: 'erlangen-koord', titel: 'Koordinaten-Poster', text: 'Große Koordinaten und eine kleine Geschichte', ort: 'erlangen', preset: 'petrol', design: 'minimal', motif: 'koord', koord: { text: 'Hier haben wir studiert, uns kennengelernt und unsere erste Wohnung bezogen.', align: 'links' } },
	{ id: 'rothenburg-mittelmeer', titel: 'Mittelmeer-Sonne', text: 'Warme Farben im Polaroid-Look', ort: 'rothenburg-ob-der-tauber', breite: 1200, preset: 'mittelmeer', design: 'polaroid' },
	{ id: 'regensburg-lavendel', titel: 'Lavendel, Schrift', text: 'Einfarbig mit Schreibschrift-Titel', ort: 'regensburg', breite: 1700, preset: 'lavendel', design: 'galerie', titelSchrift: 'SgSC' },
	{ id: 'goessweinstein-heimat', titel: 'Heimat mit Vignette', text: 'Waldgrün, abgedunkelter Rand, Fraktur', ort: 'goessweinstein', preset: 'wald', design: 'linie', fx: { vig: true }, sub: 'Fränkische Schweiz' }
];
