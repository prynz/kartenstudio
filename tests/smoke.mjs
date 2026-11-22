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
	ok((await page.$$eval('#symbole path', (u) => u.reduce((n, p) => n + (p.getAttribute('d').match(/Z/g) || []).length, 0))) > 300, 'Pop-Art: Symbolteppich gezeichnet');
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

await run('Desktop – Druck, Pins, Teilen, Merken', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true }, async (page) => {
	await page.click('#demoBtn');
	await page.waitForTimeout(900);
	// Überrasch mich
	const pre0 = await page.evaluate(() => document.querySelector('#wzStyles .on')?.dataset.p);
	await page.click('.wz-pane[data-step="stil"] [data-dice]');
	await page.waitForTimeout(600);
	const pre1 = await page.evaluate(() => document.querySelector('#wzStyles .on')?.dataset.p);
	ok(pre1 && pre1 !== pre0, `„Überrasch mich“ wählt neuen Stil (${pre0} → ${pre1})`);
	await page.click('#wzStyles button[data-p="umriss"]');
	await page.click('#wzSteps button[data-step="design"]');
	await page.click('#wzDesigns button[data-d="siegritz"]');
	await page.waitForTimeout(300);
	// Druckgröße: Poster bekommt genau das Seitenverhältnis von A3
	await page.click('#wzSteps button[data-step="ausschnitt"]');
	await page.click('.wz-pane[data-step="ausschnitt"] [data-sizes] button[data-k="a3"]');
	await page.waitForTimeout(500);
	const vb = await page.evaluate(() => document.getElementById('poster').getAttribute('viewBox').split(' ').map(Number));
	ok(Math.abs(vb[3] / vb[2] - 42 / 29.7) < 0.005, `A3 gewählt: Poster im Verhältnis 1 : ${(vb[3] / vb[2]).toFixed(3)} (Soll 1,414)`);
	await page.check('.wz-pane[data-step="ausschnitt"] [data-quer]');
	await page.waitForTimeout(500);
	const vq = await page.evaluate(() => document.getElementById('poster').getAttribute('viewBox').split(' ').map(Number));
	ok(Math.abs(vq[3] / vq[2] - 29.7 / 42) < 0.005, 'Querformat dreht das Poster');
	await page.uncheck('.wz-pane[data-step="ausschnitt"] [data-quer]');
	await page.waitForTimeout(400);
	// Text: Widmung + Pins
	await page.click('#wzSteps button[data-step="text"]');
	await page.fill('#wzNote', '12.06.2021');
	await page.waitForTimeout(300);
	ok((await page.textContent('#widmung')) === '12.06.2021', 'Widmungszeile im Poster');
	const vb2 = await page.evaluate(() => document.getElementById('poster').getAttribute('viewBox').split(' ').map(Number));
	ok(Math.abs(vb2[3] / vb2[2] - 42 / 29.7) < 0.005, 'Format bleibt A3 auch mit zusätzlicher Zeile');
	await page.click('#wzPinAdd button:first-child');
	await page.waitForTimeout(300);
	ok((await page.$$('#poster [data-pin]')).length === 1, 'Herz-Markierung gesetzt');
	const pb = await page.locator('#poster [data-pin="0"] path').boundingBox();
	const x0 = await page.evaluate(() => JSON.parse(localStorage.getItem('kartenstudio.entwurf.v1') || '{}').S?.pins?.length || 0);
	await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
	await page.mouse.down();
	await page.mouse.move(pb.x + pb.width / 2 + 90, pb.y + pb.height / 2 + 60, { steps: 6 });
	await page.mouse.up();
	await page.waitForTimeout(300);
	const pb2 = await page.locator('#poster [data-pin="0"] path').boundingBox();
	ok(pb2.x - pb.x > 60 && pb2.y - pb.y > 40, 'Markierung lässt sich im Poster verschieben');
	await page.screenshot({ path: `${OUT}/9-pins-widmung.png` });
	// Produkt: Raum + maßstäbliche Größe
	await page.click('#wzSteps button[data-step="produkt"]');
	await page.waitForTimeout(500);
	await page.click('#mkRoomSw button[data-k="sofa"]');
	await page.waitForTimeout(500);
	ok((await page.textContent('.mk-size')).includes('A3'), 'Mockup zeigt Größe „A3“');
	const wA3 = (await page.locator('.mk-paper img').boundingBox()).width;
	await page.click('.wz-pane[data-step="produkt"] [data-sizes] button[data-k="70x100"]');
	await page.waitForTimeout(500);
	const w70 = (await page.locator('.mk-paper img').boundingBox()).width;
	const sofa3 = (await page.locator('.mk-furn svg').boundingBox()).width;
	ok(w70 / sofa3 > 0.3 && w70 / sofa3 < 0.4, `70×100 im richtigen Verhältnis zum 210-cm-Sofa (${(w70 / sofa3).toFixed(2)}, Soll 0,33 + Rahmen)`);
	await page.screenshot({ path: `${OUT}/10-mockup-sofa.png` });
	for (const r of ['wohnen', 'flur', 'buero']) {
		await page.click(`#mkRoomSw button[data-k="${r}"]`);
		await page.waitForTimeout(250);
		await page.screenshot({ path: `${OUT}/10-mockup-${r}.png` });
	}
	ok((await page.$$('#mkRoomSw button')).length === 4, '4 Räume zur Auswahl');
	await page.click('#wzProd button[data-t="shirt"]');
	await page.check('#mkModel');
	await page.waitForTimeout(400);
	ok((await page.$('.mk-shirt.mk-model')) !== null, 'Shirt am Model');
	await page.screenshot({ path: `${OUT}/11-shirt-model.png` });
	await page.click('#wzProd button[data-t="gerahmt"]');
	await page.click('.wz-pane[data-step="produkt"] [data-sizes] button[data-k="a3"]');
	// Fertig: Ampel + PDF
	await page.click('#wzSteps button[data-step="fertig"]');
	await page.waitForTimeout(400);
	ok(await page.locator('#wzQa').isVisible(), 'Qualitäts-Ampel: ' + (await page.textContent('#wzQa b')));
	await page.screenshot({ path: `${OUT}/12-fertig.png` });
	const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('.wz-dl button[data-f="pdf"]')]);
	const pdf = `${OUT}/${dl.suggestedFilename()}`;
	await dl.saveAs(pdf);
	const head = fs.readFileSync(pdf).subarray(0, 4000).toString('latin1');
	const mb = head.match(/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
	const mm = mb ? [(+mb[1] * 25.4) / 72, (+mb[2] * 25.4) / 72] : [0, 0];
	ok(head.startsWith('%PDF') && /TrimBox/.test(head) && Math.abs(mm[0] - 303) < 0.5 && Math.abs(mm[1] - 426) < 0.5, `PDF A3 mit Beschnitt (${mm.map((v) => v.toFixed(1)).join(' × ')} mm, ${Math.round(fs.statSync(pdf).size / 1024)} KB)`);
	// Teilen-Link
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.click('#wzShare');
	await page.waitForTimeout(500);
	const link = await page.evaluate(() => navigator.clipboard.readText());
	ok(/#e=z[\w-]+$/.test(link), `Teilen-Link erzeugt (${link.length} Zeichen)`);
	// Entwurf gemerkt → nach Neuladen „Weiter mit …“
	await page.waitForTimeout(900);
	await page.reload();
	await page.waitForTimeout(800);
	ok(await page.locator('#resumeBtn').isVisible(), 'Nach Neuladen: „' + (await page.textContent('#resumeBtn b')) + '“');
	await page.screenshot({ path: `${OUT}/13-weiter.png` });
	await page.click('#resumeBtn');
	await page.waitForTimeout(1200);
	ok((await page.textContent('#widmung')) === '12.06.2021' && (await page.$$('#poster [data-pin]')).length === 1, 'Entwurf vollständig wiederhergestellt (Widmung, Pin)');
	// Geteilter Link in frischem Browser
	const ctx2 = await browser.newContext({ viewport: { width: 1200, height: 800 } });
	const p2 = await ctx2.newPage();
	await p2.goto(link);
	await p2.waitForTimeout(1500);
	ok((await p2.textContent('#widmung').catch(() => '')) === '12.06.2021', 'Geteilter Link öffnet den Entwurf auf einem anderen Gerät');
	ok(!(await p2.evaluate(() => location.hash)), 'Link-Anhang wird danach aus der Adresszeile entfernt');
	// Manipulierter Link wird abgelehnt
	const bad = { v: 1, demo: true, S: { view: { a: 1, cx: 1, cy: 1, z: 1 }, cls: {}, bg: '"/><img src=x onerror=alert(1)>' } };
	const code = 'j' + Buffer.from(JSON.stringify(bad)).toString('base64url');
	const p3 = await ctx2.newPage();
	await p3.goto(URL + '#e=' + code);
	await p3.waitForTimeout(800);
	ok(await p3.locator('#landing').isVisible(), 'Manipulierter Link wird abgelehnt (Startseite bleibt)');
	await ctx2.close();
});

await run('Desktop – Anlass-Vorlagen und Effekte', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.click('.occ-landing button[data-k="hochzeit"]');
	ok((await page.getAttribute('#lq', 'placeholder')) === 'Wo habt ihr geheiratet?', 'Anlass „Hochzeit“ vorgemerkt (Suchfeld fragt passend)');
	await page.click('#demoBtn');
	await page.waitForTimeout(1200);
	ok(await page.locator('.wz-pane[data-step="text"]').isVisible(), 'Nach dem Laden direkt beim Text (Datum eintragen)');
	ok((await page.$$('#poster [data-pin]')).length === 1 && (await page.textContent('#widmung')) === 'Hier haben wir Ja gesagt', 'Herz und Widmung gesetzt');
	ok((await page.$('#papier')) !== null, 'Papier-Struktur aktiv');
	await page.screenshot({ path: `${OUT}/15-anlass-hochzeit.png` });
	await page.click('#wzSteps button[data-step="ort"]');
	await page.click('.wz-pane[data-step="ort"] [data-occ] button[data-k="geburt"]');
	await page.waitForTimeout(700);
	ok((await page.textContent('#widmung')) === 'Willkommen auf der Welt' && (await page.$('#papier')) === null, 'Anlass „Geburt“ im Assistenten gewechselt');
	await page.screenshot({ path: `${OUT}/16-anlass-geburt.png` });
	await page.click('#wzSteps button[data-step="design"]');
	await page.check('#fxVig');
	await page.waitForTimeout(300);
	ok((await page.$('#vignette')) !== null, 'Vignette zuschaltbar');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStyles button[data-p="cyber"]');
	await page.click('#wzSteps button[data-step="fertig"]');
	await page.waitForTimeout(400);
	ok(/Leuchtende Farben/.test(await page.textContent('#wzQa')), 'Farbhinweis bei Neonfarben („Cyber Noir“)');
	await page.check('#softproof');
	ok(await page.evaluate(() => getComputedStyle(document.getElementById('poster')).filter !== 'none'), 'Druckfarben-Simulation schaltbar');
});

await run('Desktop – Sternenhimmel', { viewport: { width: 1440, height: 900 }, acceptDownloads: true }, async (page) => {
	await page.click('#demoBtn');
	await page.waitForTimeout(900);
	await page.click('#wzMode button[data-m="sterne"]');
	await page.waitForFunction(() => (document.querySelector('#kartenInhalt')?.innerHTML.length || 0) > 20000, null, { timeout: 15000 }).catch(() => {});
	await page.fill('#skyDate', '2021-06-12');
	await page.dispatchEvent('#skyDate', 'change');
	await page.fill('#skyTime', '22:00');
	await page.dispatchEvent('#skyTime', 'change');
	await page.waitForTimeout(500);
	const n = await page.evaluate(() => (document.querySelector('#kartenInhalt')?.innerHTML.match(/a[\d.]+ [\d.]+ 0 1 0/g) || []).length / 2);
	ok(n > 1000, `Sternenhimmel gezeichnet (${n} Sterne sichtbar)`);
	ok((await page.textContent('#widmung')) === '12. Juni 2021 · 22:00 Uhr', 'Datum und Uhrzeit als Widmung');
	ok((await page.$('#poster circle')) !== null || (await page.evaluate(() => !!document.querySelector('#cMap circle'))), 'Runde Form für den Himmel');
	await page.screenshot({ path: `${OUT}/17-sternenhimmel.png` });
	await page.check('#skyNames');
	await page.check('#skyGrid');
	await page.click('.sky-sw[data-k="gold"]');
	await page.waitForTimeout(500);
	ok((await page.textContent('#kartenInhalt')).includes('GROSSER BÄR') || (await page.textContent('#kartenInhalt')).length > 50, 'Sternbild-Namen angezeigt');
	await page.screenshot({ path: `${OUT}/18-sternenhimmel-gold.png` });
	await page.click('#wzSteps button[data-step="design"]');
	await page.click('#wzDesigns button[data-d="klassisch"]');
	await page.waitForTimeout(800);
	await page.screenshot({ path: `${OUT}/19-sternenhimmel-rechteck.png` });
	await page.click('#wzSteps button[data-step="fertig"]');
	const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.wz-dl button[data-f="svg"]')]);
	const f = `${OUT}/${dl.suggestedFilename()}`;
	await dl.saveAs(f);
	ok(fs.readFileSync(f, 'utf8').length > 100000, 'Sternenhimmel als SVG exportiert');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzMode button[data-m="art"]');
	await page.waitForTimeout(600);
	ok((await page.$$('#poster path[data-k]')).length > 100, 'Zurück zur Karte');
});

await run('iPhone – Zwei-Finger-Zoom', { ...devices['iPhone 14'] }, async (page) => {
	await page.tap('#demoBtn');
	await page.waitForTimeout(900);
	const z0 = await page.evaluate(() => document.querySelector('#kartenAnsicht').getAttribute('transform'));
	const b = await page.locator('#poster').boundingBox();
	const cdp = await page.context().newCDPSession(page);
	const cx = b.x + b.width / 2,
		cy = b.y + b.height * 0.4;
	const tp = (d) => [
		{ x: cx - d, y: cy, id: 1 },
		{ x: cx + d, y: cy, id: 2 }
	];
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(30) });
	for (let d = 35; d <= 110; d += 5) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(d) });
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await page.waitForTimeout(500);
	const sc = (t) => parseFloat((t.match(/scale\(([\d.]+)\)/) || [])[1] || '0');
	const z1 = await page.evaluate(() => document.querySelector('#kartenAnsicht').getAttribute('transform'));
	ok(sc(z1) > sc(z0) * 2.5, `Zwei-Finger-Zoom vergrößert die Karte (${sc(z0).toFixed(2)} → ${sc(z1).toFixed(2)})`);
	await page.screenshot({ path: `${OUT}/14-pinch-iphone.png` });
});

if (ONLINE)
	await run('Desktop – Route aus GPS-Datei', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.click('#demoBtn');
		await page.waitForTimeout(900);
		await page.click('#wzSteps button[data-step="ort"]');
		await page.setInputFiles('#routeFile', new globalThis.URL('./fixtures/route-bamberg.gpx', import.meta.url).pathname);
		await page.waitForSelector('#route', { timeout: 60000 }).catch(() => {});
		await page.waitForTimeout(800);
		ok((await page.$('#route')) !== null, 'Route eingezeichnet');
		ok((await page.textContent('#poster')).includes('BAMBERG-RUNDE'), 'Titel aus der GPS-Datei: „BAMBERG-RUNDE“');
		ok(/\d+,\d km/.test(await page.textContent('#untertitel')), 'Streckenlänge als Untertitel: ' + (await page.textContent('#untertitel')));
		const rb = await page.locator('#route').boundingBox();
		const mb = await page.locator('#poster').boundingBox();
		ok(rb && rb.width > mb.width * 0.55, 'Karte passt sich der Strecke an');
		await page.click('#wzSteps button[data-step="ort"]');
		await page.click('#routeCol button[data-c="#2f6fe4"]');
		await page.waitForTimeout(400);
		await page.screenshot({ path: `${OUT}/22-route.png` });
	});

if (ONLINE)
	await run('Desktop – Mehrere Orte auf einem Poster', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.click('#demoBtn');
		await page.waitForTimeout(900);
		await page.click('#wzSteps button[data-step="ort"]');
		await page.check('#multiOn');
		await page.waitForTimeout(400);
		ok((await page.$$('#kartenInhalt clipPath[id^="mo"]')).length === 1, 'Mehrere Orte eingeschaltet (Siegritz als Kreis)');
		for (const q of ['Bamberg', 'Nürnberg']) {
			await page.fill('#mq', q);
			await page.click('#mgo');
			await page.waitForSelector('#mresults button', { timeout: 20000 });
			await page.click('#mresults button');
			await page.waitForTimeout(400);
		}
		await page.waitForFunction(() => !document.querySelector('#kartenInhalt')?.textContent.includes('lädt'), null, { timeout: 60000 }).catch(() => {});
		await page.waitForTimeout(800);
		ok((await page.$$('#kartenInhalt clipPath[id^="mo"]')).length === 3, 'Drei Orte nebeneinander');
		const t = await page.textContent('#kartenInhalt');
		ok(t.includes('BAMBERG') && t.includes('NÜRNBERG') && t.includes('SIEGRITZ'), 'Alle Ortsnamen beschriftet');
		await page.fill('#multiList input[data-i="0"]', 'Aufgewachsen');
		await page.fill('#multiList input[data-i="1"]', 'Studiert · 2012');
		await page.fill('#multiList input[data-i="2"]', 'Zuhause seit 2020');
		await page.click('#multiList button[data-act="zin"][data-i="2"]');
		await page.fill('#wzTitle', 'UNSERE ORTE').catch(() => {});
		await page.click('#wzSteps button[data-step="text"]');
		await page.fill('#wzTitle', 'UNSERE ORTE');
		await page.fill('#wzSub', 'Franken');
		await page.waitForTimeout(600);
		ok((await page.textContent('#kartenInhalt')).includes('Zuhause seit 2020'), 'Eigene Zeile je Ort');
		await page.screenshot({ path: `${OUT}/20-mehrere-orte.png` });
		await page.click('#wzSteps button[data-step="ausschnitt"]');
		await page.click('.wz-pane[data-step="ausschnitt"] [data-sizes] button[data-k="a3"]');
		await page.waitForTimeout(800);
		await page.screenshot({ path: `${OUT}/21-mehrere-orte-a3.png` });
	});

if (ONLINE)
	await run('Desktop – echte Suche „Bamberg“ direkt ins Poster', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, async (page) => {
		await page.fill('#lq', 'Bamberg');
		await page.click('#lgo');
		await page.waitForSelector('#lresults button', { timeout: 20000 });
		await page.click('#lresults button');
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		await page.waitForTimeout(1500);
		ok(await page.locator('#picker').isHidden(), 'Kein Umweg über das Kartenfenster');
		const n = parseInt((await page.textContent('#placeInfo')).match(/(\d+) Kartenelemente/)?.[1] || '0');
		ok(n > 100 && (await page.$$eval('#karte path', (p) => p.length)) > 5, `Poster direkt aus der Suche (${n} Kartenelemente)`);
		ok((await page.textContent('#poster')).includes('BAMBERG'), 'Titel automatisch „BAMBERG“');
		ok(((await page.textContent('#untertitel').catch(() => '')) || '').length > 2, 'Untertitel automatisch: „' + (await page.textContent('#untertitel').catch(() => '')) + '“');
		await page.screenshot({ path: `${OUT}/7-direkt-bamberg.png` });
		// Kartenfenster weiterhin erreichbar
		await page.click('#wzSteps button[data-step="ausschnitt"]');
		await page.click('#wzPick');
		await page.waitForSelector('#picker:not(.hidden)');
		await page.waitForTimeout(3000);
		ok(await page.locator('#map canvas').isVisible(), 'Landkarte zum Feinwählen lädt bei Bedarf');
		await page.click('#gen');
		await page.waitForSelector('#picker.hidden', { state: 'attached', timeout: 60000 });
		await page.waitForTimeout(800);
		// Standard-Stil (MapLibre rendert ein Bild), beim Hineinzoomen scharf nachzeichnen
		await page.click('#wzSteps button[data-step="stil"]');
		await page.waitForTimeout(400);
		await page.click('#wzMode button[data-m="std"]');
		await page.waitForSelector('#poster image', { timeout: 60000 }).catch(() => {});
		ok((await page.$('#poster image')) !== null, 'Standard-Stil „Klassisch“ gerendert');
		await page.click('#wzSteps button[data-step="ausschnitt"]');
		for (let i = 0; i < 6; i++) await page.click('#wzZIn');
		await page.waitForFunction(() => document.querySelectorAll('#poster #kartenInhalt image').length >= 2, null, { timeout: 60000 }).catch(() => {});
		ok((await page.$$('#poster #kartenInhalt image')).length >= 2, 'Beim Hineinzoomen wird ein scharfes Detailbild nachgezeichnet');
		await page.screenshot({ path: `${OUT}/8-standardstil-zoom.png` });
	});

await browser.close();
console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
