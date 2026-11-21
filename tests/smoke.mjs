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
	ok(await page.locator('.wz-pane[data-step="stil"]').isVisible(), 'Assistent startet beim Schritt „Stil“');
	// Stil wechseln (Assistent)
	await page.click('#wzStyles button[data-p="dunkel"]');
	await page.waitForTimeout(300);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === '#272c39', 'Thema „Nachtblau“ angewendet');
	await page.screenshot({ path: `${OUT}/3-stil-desktop.png` });
	// Undo
	await page.click('#undo');
	await page.waitForTimeout(200);
	ok((await page.$('#kartenhintergrund')) === null, 'Rückgängig stellt Siegritz-Stil wieder her');
	// Karte im Poster ziehen verschiebt den Ausschnitt (ohne Werkzeug umzuschalten)
	const cx0 = await page.evaluate(() => document.querySelector('#karte > g > g > g').getAttribute('transform'));
	const box = await page.locator('#poster').boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 3 + 40, { steps: 8 });
	await page.mouse.up();
	await page.waitForTimeout(200);
	const cx1 = await page.evaluate(() => document.querySelector('#karte > g > g > g').getAttribute('transform'));
	ok(cx0 !== cx1, 'Karte im Poster direkt verschiebbar');
	// Designs durchklicken
	await page.click('#wzNext');
	await page.waitForTimeout(1200);
	ok(await page.locator('.wz-pane[data-step="design"]').isVisible(), '„Weiter“ führt zum Schritt „Design“');
	const designs = await page.$$eval('#wzDesigns button', (b) => b.map((x) => x.dataset.d));
	ok(designs.length >= 9, `${designs.length} Designs zur Auswahl`);
	const thumbs = await page.$$eval('#wzDesigns img', (i) => i.filter((x) => x.complete && x.naturalWidth > 0).length);
	ok(thumbs === designs.length, `Vorschaubilder für alle Designs (${thumbs})`);
	const bad = [];
	for (const d of designs) {
		await page.click(`#wzDesigns button[data-d="${d}"]`);
		await page.waitForTimeout(150);
		const okDesign = await page.evaluate(() => {
			const t = document.querySelector('#poster #titel');
			const vb = document.getElementById('poster').viewBox.baseVal;
			if (!t) return false;
			const b = t.getBBox();
			return b.y >= 0 && b.y + b.height <= vb.height && b.x >= 0 && b.x + b.width <= vb.width;
		});
		if (!okDesign) bad.push(d);
	}
	ok(bad.length === 0, 'Jedes Design zeichnet den Titel innerhalb des Posters' + (bad.length ? ': ' + bad.join(', ') : ''));
	await page.click('#wzDesigns button[data-d="kreis"]');
	await page.waitForTimeout(200);
	ok((await page.$('#cMap circle')) !== null, 'Design „Kreis“ schneidet die Karte rund aus');
	await page.click('#wzDesigns button[data-d="koordinaten"]');
	await page.waitForTimeout(200);
	ok(/° .*N/.test((await page.textContent('#koordinaten')) || ''), 'Design „Mit Koordinaten“ zeigt Koordinaten');
	await page.click('#wzDesigns button[data-d="siegritz"]');
	// Text
	await page.click('#wzNext');
	await page.waitForTimeout(400);
	await page.fill('#wzTitle', 'MEIN DORF');
	await page.waitForTimeout(200);
	ok((await page.textContent('#poster')).includes('MEIN DORF'), 'Titel im Assistenten geändert');
	// Erweiterte Einstellungen: alle Detailregler weiterhin erreichbar
	await page.click('#wzAdv');
	await page.waitForTimeout(400);
	ok(await page.locator('#adv').isVisible(), 'Erweiterte Einstellungen öffnen');
	await page.click('.sec[data-s="elemente"] > .sh');
	await page.waitForTimeout(400);
	await page.click('#grpbtns .chip[data-k="haus"]');
	await page.waitForTimeout(200);
	ok((await page.textContent('#selinfo')).includes('Häuser'), 'Gruppe „Häuser“ ausgewählt (erweitert)');
	await page.click('#advBack');
	await page.waitForTimeout(300);
	ok(await page.locator('#wiz').isVisible(), 'Zurück zum Assistenten');
	// Produkt-Mockups
	await page.click('#wzSteps button[data-step="produkt"]');
	await page.waitForTimeout(600);
	ok(await page.locator('#mockup').isVisible(), 'Schritt „Produkt“ zeigt Mockup');
	const mkBad = [];
	for (const t of ['poster', 'gerahmt', 'leinwand', 'shirt', 'tasse']) {
		await page.click(`#wzProd button[data-t="${t}"]`);
		await page.waitForTimeout(500);
		const loaded = await page.evaluate(() => {
			const i = document.querySelector('#mkScene .mk-img');
			if (!i) return false;
			if (i.tagName === 'IMG') return i.complete && i.naturalWidth > 0;
			return !!i.getAttribute('href');
		});
		if (!loaded) mkBad.push(t);
	}
	ok(mkBad.length === 0, 'Mockups Poster, Rahmen, Leinwand, Shirt, Tasse' + (mkBad.length ? ' – fehlt: ' + mkBad.join(', ') : ''));
	await page.click('#wzProd button[data-t="gerahmt"]');
	await page.click('.mk-swatch[data-key="frame"][data-k="eiche"]');
	await page.waitForTimeout(300);
	ok(/repeating-linear-gradient/.test(await page.getAttribute('.mk-gerahmt', 'style')), 'Rahmen „Eiche“ gewählt');
	await page.screenshot({ path: `${OUT}/3b-mockup-desktop.png` });
	// Pop-Art-Thema
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStyles button[data-p="popart"]');
	await page.waitForTimeout(400);
	ok((await page.$$eval('#symbole use', (u) => u.length)) > 300, 'Pop-Art: Symbolteppich gezeichnet');
	await page.click('#undo');
	await page.waitForTimeout(200);
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
	// Poster muss sichtbar bleiben, während man unten Einstellungen ändert
	const posterVisible = (minH = 150) =>
		page.evaluate((minH) => {
			const p = document.getElementById('poster').getBoundingClientRect();
			const s = document.getElementById('side').getBoundingClientRect();
			return p.top >= 0 && p.bottom <= s.top + 1 && p.height > minH;
		}, minH);
	await page.tap('#wzSteps button[data-step="text"]');
	await page.waitForTimeout(600);
	await page.fill('#wzTitle', 'MEIN DORF');
	await page.waitForTimeout(300);
	ok(await posterVisible(), 'Handy: Poster bleibt beim Text-Ändern sichtbar');
	ok((await page.evaluate(() => window.scrollY)) === 0, 'Handy: Seite selbst scrollt nicht weg');
	await page.screenshot({ path: `${OUT}/5b-text-iphone.png` });
	await page.tap('#wzSteps button[data-step="stil"]');
	await page.waitForTimeout(600);
	await page.tap('#wzStyles button[data-p="vintage"]');
	await page.waitForTimeout(500);
	ok(await posterVisible(), 'Handy: Poster bleibt beim Stilwechsel sichtbar');
	await page.screenshot({ path: `${OUT}/5c-stil-iphone.png` });
	// Leiste am Griff hochziehen → Poster wird kleiner, bleibt aber sichtbar
	const g = await page.locator('#sheetGrip').boundingBox();
	const h0 = (await page.locator('#side').boundingBox()).height;
	await page.mouse.move(g.x + g.width / 2, g.y + 10);
	await page.mouse.down();
	await page.mouse.move(g.x + g.width / 2, g.y - 180, { steps: 12 });
	await page.mouse.up();
	await page.waitForTimeout(700);
	const h1 = (await page.locator('#side').boundingBox()).height;
	ok(h1 > h0 + 80 && (await posterVisible(100)), `Handy: Leiste hochgezogen (${Math.round(h0)} → ${Math.round(h1)} px), Poster sichtbar`);
	await page.screenshot({ path: `${OUT}/5d-gross-iphone.png` });
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
		await page.click('#wzSteps button[data-step="stil"]');
		await page.waitForTimeout(400);
		await page.click('#wzMode button[data-m="std"]');
		await page.waitForSelector('#poster image', { timeout: 60000 }).catch(() => {});
		ok((await page.$('#poster image')) !== null, 'Standard-Stil „Klassisch“ gerendert');
		await page.waitForTimeout(500);
		await page.screenshot({ path: `${OUT}/8-standardstil.png` });
	});

await browser.close();
console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
