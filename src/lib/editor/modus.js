// Neuer oder alter Editor?
// Neu (Standard): Live-Karte mit MapLibre, alle alten Stile/Designs/Effekte ausgeblendet.
// Alt: der bisherige SVG-Editor mit allem – erreichbar über …/#alt (bleibt gemerkt), zurück mit …/#neu.
// Die automatischen Tests des alten Editors schalten ihn über localStorage ein.
const SCHLUESSEL = 'kartenstudio.alteditor';
let neu = /** @type {boolean|null} */ (null);

export function istNeu() {
	if (neu !== null) return neu;
	try {
		const h = typeof location !== 'undefined' ? location.hash : '';
		if (h === '#alt') localStorage.setItem(SCHLUESSEL, '1');
		if (h === '#neu') localStorage.removeItem(SCHLUESSEL);
		neu = localStorage.getItem(SCHLUESSEL) !== '1';
	} catch {
		neu = true;
	}
	return neu;
}
