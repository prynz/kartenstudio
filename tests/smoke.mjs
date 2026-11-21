// Rauchtest: öffnet die App im Browser und prüft die wichtigsten Abläufe.
// Aufruf:  npm run build && npm run preview  (in einem zweiten Terminal)
//          node tests/smoke.mjs [url] [ordner-für-screenshots]
// Braucht das Paket „playwright“ (mit Chromium).
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || 'test-results';
const ONLINE = !process.env.OFFLINE;
fs.mkdirSync(OUT, { recursive: true });

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
let fails = 0;
const ok = (cond, text) => {
	console.log((cond ? '✓ ' : '✗ ') + text);
	if (!cond) fails++;
};

async function run(name, ctxOpts, fn) {
	const ctx = await browser.newContext(ctxOpts);
	const page = await ctx.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
	console.log(`\n— ${name}`);
	await page.goto(URL);
	await fn(page);
	ok(errors.filter((e) => !/Failed to load resource/.test(e)).length === 0, 'keine Fehler im Browser' + (errors.length ? ': ' + errors.join(' | ') : ''));
	await ctx.close();
}

await run('Desktop – Offline-Beispiel', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, async (page) => {
	await page.waitForSelector('#demoBtn');
	await page.waitForTimeout(700);
	await page.screenshot({ path: `${OUT}/1-start-desktop.png` });
	await page.click('#demoBtn');
	await page.waitForTimeout(900);
	const n = await page.$$eval('#poster path[data-k]', (p) => p.length);
	ok(n > 100, `Poster gezeichnet (${n} Kartenelemente)`);
	ok(await page.locator('#landing').isHidden(), 'Startseite ausgeblendet');
	ok((await page.textContent('#poster')).includes('SIEGRITZ'), 'Titel „SIEGRITZ“ im Poster');
	await page.screenshot({ path: `${OUT}/2-editor-desktop.png` });
	// Stil wechseln
	await page.click('.sec[data-s="stil"] > .sh');
	await page.waitForTimeout(400);
	await page.click('#styles button[data-p="dunkel"]');
	await page.waitForTimeout(300);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === '#272c39', 'Thema „Nachtblau“ angewendet');
	await page.screenshot({ path: `${OUT}/3-stil-desktop.png` });
	// Undo
	await page.click('#undo');
	await page.waitForTimeout(200);
	ok((await page.$('#kartenhintergrund')) === null, 'Rückgängig stellt Siegritz-Stil wieder her');
	// Haus anklicken
	await page.click('.sec[data-s="elemente"] > .sh');
	await page.waitForTimeout(400);
	await page.click('#grpbtns .chip[data-k="haus"]');
	await page.waitForTimeout(200);
	ok((await page.textContent('#selinfo')).includes('Häuser'), 'Gruppe „Häuser“ ausgewählt');
	// Text
	await page.click('.sec[data-s="text"] > .sh');
	await page.waitForTimeout(400);
	await page.fill('#tText', 'MEIN DORF');
	await page.waitForTimeout(200);
	ok((await page.textContent('#poster')).includes('MEIN DORF'), 'Titel geändert');
	// SVG-Export
	await page.click('#dlBtn');
	await page.click('#dlFmt button[data-f="svg"]');
	const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dlGo')]);
	const file = `${OUT}/${dl.suggestedFilename()}`;
	await dl.saveAs(file);
	const svg = fs.readFileSync(file, 'utf8');
	ok(svg.startsWith('<svg') && svg.includes('@font-face') && svg.length > 40000, `SVG-Export (${Math.round(svg.length / 1024)} KB, Schriften eingebettet)`);
	// PNG-Export
	await page.click('#dlBtn');
	await page.click('#dlFmt button[data-f="png"]');
	const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#dlGo')]);
	const png = `${OUT}/${dl2.suggestedFilename()}`;
	await dl2.saveAs(png);
	ok(fs.statSync(png).size > 50000, `PNG-Export (${Math.round(fs.statSync(png).size / 1024)} KB)`);
});

await run('iPhone – Offline-Beispiel', { ...devices['iPhone 14'] }, async (page) => {
	await page.waitForSelector('#demoBtn');
	await page.waitForTimeout(700);
	await page.screenshot({ path: `${OUT}/4-start-iphone.png` });
	await page.click('#demoBtn');
	await page.waitForTimeout(900);
	ok((await page.$$eval('#poster path[data-k]', (p) => p.length)) > 100, 'Poster auf dem Handy gezeichnet');
	await page.screenshot({ path: `${OUT}/5-editor-iphone.png` });
});

if (ONLINE)
	await run('Desktop – echte Suche „Siegritz“ mit Vektorkacheln', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, async (page) => {
		await page.fill('#lq', 'Siegritz');
		await page.click('#lgo');
		await page.waitForSelector('#lresults button', { timeout: 20000 });
		await page.click('#lresults button');
		await page.waitForTimeout(3500);
		await page.screenshot({ path: `${OUT}/6-ortswahl.png` });
		ok(await page.locator('#picker').isVisible(), 'Ortswahl-Fenster mit Karte offen');
		await page.click('#gen');
		await page.waitForSelector('#picker.hidden', { state: 'attached', timeout: 60000 });
		await page.waitForTimeout(1200);
		// Vektorkacheln fassen viele Häuser zu einem Pfad zusammen – daher die angezeigte Elementzahl prüfen
		const n = parseInt((await page.textContent('#placeInfo')).match(/(\d+) Kartenelemente/)?.[1] || '0');
		ok(n > 100 && (await page.$$eval('#karte path', (p) => p.length)) > 5, `Poster aus Vektorkacheln gezeichnet (${n} Kartenelemente)`);
		await page.screenshot({ path: `${OUT}/7-editor-kacheln.png` });
		// Standard-Stil (MapLibre rendert ein Bild)
		await page.click('.sec[data-s="stil"] > .sh');
		await page.waitForTimeout(400);
		await page.click('#modeTabs button[data-m="std"]');
		await page.waitForSelector('#poster image', { timeout: 60000 }).catch(() => {});
		ok((await page.$('#poster image')) !== null, 'Standard-Stil „Klassisch“ gerendert');
		await page.waitForTimeout(500);
		await page.screenshot({ path: `${OUT}/8-standardstil.png` });
	});

await browser.close();
console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
