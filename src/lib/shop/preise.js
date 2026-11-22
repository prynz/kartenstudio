// Preise – HIER ANPASSEN.
// Alle Preise in Euro inkl. MwSt. Das sind vorerst BEISPIELPREISE (grob am Markt orientiert),
// bis die Einkaufspreise beim Druckpartner feststehen.

/** Grundpreis je Druckgröße und Produkt */
export const PREISE = {
	poster: { a4: 19.9, a3: 24.9, a2: 34.9, '30x40': 27.9, '50x70': 39.9, '70x100': 54.9, '30x30': 24.9, '50x50': 37.9 },
	gerahmt: { a4: 44.9, a3: 59.9, a2: 89.9, '30x40': 64.9, '50x70': 109.9, '70x100': 149.9, '30x30': 54.9, '50x50': 94.9 },
	leinwand: { a4: 34.9, a3: 44.9, a2: 64.9, '30x40': 49.9, '50x70': 74.9, '70x100': 99.9, '30x30': 42.9, '50x50': 69.9 }
};
/** Feste Preise für Produkte ohne Größenwahl */
export const FESTPREISE = { shirt: 29.9, tasse: 19.9 };
/** Aufpreise */
export const AUFPREIS = {
	/** Edle Rahmen (Holz, Gold) */
	rahmenEdel: { eiche: 10, nuss: 12, gold: 15 },
	/** Passepartout */
	passepartout: 6
};
/** Versand (Anzeige) */
export const VERSAND = 'zzgl. Versand';

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
