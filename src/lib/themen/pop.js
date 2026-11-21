// „Pop-Art“-Themen (inspiriert von illustrierten Wimmelbild-Stadtplänen):
// Häuser in zufälligen kräftigen Farben, Freiflächen voller kleiner Symbole.
// Die Straßen werden in Hintergrundfarbe darübergezeichnet und „radieren“
// so helle Wege durch den Symbolteppich.

/** Gleichmäßig verteilte, aber feste Zufallszahl 0–1 aus ganzen Zahlen. @param {number} a @param {number} b @param {number} c */
export function hash3(a, b, c) {
	let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647)) | 0;
	x = Math.imul(x ^ (x >>> 13), 1274126177);
	return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
/** Feste Zufallszahl aus einem Text (z. B. Gebäude-ID). @param {string} s */
export function hashStr(s) {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return hash3(h, 7, 11);
}

/** Kleine Symbole, jeweils um (0,0) mit Radius ≈ 1 */
const SYMBOLS = [
	'M0-1L.87.6H-.87Z', // Baum/Dreieck
	'M0-1L.24-.33L.95-.31L.38.12L.59.81L0 .4L-.59.81L-.38.12L-.95-.31L-.24-.33Z', // Stern
	'M-.75-.75H.75V.75H-.75Z', // Quadrat
	'M0 .9C-.9.2-1-.4-.6-.75C-.3-1 0-.75 0-.5C0-.75.3-1 .6-.75C1-.4.9.2 0 .9Z', // Herz
	'M-.3-1H.3V-.3H1V.3H.3V1H-.3V.3H-1V-.3H-.3Z', // Plus
	'M-.8.8V-.1L0-.9L.8-.1V.8Z', // Haus
	'M0-1A1 1 0 1 1 0 1A1 1 0 1 1 0-1Z', // Kreis
	'M-1 .25H.2V.8L1 0L.2-.8V-.25H-1Z' // Pfeil
];

/** SVG-Definitionen der Symbole (einmal pro Poster) */
export function popDefs() {
	return SYMBOLS.map((d, i) => `<path id="pop${i}" d="${d}"/>`).join('');
}

/**
 * Symbolteppich für den sichtbaren Kartenbereich.
 * @param {number[]} vr sichtbares Rechteck [x0,y0,x1,y1] in Kartenkoordinaten
 * @param {number} z Zoomfaktor der Ansicht
 * @param {string[]} pal Farbpalette
 */
export function popSymbols(vr, z, pal) {
	const sp = 24 / z; // Abstand der Symbole – bleibt auf dem Poster gleich groß
	const r = sp * 0.33;
	const i0 = Math.floor(vr[0] / sp) - 1,
		i1 = Math.ceil(vr[2] / sp) + 1,
		j0 = Math.floor(vr[1] / sp) - 1,
		j1 = Math.ceil(vr[3] / sp) + 1;
	let o = '<g id="symbole">';
	for (let i = i0; i <= i1; i++)
		for (let j = j0; j <= j1; j++) {
			if (hash3(i, j, 1) < 0.2) continue; // ein paar Lücken wirken natürlicher
			const x = (i + 0.5 + (hash3(i, j, 2) - 0.5) * 0.6) * sp;
			const y = (j + 0.5 + (hash3(i, j, 3) - 0.5) * 0.6) * sp;
			const s = Math.floor(hash3(i, j, 4) * SYMBOLS.length);
			const c = pal[Math.floor(hash3(i, j, 5) * pal.length)];
			const rot = Math.round(hash3(i, j, 6) * 360);
			const k = r * (0.75 + hash3(i, j, 7) * 0.45);
			o += `<use href="#pop${s}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot}) scale(${k.toFixed(2)})" fill="${c}"/>`;
		}
	return o + '</g>';
}

/** Häuserfarbe aus der Palette – fest pro Gebäude. @param {string} id @param {string[]} pal */
export function popColor(id, pal) {
	return pal[Math.floor(hashStr(id) * pal.length)];
}
