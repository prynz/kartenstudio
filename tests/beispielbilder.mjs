// Erzeugt die Vorschaubilder der Beispiel-Galerie (static/beispiele/<id>.jpg).
// Die App zeichnet jedes Beispiel selbst; das fertige Poster wird fotografiert.
// Aufruf: npm run build && npm run preview  (zweites Terminal), dann
//         node tests/beispielbilder.mjs http://localhost:4173/ [nur-diese-id]
// Braucht Internet (Kartenkacheln, Höhendaten).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { BEISPIELE } from '../src/lib/beispiele/liste.js';

const URL = process.argv[2] || 'http://localhost:4173/';
const nur = process.argv[3];
const ziel = new globalThis.URL('../static/beispiele/', import.meta.url).pathname;
fs.mkdirSync(ziel, { recursive: true });

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });

for (const B of BEISPIELE) {
	if (nur && B.id !== nur) continue;
	const ctx = await browser.newContext({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 1 }); // Bilder werden klein angezeigt – 1× reicht (ca. 500 px)
	const page = await ctx.newPage();
	await page.goto(URL);
	await page.waitForFunction(() => document.querySelectorAll('#bspStrip [data-id]').length > 0, null, { timeout: 30000 });
	// Meldungen und Hilfe-Knöpfe sollen nicht mit aufs Bild
	await page.addStyleTag({ content: '.toast{display:none!important}' });
	await page.click(`#bspStrip [data-id="${B.id}"]`);
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
	// Weißer statt karierter Hintergrund bei transparenten Postern
	await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('[data-bg="#ffffff"]'))?.click());
	if (B.hoehen) await page.waitForSelector('#hoehenlinien', { timeout: 60000 }).catch(() => {});
	if (B.motif === 'sterne') await page.waitForFunction(() => (document.querySelector('#kartenInhalt')?.innerHTML.length || 0) > 20000, null, { timeout: 30000 }).catch(() => {});
	await page.waitForTimeout(2500);
	const buf = await page.locator('#poster').screenshot({ type: 'jpeg', quality: 76 });
	fs.writeFileSync(ziel + B.id + '.jpg', buf);
	console.log('✓', B.id, Math.round(buf.length / 1024), 'KB');
	await ctx.close();
}
await browser.close();
