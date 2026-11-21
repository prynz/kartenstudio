// Fertige Poster-Designs (Aufbau/Rahmen) – unabhängig vom Farbthema.
// Ein Farbthema (vorlagen.js) bestimmt die Farben, ein Design bestimmt,
// wie Rahmen, Karte und Text angeordnet sind. Beides ist frei kombinierbar.

/**
 * @typedef {'bar'|'below'|'top'|'over'} LayKind
 * @typedef {{
 *   kind: LayKind,      // bar: Text im Farbbalken unten · below: Text frei unter der Karte · top: Text über der Karte · over: Text über der Karte gelegt
 *   textPad: number,    // Luft über und unter dem Textblock (below/top)
 *   inner: number,      // Stärke einer feinen Linie direkt um die Karte (0 = keine)
 *   innerGap: number,   // Abstand dieser Linie zur Karte
 *   shape: 'rect'|'circle',
 *   coords: boolean,    // zusätzliche Zeile mit Koordinaten
 *   fade: boolean       // (over) weicher Verlauf hinter dem Text
 * }} Lay
 * @typedef {{
 *   name: string, desc: string,
 *   frame: {w:number, r:number, pad:number},
 *   bar?: boolean,
 *   lay: Partial<Lay>,
 *   title?: {size?:number, ls?:number},
 *   sub?: {size?:number, ls?:number},
 *   aspect?: number
 * }} Design
 */

/** @type {Lay} */
export const LAY_DEFAULT = { kind: 'bar', textPad: 0, inner: 0, innerGap: 0, shape: 'rect', coords: false, fade: false };

/** @type {Record<string, Design>} */
export const DESIGNS = {
	siegritz: {
		name: 'Siegritz',
		desc: 'Kräftiger, abgerundeter Rahmen mit farbigem Textbalken – das Ursprungsdesign.',
		frame: { w: 16, r: 48, pad: 14 },
		bar: true,
		lay: { kind: 'bar' },
		title: { size: 72, ls: 14 },
		sub: { size: 38, ls: 1 }
	},
	galerie: {
		name: 'Galerie',
		desc: 'Feiner Rahmen, viel Luft, der Titel steht frei unter der Karte.',
		frame: { w: 3, r: 0, pad: 26 },
		lay: { kind: 'below', textPad: 44 },
		title: { size: 66, ls: 22 },
		sub: { size: 34, ls: 1 }
	},
	passepartout: {
		name: 'Passepartout',
		desc: 'Breiter heller Rand mit feiner Linie um die Karte – wie gerahmt.',
		frame: { w: 2, r: 0, pad: 64 },
		lay: { kind: 'below', textPad: 46, inner: 2, innerGap: 10 },
		title: { size: 58, ls: 20 },
		sub: { size: 30, ls: 1 }
	},
	doppel: {
		name: 'Doppelrahmen',
		desc: 'Zwei Linien – klassisch und elegant.',
		frame: { w: 9, r: 0, pad: 24 },
		lay: { kind: 'below', textPad: 40, inner: 2.5, innerGap: 12 },
		title: { size: 64, ls: 16 },
		sub: { size: 34, ls: 1 }
	},
	polaroid: {
		name: 'Polaroid',
		desc: 'Gleichmäßiger Rand, unten breit für den Text – wie ein Sofortbild.',
		frame: { w: 0, r: 10, pad: 36 },
		lay: { kind: 'below', textPad: 64 },
		title: { size: 62, ls: 12 },
		sub: { size: 34, ls: 1 }
	},
	kreis: {
		name: 'Kreis',
		desc: 'Die Karte als runder Ausschnitt, Text darunter.',
		frame: { w: 0, r: 0, pad: 48 },
		lay: { kind: 'below', textPad: 42, shape: 'circle', inner: 3, innerGap: 12 },
		title: { size: 66, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1
	},
	randlos: {
		name: 'Randlos',
		desc: 'Die Karte füllt alles, der Text schwebt mit sanftem Verlauf darüber.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true },
		title: { size: 76, ls: 16 },
		sub: { size: 38, ls: 1 }
	},
	oben: {
		name: 'Text oben',
		desc: 'Der Titel steht über der Karte – wie ein Zeitungskopf.',
		frame: { w: 4, r: 0, pad: 24 },
		lay: { kind: 'top', textPad: 40 },
		title: { size: 70, ls: 18 },
		sub: { size: 34, ls: 1 }
	},
	koordinaten: {
		name: 'Mit Koordinaten',
		desc: 'Schlanker Rahmen, Balken mit Ort, Region und Koordinaten.',
		frame: { w: 8, r: 0, pad: 12 },
		bar: true,
		lay: { kind: 'bar', coords: true },
		title: { size: 68, ls: 16 },
		sub: { size: 34, ls: 1 }
	}
};

/** Helligkeit einer Farbe (0 = schwarz, 1 = weiß). @param {string} c */
export function lum(c) {
	if (!c || c === 'none') return 1;
	let h = c.replace('#', '');
	if (h.length === 3) h = [...h].map((x) => x + x).join('');
	const n = parseInt(h.slice(0, 6), 16);
	if (Number.isNaN(n)) return 1;
	const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/**
 * Schriftfarbe für Text, der nicht im Balken steht, sondern auf dem Papier/der Karte.
 * Nimmt eine passende Farbe aus dem Thema, damit es stimmig bleibt.
 * @param {any} S Editor-Zustand
 */
export function inkColor(S) {
	const paper = S.bg === 'none' ? '#ffffff' : S.bg;
	const dark = [S.bar && S.bar.color, S.frame && S.frame.color, S.cls && S.cls.haupt && S.cls.haupt.s, '#1b1f2a'];
	const light = [S.title && S.title.color, S.frame && S.frame.color, '#ffffff'];
	if (lum(paper) > 0.4) return dark.find((c) => c && c !== 'none' && lum(c) < 0.18) || '#1b1f2a';
	return light.find((c) => c && c !== 'none' && lum(c) > 0.6) || '#ffffff';
}

/**
 * Design auf einen Zustand anwenden.
 * @param {any} S Editor-Zustand (wird verändert)
 * @param {string} key Design-Schlüssel
 * @param {{text:string}} preset aktives Farbthema (für die Schriftfarbe im Balken)
 * @param {boolean} [full] true = auch Schriftgrößen des Designs übernehmen (bei bewusster Auswahl)
 */
export function applyDesign(S, key, preset, full) {
	const D = DESIGNS[key] || DESIGNS.siegritz;
	S.design = DESIGNS[key] ? key : 'siegritz';
	S.lay = { ...LAY_DEFAULT, ...D.lay };
	S.frame = { ...S.frame, ...D.frame };
	S.bar.on = !!D.bar;
	if (full) {
		if (D.title) Object.assign(S.title, D.title);
		if (D.sub) Object.assign(S.sub, D.sub);
		S.bar.auto = true;
	}
	if (S.lay.kind === 'bar') {
		S.title.color = preset.text;
		S.sub.color = preset.text;
	} else {
		const ink = inkColor({ ...S, title: { ...S.title, color: preset.text } });
		S.title.color = ink;
		S.sub.color = ink;
	}
}
