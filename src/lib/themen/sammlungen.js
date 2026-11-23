// Themenwelten: Stile und Designs nach Themen sortiert.
// HIER NEUE THEMENWELTEN ANLEGEN: ein Eintrag mit Namen, kurzer Beschreibung und den Schlüsseln
// der Stile (themen/vorlagen.js) und Designs (themen/designs.js). Mit `neu: true` bekommt die Welt
// ein „Neu“-Etikett und steht vorne. Ein Stil/Design darf in mehreren Welten vorkommen.

/**
 * @typedef {{ id: string, name: string, desc: string, neu?: boolean, stile: string[], designs: string[] }} Themenwelt
 */

/** @type {Themenwelt[]} */
export const THEMENWELTEN = [
	{
		id: 'sunset',
		name: 'Sunset City',
		desc: 'Spielkarten-Look und Miami-Abendstimmung: Neon, Palmen, Sonnenuntergang.',
		neu: true,
		stile: ['spielkarte', 'sunset', 'nachtfahrt', 'pastellabend', 'neon', 'puls'],
		designs: ['guide', 'cover', 'plakette', 'sonnenuntergang', 'nachtstadt', 'randlos']
	},
	{
		id: 'klassisch',
		name: 'Klassisch',
		desc: 'Zeitlos und ruhig – Linien, Papier, Rahmen.',
		stile: ['umriss', 'minimal', 'strassen', 'blaupause', 'vintage', 'wald', 'tusche', 'schwarzweiss', 'washi'],
		designs: ['poster', 'siegritz', 'klassisch', 'balkenoben', 'koordinaten', 'galerie', 'minimal', 'linie', 'passepartout', 'doppel', 'breit', 'polaroid', 'abgerundet', 'rund', 'oben', 'galeriekoord']
	},
	{
		id: 'nacht',
		name: 'Nacht',
		desc: 'Dunkle Stile mit leuchtenden Straßen.',
		stile: ['dunkel', 'cyber', 'solar', 'vulkan', 'konfetti', 'neon', 'goldnacht', 'lichter', 'tinte', 'nachtfahrt'],
		designs: ['nachtstadt', 'leise', 'randlos', 'lupe']
	},
	{
		id: 'einfarbig',
		name: 'Einfarbig',
		desc: 'Eine Farbe, viele Töne – stark mit großen Buchstaben.',
		stile: ['lavendel', 'koralle', 'petrol', 'salbei', 'senf', 'schiefer', 'flamingo', 'tanne', 'insel', 'koenigsblau'],
		designs: ['typo', 'typoumriss', 'typoschnitt', 'typopinsel']
	},
	{
		id: 'formen',
		name: 'Formen',
		desc: 'Die Karte als Kreis, Herz, Haus – oder in deiner eigenen Form.',
		stile: [],
		designs: ['kreis', 'kreiskoord', 'herz', 'haus', 'sechseck', 'bogen', 'bogenlinie', 'silhouette', 'silhouettelinie', 'fokuskreis', 'fokusherz']
	},
	{
		id: 'grafik',
		name: 'Grafik & Plakat',
		desc: 'Nach Vorbildern aus Grafikdesign und Kartenkunst.',
		stile: ['japan', 'puls', 'dossier', 'einsatz', 'wimmel', 'popart', 'pastell', 'mittelmeer', 'koenigsblau'],
		designs: ['fokus', 'fokuskreis', 'fokusherz', 'studie', 'steckbrief', 'kasten', 'lupe', 'dossier', 'einsatz']
	}
];
