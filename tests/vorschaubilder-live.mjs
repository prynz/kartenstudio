// Vorschaubilder der Kartenstile des neuen Editors erzeugen (static/vorschau/live/<id>.webp).
// Vorher: npm run build && npm run preview
// Aufruf: node tests/vorschaubilder-live.mjs [url]   (ID=<stil> nur einer, ORT=<Suche>, POSTER=1 zusätzlich ganze Poster nach test-output/)
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:4173/';
const ORT = process.env.ORT || 'Bamberg';
const ZIEL = 'static/vorschau/live';
fs.mkdirSync(ZIEL, { recursive: true });
fs.mkdirSync('test-output', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('Fehler:', e.message));
await page.goto(URL);
await page.fill('#lq', ORT);
await page.click('#lgo');
await page.waitForSelector('#lresults button', { timeout: 30000 });
await page.click('#lresults button');
await page.waitForSelector('#liveKarte canvas', { timeout: 60000 });
await page.click('#wzSteps button[data-step="stil"]');
// etwas hineinzoomen, damit Häuser und Straßen gut zu sehen sind
await page.evaluate(() => document.querySelector('#wzUmfang [data-z="kern"]')?.click());
await page.waitForTimeout(800);
{
	const p = await page.locator('#poster').boundingBox();
	if (p) {
		await page.mouse.move(p.x + p.width / 2, p.y + p.height * 0.42);
		for (let i = 0; i < Number(process.env.ZOOM || 4); i++) {
			await page.mouse.wheel(0, -240);
			await page.waitForTimeout(120);
		}
	}
	await page.waitForTimeout(600);
}

const ruhig = async () => {
	await page.waitForTimeout(700);
	await page.waitForFunction(() => !document.getElementById('liveKarte')?.classList.contains('laedt'), null, { timeout: 60000 });
	await page.waitForTimeout(900);
};

const ids = await page.$$eval('#nsBox [data-ls]', (b) => b.map((x) => /** @type {HTMLElement} */ (x).dataset.ls));
for (const id of ids) {
	if (process.env.ID && process.env.ID !== id) continue;
	await page.click(`#nsBox [data-ls="${id}"]`);
	await ruhig();
	const r = await page.locator('#liveKarte').boundingBox();
	if (!r) continue;
	const s = Math.min(r.width, r.height) * 0.8;
	const png = await page.screenshot({ clip: { x: r.x + (r.width - s) / 2, y: r.y + (r.height - s) / 2, width: s, height: s } });
	const webp = await page.evaluate(async (b64) => {
		const img = new Image();
		img.src = 'data:image/png;base64,' + b64;
		await img.decode();
		const c = document.createElement('canvas');
		c.width = c.height = 240;
		const x = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
		x.imageSmoothingQuality = 'high';
		x.drawImage(img, 0, 0, 240, 240);
		return c.toDataURL('image/webp', 0.8).split(',')[1];
	}, png.toString('base64'));
	fs.writeFileSync(`${ZIEL}/${id}.webp`, Buffer.from(webp, 'base64'));
	if (process.env.POSTER) await page.locator('.poster-huelle').screenshot({ path: `test-output/live-${id}.png` });
	console.log('✓', id);
}
await browser.close();
