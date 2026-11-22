// Preise – HIER ANPASSEN.
// Alle Preise in Euro inkl. MwSt. Das sind vorerst BEISPIELPREISE (grob am Markt orientiert),
// bis die Einkaufspreise beim Druckpartner feststehen.

/** Grundpreis je Druckgröße und Produkt */
export const PREISE = {
	poster: { a4: 19.9, a3: 24.9, a2: 34.9, '30x40': 27.9, '50x70': 39.9, '70x100': 54.9, '30x30': 24.9, '50x50': 37.9 },
	gerahmt: { a4: 44.9, a3: 59.9, a2: 89.9, '30x40': 64.9, '50x70': 109.9, '70x100': 149.9, '30x30': 54.9, '50x50': 94.9 },
	leinwand: { a4: 34.9, a3: 44.9, a2: 64.9, '30x40': 49.9, '50x70': 74.9, '70x100': 99.9, '30x30': 42.9, '50x50': 69.9 },
	alu: { a4: 39.9, a3: 49.9, a2: 79.9, '30x40': 59.9, '50x70': 99.9, '70x100': 139.9, '30x30': 49.9, '50x50': 84.9 },
	/** Download: kleiner Preis, bei jeder Druckbestellung gratis dazu */
	download: { a4: 9.9, a3: 9.9, a2: 14.9, '30x40': 9.9, '50x70': 14.9, '70x100': 19.9, '30x30': 9.9, '50x50': 14.9 }
};
/** Feste Preise für Produkte ohne Größenwahl */
export const FESTPREISE = { shirt: 29.9, tasse: 19.9, aufsteller: 24.9 };
/** Aufpreise */
export const AUFPREIS = {
	/** Edle Rahmen (Holz, Gold) */
	rahmenEdel: { eiche: 10, nuss: 12, gold: 15 },
	/** Passepartout */
	passepartout: 6
};
/** Versand: in Deutschland kostenlos (im Preis enthalten), Österreich mit Aufpreis */
export const VERSAND = { de: 0, at: 4.9 };
/** Herstellungszeit in Werktagen je Produkt, Versand 1–2 Werktage */
export const PRODUKTION = { poster: 2, aufsteller: 2, gerahmt: 3, leinwand: 3, alu: 3, shirt: 3, tasse: 3 };

/** Datum + n Werktage (Sa/So zählen nicht) @param {Date} d @param {number} n */
function werktage(d, n) {
	const x = new Date(d);
	while (n > 0) {
		x.setDate(x.getDate() + 1);
		if (x.getDay() !== 0 && x.getDay() !== 6) n--;
	}
	return x;
}
/** „Di, 24.11.“ @param {Date} d */
const tag = (d) => `${['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;

/**
 * Voraussichtliche Lieferung (ohne Feiertage).
 * @param {string} typ @param {Date} [jetzt]
 */
export function lieferung(typ, jetzt = new Date()) {
	if (typ === 'download') return 'Sofort nach dem Kauf';
	const p = /** @type {Record<string,number>} */ (PRODUKTION)[typ] ?? 3;
	// Nach 14 Uhr zählt der heutige Tag nicht mehr
	const start = jetzt.getHours() >= 14 ? werktage(jetzt, 1) : jetzt;
	return `Lieferung voraussichtlich ${tag(werktage(start, p))} – ${tag(werktage(start, p + 2))}`;
}

/**
 * Preis für die aktuelle Auswahl.
 * @param {any} P Produktauswahl (siehe mockup.js → product())
 * @param {any} print Druckgröße (S.print) oder null = frei
 * @returns {{preis:number, text:string, details:string[]}}
 */
export function preis(P, print) {
	const typ = P.type;
	/** @type {string[]} */
	const details = [];
	let p = 0;
	if (typ in FESTPREISE) p = /** @type {Record<string,number>} */ (FESTPREISE)[typ];
	else {
		const k = (print && print.k) || '50x70';
		if (!print) details.push('Freies Format – berechnet wie 50 × 70 cm');
		if (typ === 'download') details.push('Bei jeder Druckbestellung gratis dazu');
		p = /** @type {Record<string,Record<string,number>>} */ (PREISE)[typ][k] ?? 0;
		if (typ === 'gerahmt') {
			const a = /** @type {Record<string,number>} */ (AUFPREIS.rahmenEdel)[P.frame] || 0;
			if (a) {
				p += a;
				details.push(`Edler Rahmen +${fmt(a)}`);
			}
			if (P.mat) {
				p += AUFPREIS.passepartout;
				details.push(`Passepartout +${fmt(AUFPREIS.passepartout)}`);
			}
		}
	}
	return { preis: p, text: fmt(p), details };
}

/** 39.9 → „39,90 €“ @param {number} v */
export function fmt(v) {
	return v.toFixed(2).replace('.', ',') + ' €';
}
