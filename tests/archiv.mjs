// Friert alle bisherigen Stile, Designs, Motive, Landkarten-Stile und Effekte als Archiv ein:
// static/archiv/archiv.json + Vorschaubilder in static/archiv/<art>/<id>.webp. Die Seite /archiv zeigt sie.
// Eigenständig: funktioniert auch, wenn der alte Code später entfernt wird.
// Aufruf (Internet nötig): npm run build && npm run preview, dann node tests/archiv.mjs [url]
import { chromium } from 'playwright';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { STIL_GRUPPEN, DESIGN_GRUPPEN } from '../src/lib/themen/sammlungen.js';

const URL = process.argv[2] || 'http://localhost:4173/';
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
for (const a of ['stil', 'design', 'motiv', 'landkarte', 'effekt']) mkdirSync(`static/archiv/${a}`, { recursive: true });
cpSync('static/vorschau/stil', 'static/archiv/stil', { recursive: true });
cpSync('static/vorschau/design', 'static/archiv/design', { recursive: true });

const b = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('FEHLER', e.message));
/** Seite frisch mit Bamberg öffnen (jedes Bild unabhängig vom vorigen) */
async function frisch() {
	await p.goto('about:blank');
	await p.evaluate(() => localStorage.removeItem('kartenstudio.entwurf.v1')).catch(() => {});
	await p.goto(URL + '#ort=bamberg');
	await p.waitForSelector('#landing', { state: 'hidden', timeout: 90000 });
	await p.waitForTimeout(3500);
	await p.addStyleTag({ content: `html,body,.stage,.canvas,#canvas{background:transparent!important}#poster{box-shadow:none!important;border-radius:0!important}.poster-tools,.fav-btn,#nlHinweis,.toast,.tour-frage,.update-hinweis{display:none!important}` });
}
await frisch();

/** Knöpfe einer Liste mit Name und Beschreibung auslesen */
const liste = (sel, attr) => p.$$eval(sel, (bs, attr) => bs.map((x) => ({ id: x.dataset[attr], name: (x.querySelector('.nm') || x).textContent.trim(), desc: x.title || '' })), attr);
const gruppe = (G, id) => G.find((g) => g.keys.includes(id)) || { id: '', name: 'ohne Gruppe' };
const stile = (await liste('#wzStyles [data-p]', 'p')).map((s) => ({ ...s, gruppe: gruppe(STIL_GRUPPEN, s.id).name }));
const designs = (await liste('#wzDesigns [data-d]', 'd')).map((s) => ({ ...s, gruppe: gruppe(DESIGN_GRUPPEN, s.id).name }));
const landkarten = await liste('#wzBases [data-b]', 'b');

async function bild(datei) {
	await p.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 8000 }).catch(() => {});
	await p.waitForTimeout(1500);
	const box = await p.locator('#poster').boundingBox();
	const png = await p.screenshot({ clip: box, omitBackground: true });
	const webp = await p.evaluate(async (b64) => {
		const img = new Image();
		img.src = 'data:image/png;base64,' + b64;
		await img.decode();
		const c = document.createElement('canvas');
		c.width = 240;
		c.height = Math.round((240 * img.naturalHeight) / img.naturalWidth);
		const x = c.getContext('2d');
		x.imageSmoothingQuality = 'high';
		x.drawImage(img, 0, 0, c.width, c.height);
		return c.toDataURL('image/webp', 0.8).split(',')[1];
	}, png.toString('base64'));
	writeFileSync(datei, Buffer.from(webp, 'base64'));
}
const klick = (sel) => p.evaluate((sel) => document.querySelector(sel)?.click(), sel);
const schritt = (s) => klick(`#wzSteps [data-step="${s}"]`);
const stil = async (k) => { await schritt('stil'); await klick('#wzMode [data-m="art"]'); await klick(`#wzStyles [data-p="${k}"]`); };
const grund = async () => { await schritt('design'); await klick('#wzDesigns [data-d="poster"]'); await stil('umriss'); };

// Motive (Art des Posters)
const motive = [
	{ id: 'sterne', name: 'Sternenhimmel', desc: 'Der Himmel über dem Ort zu einem Datum und einer Uhrzeit.' },
	{ id: 'koord', name: 'Koordinaten', desc: 'Große Koordinaten mit Ortsname und eigenem Text statt Karte.' },
	{ id: 'wolke', name: 'Wortwolke', desc: 'Eigene Wörter als Wolke in Herz-, Kreis- oder Hausform.' }
];
await grund();
for (const m of motive) {
	await schritt('stil');
	await klick(`#wzMode [data-m="${m.id}"]`);
	await bild(`static/archiv/motiv/${m.id}.webp`);
	console.log('Motiv', m.id);
}
await klick('#wzMode [data-m="art"]');

// Landkarten-Stile (fertige Kartenstile über MapLibre)
await schritt('stil');
await klick('#wzMode [data-m="std"]');
for (const l of landkarten) {
	await klick(`#wzBases [data-b="${l.id}"]`);
	await p.waitForTimeout(3500);
	await bild(`static/archiv/landkarte/${l.id}.webp`);
	console.log('Landkarte', l.id);
}
await klick('#wzMode [data-m="art"]');

// Effekte (Extras) – jeweils einzeln an, Bild, wieder aus
const effekte = [
	{ id: 'papier', name: 'Papier-Struktur', desc: 'Feine Papierstruktur auf farbigem Grund.', stil: 'vintage', an: '#fxPaper' },
	{ id: 'vignette', name: 'Vignette', desc: 'Ränder sanft abgedunkelt.', stil: 'umriss', an: '#fxVig' },
	{ id: 'leuchten', name: 'Leuchten', desc: 'Weiches Leuchten der Straßen auf dunklem Grund.', stil: 'dunkel', an: '#fxGlow' },
	{ id: 'hoehenlinien', name: 'Höhenlinien', desc: 'Höhenlinien aus dem Geländemodell (EU-DEM).', stil: 'vintage', an: '#hoehenOn' },
	{ id: 'relief', name: 'Relief', desc: 'Berge und Täler schattiert.', stil: 'vintage', an: '#fxRelief' },
	{ id: 'schatten', name: 'Häuser-Schatten', desc: 'Häuser werfen Schatten.', stil: 'umriss', an: '#fxSchatten' },
	{ id: 'h3d', name: '3D-Häuser', desc: 'Gebäude als 3D-Körper mit Dächern.', stil: 'umriss', an: '#fxH3d' },
	{ id: 'kipp', name: 'Perspektive (gekippt)', desc: 'Karte nach hinten gekippt mit Dunst am Horizont.', stil: 'umriss', regler: ['#fxKipp', '45', '0'] },
	{ id: 'dreh', name: 'Gedreht', desc: 'Karte gedreht statt Norden oben.', stil: 'umriss', regler: ['#fxDreh', '30', '0'] }
];
for (const e of effekte) {
	await frisch();
	await grund();
	await stil(e.stil);
	await schritt('extras');
	const setze = async (an) => {
		if (e.an) await p.evaluate(([s, an]) => { const i = document.querySelector(s); if (i && i.checked !== an) i.click(); }, [e.an, an]);
		else await p.evaluate(([s, v]) => { const i = document.querySelector(s); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }, [e.regler[0], an ? e.regler[1] : e.regler[2]]);
	};
	await setze(true);
	await p.waitForTimeout(e.id === 'hoehenlinien' || e.id === 'relief' ? 6000 : 1500);
	await bild(`static/archiv/effekt/${e.id}.webp`);
	await setze(false);
	console.log('Effekt', e.id);
}
await b.close();

// Weitere Funktionen ohne Bild (zum Nachlesen)
const funktionen = [
	{ name: 'Markierungen (Pins)', desc: 'Herz, Pin, Stern oder Punkt an beliebige Stellen setzen und verschieben.' },
	{ name: 'Widmung', desc: 'Zusätzliche Textzeile, z. B. Datum oder Spruch.' },
	{ name: 'Route & Wanderung', desc: 'GPS-Datei laden (.gpx/.kml/.tcx/.geojson) oder Strecke entlang der Wege zeichnen.' },
	{ name: 'Mehrere Orte', desc: 'Bis zu 3–4 Orte nebeneinander in Kreisen oder Rechtecken.' },
	{ name: 'Ortsnamen', desc: 'Namen umliegender Orte auf der Karte.' },
	{ name: 'Eigene Form', desc: 'Eigenes Bild oder Buchstabe als Kartenform (Silhouette).' },
	{ name: 'Fokus anpassen / Typografie anpassen', desc: 'Form, Größe und Lage des Farbflecks; Schrift und Stil der großen Buchstaben.' },
	{ name: 'Einzelbearbeitung', desc: 'In den erweiterten Einstellungen Häuser/Straßen einzeln umfärben oder ausblenden.' },
	{ name: 'Anlass-Vorlagen', desc: 'Hochzeit, Geburt, Zuhause, Heimat, Urlaub, Verein (Startseite).' },
	{ name: 'Produkt-Mockups', desc: 'Poster, Rahmen, Leinwand, Alu, Aufsteller, T-Shirt, Tasse in Raumszenen.' }
];
const archiv = {
	stand: new Date().toISOString().slice(0, 10),
	hinweis: 'Eingefroren vor dem Umbau auf den neuen Karteneditor. Vorschaubilder am Beispielort Bamberg.',
	bereiche: [
		{ id: 'stil', titel: 'Farbstile', text: 'Farben der gezeichneten Karte.', eintraege: stile },
		{ id: 'design', titel: 'Designs & Formen', text: 'Aufbau des Posters: Rahmen, Formen, Textanordnung.', eintraege: designs },
		{ id: 'motiv', titel: 'Motive', text: 'Statt einer Karte.', eintraege: motive },
		{ id: 'landkarte', titel: 'Landkarten-Stile', text: 'Fertige Kartenstile (MapLibre/OpenFreeMap).', eintraege: landkarten },
		{ id: 'effekt', titel: 'Effekte', text: 'Extras, die man zuschalten konnte.', eintraege: effekte.map(({ id, name, desc }) => ({ id, name, desc })) }
	],
	funktionen
};
writeFileSync('static/archiv/archiv.json', JSON.stringify(archiv, null, 1));
console.log('Archiv:', archiv.bereiche.map((x) => x.titel + ' ' + x.eintraege.length).join(' · '));
