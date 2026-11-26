// Ordnung der Stile und Designs in klare Gruppen.
// Jeder Stil und jedes Design gehört GENAU EINER Gruppe an (keine Doppelungen → leicht zu überblicken).
// Reihenfolge der Gruppen = Reihenfolge im Editor; innerhalb einer Gruppe stehen die beliebtesten vorne.
// NEUE GRUPPE / THEMENWELT: einen Eintrag ergänzen (id, name, kurze Beschreibung, Schlüssel aus
// themen/vorlagen.js bzw. themen/designs.js). `neu: true` zeigt ein „Neu“-Etikett.
// Gleiche id bei Stilen und Designs (z. B. „sunset“) = zusammengehörige Themenwelt: wählt man sie
// bei den Stilen, ist sie auch bei den Designs vorausgewählt.

/**
 * @typedef {{ id: string, name: string, desc: string, neu?: boolean, keys: string[] }} Gruppe
 */

/** @type {Gruppe[]} Farbstile (Bereich „Stil“) */
export const STIL_GRUPPEN = [
	{
		id: 'hell',
		name: 'Hell & klassisch',
		desc: 'Ruhige Linien auf hellem Papier – zeitlos und passend zu jedem Raum.',
		keys: ['stadtplan', 'umriss', 'minimal', 'vintage', 'strassen', 'schwarzweiss', 'blaupause', 'washi', 'tusche']
	},
	{
		id: 'dunkel',
		name: 'Dunkel & Nacht',
		desc: 'Dunkler Grund mit leuchtenden Straßen.',
		keys: ['dunkel', 'goldnacht', 'cyber', 'tinte', 'lichter', 'neon', 'solar', 'vulkan']
	},
	{
		id: 'farbig',
		name: 'Farbig',
		desc: 'Mehrere Farben, fröhlich und lebendig.',
		keys: ['mittelmeer', 'pastell', 'japan', 'koenigsblau', 'puls', 'wald']
	},
	{
		id: 'einfarbig',
		name: 'Einfarbig',
		desc: 'Eine Farbe in mehreren Tönen – stark mit großen Buchstaben.',
		keys: ['koralle', 'lavendel', 'petrol', 'salbei', 'senf', 'schiefer', 'flamingo', 'tanne', 'insel']
	},
	{
		id: 'illustriert',
		name: 'Illustriert',
		desc: 'Bunte Symbole, Wimmelbild und Lagekarten.',
		keys: ['popart', 'konfetti', 'wimmel', 'dossier', 'einsatz']
	},
	{
		id: 'sunset',
		name: 'Sunset City',
		desc: 'Spielkarten-Look und Miami-Abendstimmung: Neon, Palmen, Sonnenuntergang.',
		neu: true,
		keys: ['albumabend', 'sunset', 'spielkarte', 'nachtfahrt', 'pastellabend']
	}
];

/** @type {Gruppe[]} Designs (Bereich „Design“) */
export const DESIGN_GRUPPEN = [
	{
		id: 'schlicht',
		name: 'Schlicht',
		desc: 'Karte mit Text darunter oder darüber – ohne Schnickschnack.',
		keys: ['stadtplan', 'poster', 'klassisch', 'minimal', 'linie', 'koordinaten', 'oben', 'randlos', 'leise', 'galerie', 'galeriekoord']
	},
	{
		id: 'rahmen',
		name: 'Rahmen & Balken',
		desc: 'Mit Rahmen, Passepartout oder farbigem Textbalken.',
		keys: ['siegritz', 'passepartout', 'doppel', 'breit', 'polaroid', 'abgerundet', 'balkenoben']
	},
	{
		id: 'formen',
		name: 'Formen',
		desc: 'Die Karte als Kreis, Herz, Haus – oder in deiner eigenen Form.',
		keys: ['kreiskoord', 'kreis', 'herz', 'silhouette', 'haus', 'rund', 'sechseck', 'bogen', 'bogenlinie', 'silhouettelinie']
	},
	{
		id: 'typo',
		name: 'Typografie',
		desc: 'Der Ortsname in großen Buchstaben – auch mit der Karte darin.',
		keys: ['typo', 'typoschnitt', 'typoumriss', 'typopinsel']
	},
	{
		id: 'grafik',
		name: 'Grafik & Editorial',
		desc: 'Nach Vorbildern aus Grafikdesign und Kartenkunst: Fokus, Lupe, Steckbrief.',
		keys: ['fokus', 'fokuskreis', 'fokusherz', 'steckbrief', 'studie', 'kasten', 'lupe', 'nachtstadt', 'dossier', 'einsatz']
	},
	{
		id: 'sunset',
		name: 'Sunset City',
		desc: 'Spielkarten-Look und Miami-Abendstimmung: Neon, Palmen, Sonnenuntergang.',
		neu: true,
		keys: ['sonnenuntergang', 'album', 'guide', 'cover', 'plakette']
	}
];

/** Gruppe eines Stils/Designs @param {Gruppe[]} G @param {string} k */
export const gruppeVon = (G, k) => G.find((g) => g.keys.includes(k));
