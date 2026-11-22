// Anlass-Vorlagen: ein Klick wählt passenden Stil, Design, Markierung und Widmung.
// Die Werte sind bewusst nur ein Startpunkt – alles bleibt danach frei änderbar.

/**
 * @typedef {{ name: string, desc: string, icon: string, preset: string, design: string,
 *   pin: string|null, pinColor: string, note: string, fx?: {paper?: boolean, vig?: boolean}, bg?: string,
 *   ask: string }} Anlass
 */

/** @type {Record<string, Anlass>} */
export const ANLAESSE = {
	hochzeit: {
		name: 'Hochzeit',
		desc: 'Herzform, zarte Farben, Herz-Markierung',
		icon: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
		preset: 'umriss',
		design: 'herz',
		pin: 'herz',
		pinColor: '#d64545',
		note: 'Hier haben wir Ja gesagt',
		fx: { paper: true },
		bg: '#faf6f0',
		ask: 'Wo habt ihr geheiratet?'
	},
	geburt: {
		name: 'Geburt',
		desc: 'Rund, sanftes Pastell, Stern',
		icon: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
		preset: 'pastell',
		design: 'kreiskoord',
		pin: 'stern',
		pinColor: '#2f6fe4',
		note: 'Willkommen auf der Welt',
		ask: 'Wo wurde euer Kind geboren?'
	},
	zuhause: {
		name: 'Neues Zuhause',
		desc: 'Klar und modern mit Koordinaten',
		icon: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
		preset: 'minimal',
		design: 'galeriekoord',
		pin: 'pin',
		pinColor: '#262c3a',
		note: 'Unser Zuhause',
		ask: 'Wo wohnt ihr?'
	},
	heimat: {
		name: 'Heimatdorf',
		desc: 'Das Siegritz-Original: Navy-Balken, Fraktur',
		icon: '<path d="M3 20h18"/><path d="M6 20V10l4-3 4 3v10"/><path d="M14 20v-6l4-3 3 2v7"/>',
		preset: 'umriss',
		design: 'siegritz',
		pin: null,
		pinColor: '#d64545',
		note: '',
		ask: 'Wie heißt dein Heimatort?'
	},
	urlaub: {
		name: 'Urlaub',
		desc: 'Sonnige Farben im Polaroid-Look',
		icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
		preset: 'mittelmeer',
		design: 'polaroid',
		pin: 'stern',
		pinColor: '#c9a227',
		note: 'Unser schönster Sommer',
		ask: 'Wo wart ihr im Urlaub?'
	},
	verein: {
		name: 'Verein & Firma',
		desc: 'Kräftig mit Balken oben',
		icon: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
		preset: 'dunkel',
		design: 'balkenoben',
		pin: 'punkt',
		pinColor: '#c9a227',
		note: '',
		ask: 'Wo ist euer Verein oder eure Firma?'
	}
};
