// Fertige Poster-Designs (Aufbau/Rahmen) – unabhängig vom Farbthema.
// Ein Farbthema (vorlagen.js) bestimmt die Farben, ein Design bestimmt,
// wie Rahmen, Karte und Text angeordnet sind. Beides ist frei kombinierbar.

/**
 * @typedef {'bar'|'bartop'|'below'|'top'|'over'|'typo'|'steckbrief'|'kasten'} LayKind
 * @typedef {{
 *   kind: LayKind,      // + bartop: Farbbalken oben
 *   rule?: boolean,     // Zierlinie zwischen Titel und Untertitel      // bar: Text im Farbbalken unten · below: Text frei unter der Karte · top: Text über der Karte · over: Text über der Karte gelegt
 *   textPad: number,    // Luft über und unter dem Textblock (below/top)
 *   inner: number,      // Stärke einer feinen Linie direkt um die Karte (0 = keine)
 *   innerGap: number,   // Abstand dieser Linie zur Karte
 *   shape: 'rect'|'circle'|'heart'|'hex'|'arch'|'rounded'|'house',
 *   coords: boolean,    // zusätzliche Zeile mit Koordinaten
 *   fade: boolean,      // (over) weicher Verlauf hinter dem Text
 *   papier?: string,    // eigene Papierfarbe außerhalb der Karte (Karte behält die Themenfarbe)
 *   foot?: 'tabelle',   // Info-Leiste mit 4 Feldern unter der Karte
 *   fokus?: number,     // farbige Fläche unter den Straßen (Radius relativ zur Karte)
 *   lupe?: number,      // hervorgehobener Kreis, außen gedämpft (Radius relativ zur Karte)
 *   lupeStrich?: boolean, gitter?: boolean, kompass?: boolean|'unten',
 *   bezirk?: boolean, absatz?: boolean, ohneSub?: boolean, koordFarbe?: string
 * }} Lay
 * @typedef {{
 *   name: string, desc: string,
 *   frame: {w:number, r:number, pad:number},
 *   bar?: boolean,
 *   lay: Partial<Lay>,
 *   title?: {size?:number, ls?:number, font?:string},
 *   sub?: {size?:number, ls?:number},
 *   aspect?: number,
 *   gap?: number        // Abstand Titel–Untertitel
 * }} Design
 */

/** @type {Lay} */
export const LAY_DEFAULT = { kind: 'bar', textPad: 0, inner: 0, innerGap: 0, shape: 'rect', coords: false, fade: false, rule: false };

/** @type {Record<string, Design>} */
export const DESIGNS = {
	poster: {
		name: 'Poster',
		desc: 'Das reine Poster: Karte mit weißem Rand, Titel darunter – ohne Rahmen. Rahmen und Formen wählst du danach.',
		frame: { w: 0, r: 0, pad: 34 },
		lay: { kind: 'below', textPad: 58 },
		title: { size: 64, ls: 18 },
		sub: { size: 32, ls: 1 }
	},
	siegritz: {
		name: 'Siegritz',
		desc: 'Kräftiger, abgerundeter Rahmen mit farbigem Textbalken – das Ursprungsdesign.',
		frame: { w: 16, r: 48, pad: 14 },
		bar: true,
		lay: { kind: 'bar' },
		title: { size: 72, ls: 14 },
		sub: { size: 38, ls: 1 }
	},
	klassisch: {
		name: 'Klassisch',
		desc: 'Schlanker, eckiger Rahmen mit Textbalken – zeitlos.',
		frame: { w: 6, r: 0, pad: 10 },
		bar: true,
		lay: { kind: 'bar' },
		title: { size: 72, ls: 16 },
		sub: { size: 36, ls: 1 }
	},
	balkenoben: {
		name: 'Balken oben',
		desc: 'Farbiger Kopfbalken mit dem Ortsnamen, Karte darunter.',
		frame: { w: 10, r: 28, pad: 12 },
		lay: { kind: 'bartop' },
		title: { size: 70, ls: 16 },
		sub: { size: 36, ls: 1 }
	},
	koordinaten: {
		name: 'Mit Koordinaten',
		desc: 'Schlanker Rahmen, Balken mit Ort, Region und Koordinaten.',
		frame: { w: 8, r: 0, pad: 12 },
		bar: true,
		lay: { kind: 'bar', coords: true },
		title: { size: 68, ls: 16 },
		sub: { size: 34, ls: 1 }
	},
	galerie: {
		name: 'Galerie',
		desc: 'Feiner Rahmen, viel Luft, der Titel steht frei unter der Karte.',
		frame: { w: 3, r: 0, pad: 26 },
		lay: { kind: 'below', textPad: 44 },
		title: { size: 66, ls: 22 },
		sub: { size: 34, ls: 1 }
	},
	minimal: {
		name: 'Minimal',
		desc: 'Ohne Rahmen, viel Weißraum, zurückhaltende Schrift.',
		frame: { w: 0, r: 0, pad: 40 },
		lay: { kind: 'below', textPad: 52 },
		title: { size: 48, ls: 28 },
		sub: { size: 28, ls: 2 }
	},
	linie: {
		name: 'Elegant',
		desc: 'Feiner Rahmen, Titel und Untertitel durch eine Zierlinie getrennt.',
		frame: { w: 1.5, r: 0, pad: 32 },
		lay: { kind: 'below', textPad: 50, rule: true },
		title: { size: 60, ls: 24 },
		sub: { size: 32, ls: 1 },
		gap: 50
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
	breit: {
		name: 'Breiter Rahmen',
		desc: 'Kräftiger, farbiger Rahmen wie bei einem Bilderrahmen.',
		frame: { w: 34, r: 0, pad: 0 },
		lay: { kind: 'below', textPad: 42 },
		title: { size: 66, ls: 18 },
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
	abgerundet: {
		name: 'Abgerundet',
		desc: 'Karte mit weichen Ecken auf hellem Grund, ohne Rahmen.',
		frame: { w: 0, r: 0, pad: 34 },
		lay: { kind: 'below', textPad: 46, shape: 'rounded' },
		title: { size: 64, ls: 18 },
		sub: { size: 34, ls: 1 }
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
	kreis: {
		name: 'Kreis',
		desc: 'Die Karte als runder Ausschnitt, Text darunter.',
		frame: { w: 0, r: 0, pad: 48 },
		lay: { kind: 'below', textPad: 42, shape: 'circle', inner: 3, innerGap: 12 },
		title: { size: 66, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1
	},
	bogen: {
		name: 'Bogenfenster',
		desc: 'Die Karte als Bogen – wie ein Blick durchs Fenster.',
		frame: { w: 0, r: 0, pad: 46 },
		lay: { kind: 'below', textPad: 44, shape: 'arch', inner: 2.5, innerGap: 12 },
		title: { size: 64, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1.25
	},
	sechseck: {
		name: 'Sechseck',
		desc: 'Die Karte als Sechseck ausgeschnitten.',
		frame: { w: 0, r: 0, pad: 46 },
		lay: { kind: 'below', textPad: 40, shape: 'hex', inner: 3, innerGap: 12 },
		title: { size: 64, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1.1547
	},
	herz: {
		name: 'Herz',
		desc: 'Dein Ort in Herzform – ideal als Geschenk.',
		frame: { w: 0, r: 0, pad: 46 },
		lay: { kind: 'below', textPad: 36, shape: 'heart', inner: 3, innerGap: 12 },
		title: { size: 64, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1
	},
	rund: {
		name: 'Runder Rahmen',
		desc: 'Kräftiger, stark abgerundeter Rahmen, Text frei darunter.',
		frame: { w: 22, r: 64, pad: 20 },
		lay: { kind: 'below', textPad: 40 },
		title: { size: 66, ls: 16 },
		sub: { size: 34, ls: 1 }
	},
	galeriekoord: {
		name: 'Galerie + Koordinaten',
		desc: 'Feiner Rahmen, Ortsname und Koordinaten unter der Karte.',
		frame: { w: 3, r: 0, pad: 26 },
		lay: { kind: 'below', textPad: 44, coords: true },
		title: { size: 62, ls: 22 },
		sub: { size: 32, ls: 1 }
	},
	kreiskoord: {
		name: 'Kreis + Koordinaten',
		desc: 'Runder Ausschnitt mit Ortsname und Koordinaten.',
		frame: { w: 0, r: 0, pad: 48 },
		lay: { kind: 'below', textPad: 40, shape: 'circle', inner: 3, innerGap: 12, coords: true },
		title: { size: 62, ls: 18 },
		sub: { size: 32, ls: 1 },
		aspect: 1
	},
	haus: {
		name: 'Haus',
		desc: 'Karte in Hausform – ideal zum Einzug oder fürs Eigenheim.',
		frame: { w: 0, r: 0, pad: 46 },
		lay: { kind: 'below', textPad: 36, shape: 'house', inner: 3, innerGap: 12 },
		title: { size: 64, ls: 18 },
		sub: { size: 34, ls: 1 },
		aspect: 1
	},
	typo: {
		name: 'Typografie',
		desc: 'Riesige Buchstaben über der ganzen Karte – modern und plakativ.',
		frame: { w: 0, r: 0, pad: 34 },
		lay: { kind: 'typo', coords: true },
		title: { size: 72, ls: 0 },
		sub: { size: 30, ls: 2 },
		aspect: 1.33
	},
	// ---------- Nach Vorbildern aus Grafikdesign & Kartenkunst (siehe themen/layouts.js) ----------
	fokus: {
		name: 'Fokus',
		desc: 'Farbiger Fleck mitten im Ort – die Straßen schneiden ihn in Blöcke. Titel in Pinselschrift.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true, fokus: 0.33 },
		title: { size: 132, ls: 2, font: 'SgBR' },
		sub: { size: 28, ls: 4 }
	},
	studie: {
		name: 'Studie',
		desc: 'Kartenkreis auf weißem Papier, kleiner Titel oben, unten eine Info-Leiste mit Koordinaten, Legende und Maßstab.',
		frame: { w: 0, r: 0, pad: 70 },
		lay: { kind: 'top', textPad: 66, shape: 'circle', papier: '#ffffff', foot: 'tabelle' },
		title: { size: 40, ls: 18, font: 'SgMD' },
		sub: { size: 30, ls: 1 },
		aspect: 1
	},
	steckbrief: {
		name: 'Steckbrief',
		desc: 'Wie eine Sammelserie: Kopfzeile, großer Kartenkreis, Titel links, Nordpfeil und Fakten zum Ort.',
		frame: { w: 0, r: 0, pad: 52 },
		lay: { kind: 'steckbrief', shape: 'circle', inner: 2.5, innerGap: 0 },
		title: { size: 132, ls: 1 },
		sub: { size: 34, ls: 1 },
		aspect: 1
	},
	kasten: {
		name: 'Kasten',
		desc: 'Die Karte füllt alles, in der Mitte ein Textraster mit Titel, Koordinaten und Widmung – wie ein Festivalplakat.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'kasten' },
		title: { size: 72, ls: 4 },
		sub: { size: 34, ls: 1 }
	},
	nachtstadt: {
		name: 'Schwebend',
		desc: 'Randlose Karte, gesperrter Titel mit Linie, darunter Region und Koordinaten – ideal für dunkle Stile.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true, rule: true, coords: true },
		title: { size: 80, ls: 34 },
		sub: { size: 30, ls: 2 },
		gap: 48
	},
	lupe: {
		name: 'Lupe',
		desc: 'Ein Kreis hebt das Herz des Ortes hervor, ringsum wird die Karte blasser.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true, lupe: 0.4 },
		title: { size: 70, ls: 20 },
		sub: { size: 32, ls: 1 }
	},
	dossier: {
		name: 'Dossier',
		desc: 'Gestrichelter Kreis, feines Gitter und gesperrter Titel – wie eine Einsatzkarte.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true, lupe: 0.4, lupeStrich: true, gitter: true, coords: true, kompass: true },
		title: { size: 74, ls: 42 },
		sub: { size: 28, ls: 2 }
	},
	einsatz: {
		name: 'Einsatzkarte',
		desc: 'Originalgetreu nach dem Dharavi-Plakat: gestrichelter Kreis, ein rot markiertes Viertel mit Route und Nadel, Gitter, Text oben, Kompass unten.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true, lupe: 0.42, lupeStrich: true, gitter: true, coords: true, kompass: 'unten', bezirk: true, absatz: true, ohneSub: true, koordFarbe: '#a4a4aa' },
		title: { size: 72, ls: 46 },
		sub: { size: 28, ls: 2 },
		aspect: 1.38
	},
	leise: {
		name: 'Leise',
		desc: 'Nur die Karte – randlos, mit kleinem Ortsnamen ganz unten.',
		frame: { w: 0, r: 0, pad: 0 },
		lay: { kind: 'over', fade: true },
		title: { size: 40, ls: 8 },
		sub: { size: 22, ls: 2 }
	},
	bogenlinie: {
		name: 'Bogen elegant',
		desc: 'Bogenfenster mit feiner Zierlinie zwischen Titel und Untertitel.',
		frame: { w: 1.5, r: 0, pad: 40 },
		lay: { kind: 'below', textPad: 46, shape: 'arch', inner: 1.5, innerGap: 10, rule: true },
		title: { size: 58, ls: 22 },
		sub: { size: 30, ls: 1 },
		gap: 46,
		aspect: 1.25
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
	const eigen = S.lay && S.lay.papier;
	const paper = eigen || (S.bg === 'none' ? '#ffffff' : S.bg);
	// Eigenes Papier um eine dunkle Karte: Schrift in der Kartenfarbe (wie Siebdruck in einer Farbe)
	const dark = [eigen && S.bg, S.bar && S.bar.color, S.frame && S.frame.color, S.cls && S.cls.haupt && S.cls.haupt.s, '#1b1f2a'];
	const light = [S.title && S.title.color, S.frame && S.frame.color, '#ffffff'];
	if (lum(paper) > 0.4) return dark.find((c) => c && c !== 'none' && lum(c) < 0.18) || '#1b1f2a';
	// Dunkles Papier: Themen-Schriftfarbe, wenn sie hell genug ist oder kräftig absticht (Gold, Neon …)
	const k = (/** @type {string} */ c) => (Math.max(lum(c), lum(paper)) + 0.05) / (Math.min(lum(c), lum(paper)) + 0.05);
	return light.find((c, i) => c && c !== 'none' && (lum(c) > 0.6 || (i === 0 && k(c) >= 4.5))) || '#ffffff';
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
		// Schrift, die ein Design mitbringt (z. B. Pinsel bei „Fokus“), beim Wechsel wieder zurücksetzen
		if (S.title.fontDesign && !(D.title && D.title.font)) S.title.font = 'SgXB';
		// Hatte ein Design den Titel in normale Schreibweise gesetzt (Pinsel), wieder in Großbuchstaben
		if (S.title.klein && !(D.title && D.title.font === 'SgBR')) {
			S.title.text = (S.title.text || '').toUpperCase();
			S.title.klein = false;
		}
		S.title.fontDesign = !!(D.title && D.title.font);
		if (D.title) Object.assign(S.title, D.title);
		// Pinselschrift wirkt in normaler Schreibweise („Bamberg“ statt „BAMBERG“)
		const t = S.title.text || '';
		if (S.title.font === 'SgBR' && t === t.toUpperCase() && (S.title.klein = true)) S.title.text = t.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (/** @type {string} */ m, /** @type {string} */ a, /** @type {string} */ c) => a + c.toUpperCase());
		if (D.sub) Object.assign(S.sub, D.sub);
		S.bar.auto = true;
	}
	if (full) S.bar.gap = D.gap ?? 20;
	if (S.lay.kind === 'bar' || S.lay.kind === 'bartop') {
		S.title.color = preset.text;
		S.sub.color = preset.text;
	} else {
		// Themen mit eigener Schriftfarbe fürs Papier (Gold, Neon …), wenn sie dort gut lesbar ist
		const paper = (S.lay && S.lay.papier) || (S.bg === 'none' ? '#ffffff' : S.bg);
		const p = /** @type {any} */ (preset);
		const ok = p.ink && (Math.max(lum(p.ink), lum(paper)) + 0.05) / (Math.min(lum(p.ink), lum(paper)) + 0.05) >= 3;
		const ink = ok ? p.ink : inkColor({ ...S, title: { ...S.title, color: preset.text } });
		S.title.color = ink;
		S.sub.color = ink;
	}
}
