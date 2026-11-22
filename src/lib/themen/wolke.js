// Wortwolke: Namen, Daten und Wörter füllen eine Form (Herz, Kreis, Haus, Rechteck).
// Wichtige Wörter (mit * markiert) werden groß, alle Wörter wiederholen sich kleiner, bis die Form voll ist.
// Platzierung: Spirale von der Mitte nach außen, jedes Wort braucht freien Platz und muss ganz in der Form liegen.

/** @param {string} s */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Formen als Test „liegt der Punkt (0–1, 0–1) innen?“ */
const FORMEN = {
	rechteck: () => true,
	kreis: (/** @type {number} */ x, /** @type {number} */ y) => (x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25,
	herz: (/** @type {number} */ x, /** @type {number} */ y) => {
		// Zwei Bögen oben + Spitze unten (deutlich erkennbare Herzform)
		const r = 0.255;
		if ((x - 0.27) ** 2 + (y - 0.3) ** 2 <= r * r || (x - 0.73) ** 2 + (y - 0.3) ** 2 <= r * r) return true;
		if (y < 0.33 || y > 0.97) return false;
		const halb = 0.495 * (0.97 - y) / 0.64; // Breite des Dreiecks nach unten zur Spitze
		return Math.abs(x - 0.5) <= halb;
	},
	haus: (/** @type {number} */ x, /** @type {number} */ y) => (y >= 0.4 ? x >= 0.04 && x <= 0.96 : y >= 0.02 && Math.abs(x - 0.5) <= (y - 0.02) * 1.25)
};
export const WOLKE_FORMEN = { herz: 'Herz', kreis: 'Kreis', haus: 'Haus', rechteck: 'Rechteck' };

/** @type {CanvasRenderingContext2D|null} */
let ctx = null;
/** @param {string} t @param {string} f @param {number} s */
function breite(t, f, s) {
	if (!ctx) ctx = /** @type {CanvasRenderingContext2D} */ (document.createElement('canvas').getContext('2d'));
	ctx.font = `${s}px ${f}`;
	return ctx.measureText(t).width;
}

/** kleiner fester Zufall, damit die Wolke bei jedem Zeichnen gleich aussieht @param {number} seed */
function zufall(seed) {
	let s = seed || 1;
	return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Wörter aus dem Textfeld: „Emil*, 11.02.2025*, Liebe, Mama“ @param {string} txt */
export function woerter(txt) {
	return String(txt || '')
		.split(/[,\n;]+/)
		.map((w) => w.trim())
		.filter(Boolean)
		.slice(0, 60)
		.map((w) => ({ t: w.replace(/\*+$/, '').trim().slice(0, 30), wichtig: /\*$/.test(w) }))
		.filter((w) => w.t);
}

const CACHE = new Map();

/**
 * Wortwolke in eine Fläche W × H zeichnen.
 * @param {{text:string, form:string, farben:string[], schrift?:boolean, bg?:string}} o
 * @param {number} W @param {number} H
 */
export function wolkeSVG(o, W, H) {
	// Schrift-Ladezustand gehört zum Schlüssel: vor dem Laden gemessen = falsche Breiten
	let bereit = '';
	try {
		bereit = ['SgXB', 'SgMD', 'SgSC'].map((f) => document.fonts.check('30px ' + f)).join('');
	} catch (e) {}
	const key = JSON.stringify([o, W.toFixed(0), H.toFixed(0), bereit]);
	if (CACHE.has(key)) return CACHE.get(key);
	const liste = woerter(o.text);
	const innen = /** @type {Record<string, (x:number,y:number)=>boolean>} */ (FORMEN)[o.form] || FORMEN.herz;
	// Form mittig, quadratisch (Rechteck nutzt die ganze Fläche)
	const rand = W * 0.06;
	const fw = o.form === 'rechteck' ? W - 2 * rand : Math.min(W, H) - 2 * rand;
	const fh = o.form === 'rechteck' ? H - 2 * rand : fw;
	const ox = (W - fw) / 2,
		oy = (H - fh) / 2;
	const drin = (/** @type {number} */ x, /** @type {number} */ y) => innen((x - ox) / fw, (y - oy) / fh);
	/** @type {{x:number,y:number,w:number,h:number}[]} */
	const belegt = [];
	const frei = (/** @type {{x:number,y:number,w:number,h:number}} */ r) => {
		for (const b of belegt) if (r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y) return false;
		return true;
	};
	const passt = (/** @type {{x:number,y:number,w:number,h:number}} */ r) =>
		drin(r.x, r.y) && drin(r.x + r.w, r.y) && drin(r.x, r.y + r.h) && drin(r.x + r.w, r.y + r.h) && drin(r.x + r.w / 2, r.y + r.h / 2);
	const rnd = zufall(liste.reduce((s, w) => s + w.t.length * 31, 7));
	let out = '';
	if (!liste.length) {
		CACHE.set(key, out);
		return out;
	}
	const farben = o.farben.length ? o.farben : ['#262c3a'];
	/** Ein Wort setzen; gibt false zurück, wenn kein Platz mehr @param {string} t @param {number} size @param {string} font @param {boolean} senkrecht @param {number} n */
	const setze = (t, size, font, senkrecht, n) => {
		const w = breite(t, font, size) + size * 0.18,
			h = size * (font === 'SgSC' ? 1.0 : 0.82);
		const bw = senkrecht ? h : w,
			bh = senkrecht ? w : h;
		const cx = ox + fw / 2,
			cy = oy + fh * (o.form === 'herz' ? 0.48 : 0.5);
		// Große Wörter: Spirale von der Mitte aus. Kleine Füllwörter: zufällige freie Stellen in der ganzen Form,
		// damit auch Spitzen und Ränder (z. B. die Herzspitze) gefüllt werden.
		const start = rnd() * Math.PI * 2;
		const fuell = size < fw * 0.04;
		const versuche = fuell ? 260 : 2600;
		for (let a = 0; a < versuche; a++) {
			let x, y;
			if (fuell) {
				x = ox + rnd() * (fw - bw);
				y = oy + rnd() * (fh - bh);
			} else {
				const ang = start + a * 0.25;
				const rad = fw * 0.011 * Math.sqrt(a);
				x = cx + Math.cos(ang) * rad - bw / 2;
				y = cy + Math.sin(ang) * rad * (fh / fw) - bh / 2;
			}
			const r = { x, y, w: bw, h: bh };
			if (!passt(r) || !frei(r)) continue;
			belegt.push(r);
			const col = farben[n % farben.length];
			const base = senkrecht ? `translate(${(x + bw * 0.78).toFixed(1)},${(y + bh).toFixed(1)}) rotate(-90)` : `translate(${x.toFixed(1)},${(y + h * (font === 'SgSC' ? 0.74 : 0.86)).toFixed(1)})`;
			out += `<text transform="${base}" ${senkrecht ? 'x="' + (size * 0.09).toFixed(1) + '"' : 'x="' + (size * 0.09).toFixed(1) + '"'} font-family="${font}" font-size="${size.toFixed(1)}" fill="${col}">${esc(t)}</text>`;
			return true;
		}
		return false;
	};
	const ref = fw;
	// 1. wichtige Wörter groß, die anderen mittel
	let n = 0;
	const sortiert = [...liste].sort((a, b) => Number(b.wichtig) - Number(a.wichtig));
	sortiert.forEach((w) => {
		const gross = w.wichtig ? ref * 0.11 : ref * 0.055;
		const font = w.wichtig ? 'SgXB' : o.schrift && n % 3 === 1 ? 'SgSC' : 'SgMD';
		let s = gross;
		while (s > ref * 0.02 && !setze(w.t, s, font, false, n)) s *= 0.85;
		n++;
	});
	// 2. auffüllen: Wörter wiederholt, kleiner werdend, teils senkrecht
	let fehl = 0,
		i = 0;
	const groessen = [0.045, 0.036, 0.029, 0.023, 0.018, 0.014];
	for (let stufe = 0; stufe < groessen.length; stufe++) {
		fehl = 0;
		while (fehl < Math.max(12, liste.length * 3) && belegt.length < 700) {
			const w = liste[i++ % liste.length];
			const font = o.schrift && i % 4 === 0 ? 'SgSC' : i % 5 === 0 ? 'SgXB' : 'SgMD';
			const s = ref * groessen[stufe] * (0.85 + rnd() * 0.3);
			if (!setze(w.t, s, font, rnd() < 0.28, i)) fehl++;
		}
	}
	out = `<g id="wortwolke">${out}</g>`;
	if (CACHE.size > 40) CACHE.clear();
	CACHE.set(key, out);
	return out;
}

/** Beispielwörter für den Start @param {string} ort @param {string} region */
export function wolkeBeispiel(ort, region) {
	return [ort + '*', region, 'Heimat', 'Zuhause', 'Familie', 'Liebe', 'Freunde', 'Kirchweih', 'Sommer', 'Lachen', 'Glück', 'Kindheit', 'Erinnerungen', 'Herz'].filter(Boolean).join(', ');
}
