// Erzeugt die festen Vorschaubilder für Stile und Designs (static/vorschau/stil/<id>.webp, static/vorschau/design/<id>.webp).
// Die App zeigt nur noch diese fertigen Bilder – sie muss dafür nichts mehr berechnen.
// Aufruf (braucht Internet für den Beispielort): npm run build && npm run preview, dann
//   node tests/vorschaubilder.mjs [url]   ·   ORT=bamberg (Beispielort) · NUR=stil|design · ID=<einzelner Schlüssel>
// Nach neuen Stilen/Designs einfach erneut ausführen (der Rauchtest prüft, dass zu jedem ein Bild da ist).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const URL = process.argv[2] || 'http://localhost:4173/';
const ORT = process.env.ORT || 'bamberg';
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const b = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('FEHLER', e.message));
await p.goto(URL + '#ort=' + ORT);
await p.reload();
await p.waitForSelector('#landing', { state: 'hidden', timeout: 90000 });
await p.waitForTimeout(4000);
// Nur das Poster, ohne Werkzeuge, Schatten und Hintergrund (Ecken bleiben durchsichtig)
await p.addStyleTag({
	content: `html,body,.stage,.canvas,#canvas{background:transparent!important}#poster{box-shadow:none!important;border-radius:0!important}.poster-tools,.fav-btn,#nlHinweis,.toast,.tour-frage{display:none!important}`
});

/** Bildschirmfoto (PNG) → WebP in gewünschter Breite, im Browser umgerechnet */
async function speichern(png, datei, breite) {
	const webp = await p.evaluate(
		async ([b64, breite]) => {
			const img = new Image();
			img.src = 'data:image/png;base64,' + b64;
			await img.decode();
			const c = document.createElement('canvas');
			c.width = breite;
			c.height = Math.round((breite * img.naturalHeight) / img.naturalWidth);
			const x = c.getContext('2d');
			x.imageSmoothingQuality = 'high';
			x.drawImage(img, 0, 0, c.width, c.height);
			return c.toDataURL('image/webp', 0.8).split(',')[1];
		},
		[png.toString('base64'), breite]
	);
	writeFileSync(datei, Buffer.from(webp, 'base64'));
}
const ruhe = () => p.waitForFunction(() => document.fonts.status === 'loaded').then(() => p.waitForTimeout(900));
const nur = process.env.NUR;
const id = process.env.ID;

if (!nur || nur === 'stil') {
	mkdirSync('static/vorschau/stil', { recursive: true });
	await p.evaluate(() => document.querySelector('#wzSteps [data-step="design"]').click());
	await p.evaluate(() => document.querySelector('#wzDesigns [data-d="poster"]').click());
	await p.evaluate(() => document.querySelector('#wzSteps [data-step="stil"]').click());
	const stile = id ? [id] : await p.$$eval('#wzStyles [data-p]', (b) => b.map((x) => x.dataset.p));
	for (const k of stile) {
		await p.evaluate((k) => document.querySelector(`#wzStyles [data-p="${k}"]`).click(), k);
		await ruhe();
		if (k === 'popart' || k === 'konfetti' || k === 'wimmel') await p.waitForTimeout(1500);
		// quadratischer Ausschnitt aus der Kartenmitte
		const box = await p.locator('#poster').boundingBox();
		const s = box.width * 0.62;
		const png = await p.screenshot({ clip: { x: box.x + (box.width - s) / 2, y: box.y + box.width * 0.1, width: s, height: s } });
		await speichern(png, `static/vorschau/stil/${k}.webp`, 240);
		console.log('Stil', k);
	}
}
if (!nur || nur === 'design') {
	mkdirSync('static/vorschau/design', { recursive: true });
	// Designs in einem ruhigen Standard-Look zeigen
	await p.evaluate(() => document.querySelector('#wzSteps [data-step="stil"]').click());
	await p.evaluate(() => document.querySelector('#wzStyles [data-p="umriss"]').click());
	await ruhe();
	await p.evaluate(() => document.querySelector('#wzSteps [data-step="design"]').click());
	const designs = id ? [id] : await p.$$eval('#wzDesigns [data-d]', (b) => b.map((x) => x.dataset.d));
	for (const k of designs) {
		await p.evaluate((k) => document.querySelector(`#wzDesigns [data-d="${k}"]`).click(), k);
		await ruhe();
		const box = await p.locator('#poster').boundingBox();
		const png = await p.screenshot({ clip: box, omitBackground: true });
		await speichern(png, `static/vorschau/design/${k}.webp`, 240);
		console.log('Design', k);
	}
}
await b.close();
