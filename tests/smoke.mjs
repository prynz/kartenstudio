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
	if (!/Einführung/.test(name)) await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
	const page = await ctx.newPage();
	// Neue Werkzeugleiste: Liegt ein Bedienelement in einem anderen Bereich, zuerst dorthin wechseln
	// (wie ein Mensch, der erst auf „Extras“ tippt und dann den Schalter umlegt)
	const zeig = (sel) =>
		page
			.evaluate((sel) => {
				const el = document.querySelector(sel);
				if (!el || el.offsetParent) return;
				const pane = el.closest('.wz-pane');
				if (!pane) return;
				const map = { ort: 'ort', ausschnitt: 'ort', stil: 'stil', design: 'design', text: 'text', extras: 'extras', produkt: 'fertig', fertig: 'fertig' };
				const b = document.querySelector(`#wzSteps button[data-step="${map[pane.dataset.step]}"]`);
				if (b && !b.classList.contains('on')) b.click();
				const sub = el.closest('[data-fsub]');
				if (sub) document.querySelector(`#fertigTabs [data-t="${sub.dataset.fsub}"]`)?.click();
			}, sel)
			.catch(() => {});
	for (const m of ['click', 'check', 'uncheck', 'fill', 'tap']) {
		const orig = page[m].bind(page);
		page[m] = async (sel, ...rest) => {
			if (typeof sel === 'string' && !sel.startsWith('#wzSteps')) await zeig(sel);
			return orig(sel, ...rest);
		};
	}
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
	console.log(`\n— ${name}`);
	await page.goto(URL);
	// warten, bis die App gestartet ist (Knöpfe verbunden) – sonst klickt der Test ins Leere
	await page.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0, null, { timeout: 30000 }).catch(() => {});
	// Für die Tests alle Stile/Designs sichtbar (im Alltag zeigt die App zuerst die beliebtesten 6)
	if (!/Top 6/.test(name)) await page.evaluate(() => (document.querySelectorAll('.wz-cards.kurz').forEach((e) => e.classList.remove('kurz')), document.querySelectorAll('.wz-more').forEach((d) => (d.open = true)))).catch(() => {});
	await fn(page);
	ok(errors.filter((e) => !/Failed to load resource|photon\.komoot\.io/.test(e)).length === 0, 'keine Fehler im Browser' + (errors.length ? ': ' + errors.join(' | ') : ''));
	await ctx.close();
}

await run('Desktop – Offline-Beispiel', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, async (page) => {
	await page.waitForSelector('#lq');
	await page.waitForTimeout(700);
	await page.screenshot({ path: `${OUT}/1-start-desktop.png` });
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
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
	ok(await page.locator('.wz-pane[data-step="design"]').isVisible(), '„Weiter“ führt vom Stil zum Design');
	// Vorschaubilder entstehen nacheinander, wenn der Browser Zeit hat
	await page.waitForFunction(() => [...document.querySelectorAll('#wzDesigns img')].every((x) => x.complete && x.naturalWidth > 0), null, { timeout: 30000 }).catch(() => {});
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
			// Bildschirm-Rechtecke: stimmen auch bei gedrehten/verschobenen Gruppen (Plakette, Cover)
			const b = t.getBoundingClientRect(), p = document.getElementById('poster').getBoundingClientRect();
			return vb.width > 0 && b.top >= p.top - 1 && b.bottom <= p.bottom + 1 && b.left >= p.left - 1 && b.right <= p.right + 1;
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
	await page.click('#wzSteps [data-adv-open]');
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
	await page.click('#wzSteps button[data-step="fertig"]');
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
	await page.waitForSelector('#lq');
	await page.waitForTimeout(700);
	await page.screenshot({ path: `${OUT}/4-start-iphone.png` });
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
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
	ok(h1 > h0 + 50 && (await posterVisible(100)), `Handy: Leiste hochgezogen (${Math.round(h0)} → ${Math.round(h1)} px), Poster sichtbar`);
	await page.screenshot({ path: `${OUT}/5d-gross-iphone.png` });
});

await run('Desktop – Druck, Pins, Teilen, Merken', { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	// Überrasch mich
	const pre0 = await page.evaluate(() => document.querySelector('#wzStyles .on')?.dataset.p);
	await page.click('.wz-pane[data-step="stil"] [data-dice]');
	await page.waitForTimeout(600);
	const pre1 = await page.evaluate(() => document.querySelector('#wzStyles .on')?.dataset.p);
	ok(pre1 && pre1 !== pre0, `„Überrasch mich“ wählt neuen Stil (${pre0} → ${pre1})`);
	await page.click('#wzStyles button[data-p="umriss"]');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzDesigns button[data-d="siegritz"]');
	await page.waitForTimeout(300);
	// Druckgröße: Poster bekommt genau das Seitenverhältnis von A3
	await page.click('#wzSteps button[data-step="ort"]');
	await page.click('.wz-pane[data-step="produkt"] [data-sizes] button[data-k="a3"]');
	await page.waitForTimeout(500);
	const vb = await page.evaluate(() => document.getElementById('poster').getAttribute('viewBox').split(' ').map(Number));
	ok(Math.abs(vb[3] / vb[2] - 42 / 29.7) < 0.005, `A3 gewählt: Poster im Verhältnis 1 : ${(vb[3] / vb[2]).toFixed(3)} (Soll 1,414)`);
	await page.check('.wz-pane[data-step="produkt"] [data-quer]');
	await page.waitForTimeout(500);
	const vq = await page.evaluate(() => document.getElementById('poster').getAttribute('viewBox').split(' ').map(Number));
	ok(Math.abs(vq[3] / vq[2] - 29.7 / 42) < 0.005, 'Querformat dreht das Poster');
	await page.uncheck('.wz-pane[data-step="produkt"] [data-quer]');
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
	await page.click('#wzSteps button[data-step="fertig"]');
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
	await page.click('#fertigTabs [data-t="laden"]');
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
	const [dlv] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }), page.click('.wz-dl button[data-f="pdfv"]')]);
	const pdfv = `${OUT}/${dlv.suggestedFilename()}`;
	await dlv.saveAs(pdfv);
	const vpdf = fs.readFileSync(pdfv).toString('latin1');
	ok(vpdf.startsWith("%PDF") && /TrimBox/.test(vpdf) && /BleedBox/.test(vpdf) && /FontFile2/.test(vpdf), `Vektor-PDF mit eingebetteten Schriften und Beschnitt (${Math.round(fs.statSync(pdfv).size / 1024)} KB)`);
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
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	ok(await page.locator('.wz-pane[data-step="text"]').isVisible(), 'Nach dem Laden direkt beim Text (Datum eintragen)');
	ok((await page.$$('#poster [data-pin]')).length === 1 && (await page.textContent('#widmung')) === 'Hier haben wir Ja gesagt', 'Herz und Widmung gesetzt');
	ok((await page.$('#papier')) !== null, 'Papier-Struktur aktiv');
	await page.screenshot({ path: `${OUT}/15-anlass-hochzeit.png` });
	await page.click('#wzSteps button[data-step="ort"]');
	await page.click('.wz-more [data-occ] button[data-k="geburt"]');
	await page.waitForTimeout(700);
	ok((await page.textContent('#widmung')) === 'Willkommen auf der Welt' && (await page.$('#papier')) === null, 'Anlass „Geburt“ im Assistenten gewechselt');
	await page.screenshot({ path: `${OUT}/16-anlass-geburt.png` });
	await page.click('#wzSteps button[data-step="stil"]');
	await page.check('#fxVig');
	await page.waitForTimeout(300);
	ok((await page.$('#vignette')) !== null, 'Vignette zuschaltbar');
	await page.click('#wzDesigns button[data-d="typo"]');
	await page.waitForTimeout(500);
	ok((await page.$$('#titel text')).length >= 2, 'Typografie-Design: Ortsname in großen Zeilen');
	await page.click('#wzDesigns button[data-d="haus"]');
	await page.waitForTimeout(400);
	ok((await page.$$('#wzDesigns button')).length >= 24, 'Haus-Form und Typografie bei den Designs');
	await page.click('#wzSteps button[data-step="text"]');
	await page.click('#wzFonts button[data-t="SgSC"]');
	await page.waitForTimeout(400);
	ok((await page.getAttribute('#titel', 'font-family')) === 'SgSC' && (await page.textContent('#titel')) === 'Siegritz', 'Schreibschrift-Titel „Siegritz“');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStyles button[data-p="cyber"]');
	await page.click('#wzSteps button[data-step="fertig"]');
	await page.waitForTimeout(400);
	ok(/Leuchtende Farben/.test(await page.textContent('#wzQa')), 'Farbhinweis bei Neonfarben („Cyber Noir“)');
	await page.check('#softproof');
	ok(await page.evaluate(() => getComputedStyle(document.getElementById('poster')).filter !== 'none'), 'Druckfarben-Simulation schaltbar');
});

await run('Desktop – Sternenhimmel', { viewport: { width: 1440, height: 900 }, acceptDownloads: true }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
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
	await page.click('#wzSteps button[data-step="stil"]');
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

await run('Desktop – Preis, Geschenk, Rechtliches', { viewport: { width: 1440, height: 900 }, acceptDownloads: true }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	await page.click('#wzSteps button[data-step="fertig"]');
	await page.click('#wzProd button[data-t="gerahmt"]');
	await page.click('.wz-pane[data-step="produkt"] [data-sizes] button[data-k="50x70"]');
	await page.waitForTimeout(400);
	const p1 = await page.textContent('#priceVal');
	await page.click('#mkFrameSw button[data-k="gold"]');
	await page.waitForTimeout(300);
	const p2 = await page.textContent('#priceVal');
	ok(/\d+,\d\d €/.test(p1) && p1 !== p2, `Preis passt sich an (${p1} → ${p2} mit Goldrahmen)`);
	await page.click('#wzProd button[data-t="shirt"]');
	await page.waitForTimeout(300);
	ok((await page.textContent('#priceVal')) === '29,90 €', 'Shirt-Preis 29,90 €');
	await page.click('#wzSteps button[data-step="fertig"]');
	await page.fill('#giftMsg', 'Damit du deine Heimat immer bei dir hast.');
	await page.fill('#giftFrom', 'Anna & Tom');
	const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#giftCard')]);
	const f = `${OUT}/${dl.suggestedFilename()}`;
	await dl.saveAs(f);
	ok(fs.statSync(f).size > 50000, 'Geschenkkarte als Bild');
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.click('#giftLink');
	await page.waitForTimeout(500);
	const link = await page.evaluate(() => navigator.clipboard.readText());
	const p3 = await page.context().newPage();
	await p3.goto(link);
	await p3.waitForSelector('.gift-ov', { timeout: 15000 }).catch(() => {});
	ok((await p3.textContent('.gift-box').catch(() => '')).includes('Anna & Tom'), 'Geschenk-Link zeigt die Botschaft');
	await p3.screenshot({ path: `${OUT}/24-geschenk.png` });
	await p3.click('.gift-box button');
	ok((await p3.$('.gift-ov')) === null, 'Botschaft lässt sich schließen');
	for (const r of ['impressum', 'datenschutz', 'agb']) {
		const res = await p3.goto(URL.replace(/\/$/, '') + '/' + r);
		ok(res.ok() && (await p3.textContent('h1')).length > 3, `Seite „${r}“ erreichbar`);
	}
	await p3.goto(URL.replace(/\/$/, '') + '/datenschutz');
	await p3.screenshot({ path: `${OUT}/25-datenschutz.png` });
	await p3.close();
});

await run('Desktop – Hilfe-Chat', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.click('#chatBtn');
	await page.waitForSelector('#chat.on');
	ok((await page.$$('.cm-bot')).length === 1, 'Chat öffnet mit Begrüßung und Vorschlägen');
	await page.fill('#chatIn', 'Was kostet ein Poster mit Rahmen?');
	await page.press('#chatIn', 'Enter');
	await page.waitForTimeout(400);
	ok((await page.textContent('.cm-bot:last-child')).includes('44,90'), 'Preisfrage richtig beantwortet');
	await page.fill('#chatIn', 'kann ich eine gpx datei von meinem marathon nehmen');
	await page.press('#chatIn', 'Enter');
	await page.waitForTimeout(400);
	ok((await page.textContent('.cm-bot:last-child')).includes('GPS-Datei'), 'Routen-Frage richtig beantwortet');
	await page.fill('#chatIn', 'Wie wird das Wetter morgen?');
	await page.press('#chatIn', 'Enter');
	await page.waitForTimeout(400);
	ok((await page.textContent('.cm-bot:last-child')).includes('weiß ich leider'), 'Unbekannte Frage: ehrliche Antwort mit Vorschlägen');
	await page.fill('#chatIn', '<img src=x onerror=alert(1)>');
	await page.press('#chatIn', 'Enter');
	await page.waitForTimeout(300);
	ok((await page.$('.chat-log img')) === null, 'Eingaben werden nie als HTML eingefügt');
	await page.screenshot({ path: `${OUT}/28-chat.png` });
	await page.keyboard.press('Escape');
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	await page.click('#railHilfe');
	await page.fill('#chatIn', 'Gibt es einen Sternenhimmel?');
	await page.press('#chatIn', 'Enter');
	await page.waitForTimeout(400);
	await page.click('.cm-bot:last-child .cm-act');
	await page.waitForTimeout(800);
	ok(await page.locator('#wzSky').isVisible(), 'Knopf im Chat öffnet direkt den Sternenhimmel');
});

await run('Desktop – Marktcheck-Runde 1', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	// Einfarbige Themen + Typografie
	await page.click('#wzStyles button[data-p="koralle"]');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzDesigns button[data-d="typo"]');
	await page.waitForTimeout(600);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === '#e2645a', 'Einfarbiges Thema „Koralle“');
	await page.screenshot({ path: `${OUT}/29-koralle-typo.png` });
	// Koordinaten-Poster
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzMode button[data-m="koord"]');
	await page.waitForTimeout(900);
	const kt = await page.textContent('#kartenInhalt');
	ok(/49° \d\d′/.test(kt) && kt.includes('SIEGRITZ') && kt.includes('kennengelernt'), 'Koordinaten-Poster mit Ortsname und Text');
	ok((await page.$('#titel')) === null && (await page.$('#quelle')) === null, 'Kein doppelter Titel, keine Kartenquelle beim Textposter');
	await page.fill('#koordText', 'Unser erstes eigenes Zuhause.');
	await page.waitForTimeout(400);
	ok((await page.textContent('#kartenInhalt')).includes('Unser erstes eigenes Zuhause.'), 'Eigener Text erscheint');
	await page.click('#koordAlign button[data-a="mitte"]');
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${OUT}/30-koordinaten.png` });
	await page.click('#wzMode button[data-m="art"]');
	await page.waitForTimeout(500);
	ok((await page.$$('#poster path[data-k]')).length > 100, 'Zurück zur Karte');
	// Neue Produkte
	await page.click('#wzSteps button[data-step="fertig"]');
	for (const t of ['alu', 'aufsteller', 'download']) {
		await page.click(`#wzProd button[data-t="${t}"]`);
		await page.waitForTimeout(500);
		await page.screenshot({ path: `${OUT}/31-produkt-${t}.png` });
	}
	ok((await page.textContent('#priceVal')).includes('€') && (await page.textContent('#priceShip')).includes('Sofort'), 'Download-Preis und „Sofort“');
	await page.click('#wzProd button[data-t="aufsteller"]');
	await page.waitForTimeout(300);
	ok((await page.textContent('#priceVal')) === '24,90 €' && /Lieferung voraussichtlich \w\w, \d\d\.\d\d\./.test(await page.textContent('#priceShip')), 'A5-Aufsteller 24,90 € mit Lieferdatum');
	ok((await page.textContent('.mk-size')).includes('A5'), 'Aufsteller in A5 im Raum');
	await page.click('#wzProd button[data-t="gerahmt"]');
	await page.check('#mkSet');
	await page.waitForTimeout(1800);
	const ok3 = await page.$$eval('.mk-set-img', (a) => a.length === 3 && a.every((i) => i.complete && i.naturalWidth > 0));
	ok(ok3 && (await page.textContent('#priceDet')).includes('Set-Rabatt'), 'Galerie-Wand: 3er-Set mit Set-Rabatt');
	await page.uncheck('#mkSet');
	const res = await page.goto(URL.replace(/\/$/, '') + '/lizenzen');
	ok(res.ok() && (await page.textContent('body')).includes('Copernicus'), 'Lizenzseite mit Copernicus-Hinweis');
});

await run('Desktop – Wortwolke', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
	await page.click('#wzMode button[data-m="wolke"]');
	await page.waitForTimeout(1200);
	const n = await page.$$eval('#wortwolke text', (t) => t.length);
	ok(n > 60, `Wortwolke füllt die Herzform (${n} Wörter)`);
	await page.screenshot({ path: `${OUT}/32-wolke-herz.png` });
	await page.fill('#wolkeText', 'Emil*, 11.02.2025*, Mama, Papa, Oma, Opa, Liebe, Glück, Baby, Familie');
	await page.click('#wolkeForm button[data-f="kreis"]');
	await page.waitForTimeout(900);
	const t = await page.textContent('#wortwolke');
	ok(t.includes('Emil') && t.includes('11.02.2025'), 'Eigene Wörter in der Wolke (Kreis)');
	await page.click('#wzStyles button[data-p="pastell"]');
	await page.waitForTimeout(800);
	await page.screenshot({ path: `${OUT}/33-wolke-kreis.png` });
	// gleiche Wörter → gleiche Wolke (fest, nicht bei jedem Zeichnen neu gewürfelt)
	const a1 = await page.innerHTML('#wortwolke');
	await page.click('#wzSteps button[data-step="text"]');
	await page.fill('#wzSub', 'Willkommen auf der Welt');
	await page.waitForTimeout(500);
	ok((await page.innerHTML('#wortwolke')) === a1, 'Wolke bleibt stabil beim Tippen');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStyles button[data-p="insel"]');
	await page.click('#wzMode button[data-m="art"]');
	await page.waitForTimeout(600);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === '#2b5d8c', 'Thema „Insel-Silhouette“');
});

await run('Beispiel-Galerie', { viewport: { width: 1440, height: 900 } }, async (page) => {
	const n = await page.$$eval('#bspStrip [data-id]', (b) => b.length);
	ok(n >= 12, `Startseite zeigt ${n} Beispiele`);
	await page.waitForTimeout(800);
	const bilder = await page.$$eval('#bspStrip img', (i) => i.filter((x) => x.complete && x.naturalWidth > 0).length);
	ok(bilder >= 4, `Vorschaubilder geladen (${bilder} sichtbar)`);
	// Galerie im Editor (offline mit den Beispieldaten)
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(600);
	ok((await page.$('#demoBtn')) === null && !(await page.content()).includes('Beispiel öffnen: Siegritz'), 'Kein Siegritz-Beispielknopf mehr auf der Startseite');
	// Im Editor: Look auf den eigenen Ort übernehmen
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('.wz-pane[data-step="stil"] [data-bsp-open]');
	await page.waitForSelector('#bspOverlay:not([hidden])');
	ok((await page.$$('#bspGrid [data-id]')).length >= 12, 'Galerie im Editor geöffnet');
	await page.click('#bspGrid [data-id="nuernberg-nacht"]');
	await page.waitForTimeout(900);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === '#272c39' && (await page.textContent('#poster')).includes('SIEGRITZ') && (await page.$$('#poster path[data-k]')).length > 100, 'Look „Nachtblau“ für den eigenen Ort übernommen (Siegritz bleibt)');
	ok(await page.locator('#bspOverlay').isHidden(), 'Galerie schließt sich danach');
});

await run('Einfacher Ablauf: Vorschläge, Top 6, Umfang, Widmungs-Ideen', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForFunction(() => [...document.querySelectorAll('#wzVorschlaege img')].filter((i) => i.complete && i.naturalWidth > 0).length === 6, null, { timeout: 20000 }).catch(() => {});
	ok((await page.$$eval('#wzVorschlaege img', (i) => i.filter((x) => x.complete && x.naturalWidth > 0).length)) === 6, '6 Vorschläge mit dem eigenen Ort');
	await page.screenshot({ path: `${OUT}/47-vorschlaege.png` });
	const sichtbar = await page.$$eval('#wzStyles > button', (b) => b.filter((x) => x.offsetParent !== null).length);
	ok(sichtbar === 6, `Top 6 Stile zuerst (${sichtbar} sichtbar)`);
	await page.click('[data-alle="wzStyles"]');
	ok((await page.$$eval('#wzStyles > button', (b) => b.filter((x) => x.offsetParent !== null).length)) > 15, '„Alle anzeigen“ zeigt alle Stile');
	await page.click('#wzVorschlaege [data-id="bamberg-typo"]');
	await page.waitForTimeout(700);
	ok((await page.$$('#titel text')).length >= 2 && (await page.textContent('#titel')).includes('SIE'), 'Vorschlag „Typografie“ übernommen – mit eigenem Ort');
	await page.click('#wzSteps button[data-step="ort"]');
	const sc = async () => parseFloat(((await page.getAttribute('#kartenAnsicht', 'transform')) || '').match(/scale\(([\d.]+)\)/)?.[1] || '0');
	await page.click('#wzUmfang button[data-z="kern"]');
	await page.waitForTimeout(500);
	const zk = await sc();
	await page.click('#wzUmfang button[data-z="weit"]');
	await page.waitForTimeout(500);
	const zw = await sc();
	ok(zk > 1.5 && zw < zk - 0.1, `Ortskern / Mit Umgebung (${zk.toFixed(2)} → ${zw.toFixed(2)})`);
	await page.click('#wzSteps button[data-step="text"]');
	await page.click('#wzNoteIdeen button:first-child');
	await page.waitForTimeout(300);
	ok((await page.inputValue('#wzNote')) === 'Hier hat alles begonnen', 'Widmungs-Idee per Tippen');
});

await run('Bedienung im Poster: Einführung, Text im Poster, Gespeichert, Favoriten', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForSelector('.coach', { timeout: 5000 }).catch(() => {});
	ok(!!(await page.$('.coach')), 'Einführung erscheint beim ersten Mal');
	await page.screenshot({ path: `${OUT}/48-einfuehrung.png` });
	await page.click('.coach-ok');
	await page.click('.coach-ok');
	await page.click('.coach-ok');
	ok(!(await page.$('.coach')) && (await page.evaluate(() => localStorage.getItem('kartenstudio.tipps.v1'))) === '1', 'Einführung durchgeklickt und gemerkt');
	// Titel im Poster antippen → Eingabefeld direkt im Poster
	const t = await page.locator('#titel').boundingBox();
	await page.mouse.click(t.x + t.width / 2, t.y + t.height / 2);
	await page.waitForSelector('.pe-feld', { timeout: 3000 }).catch(() => {});
	ok(!!(await page.$('.pe-feld')), 'Eingabefeld erscheint direkt über dem Titel');
	await page.fill('.pe-feld', 'MEIN DORF');
	await page.keyboard.press('Enter');
	await page.waitForTimeout(300);
	ok((await page.textContent('#titel')).includes('MEIN DORF') && !(await page.$('.pe-feld')), 'Titel im Poster geändert');
	await page.click('#undo');
	await page.waitForTimeout(300);
	ok((await page.textContent('#titel')).includes('SIEGRITZ'), 'Rückgängig stellt den Titel wieder her');
	await page.waitForSelector('#gespeichert.on', { timeout: 4000 }).catch(() => {});
	ok(!!(await page.$('#gespeichert.on')), '„Gespeichert ✓“ erscheint');
	// Favoriten
	await page.click('#wzSteps button[data-step="stil"]');
	const p0 = await page.getAttribute('#wzStyles button.on', 'data-p');
	await page.click('#favBtn');
	await page.click('#wzStyles button[data-p="dunkel"]');
	await page.waitForTimeout(400);
	await page.click('#favBtn');
	await page.waitForTimeout(600);
	ok((await page.$$('#favGrid .fav')).length === 2, '2 Favoriten gemerkt');
	await page.click('#favCmp');
	await page.waitForTimeout(500);
	ok((await page.$$('#favCmpGrid img')).length === 2, 'Vergleich zeigt beide nebeneinander');
	await page.screenshot({ path: `${OUT}/49-vergleich.png` });
	await page.click('#favCmpGrid .fc:last-child');
	await page.waitForTimeout(500);
	ok((await page.getAttribute('#wzStyles button.on', 'data-p')) === p0, `Favorit übernommen (${p0})`);
	ok(await page.locator('#favOverlay').isHidden(), 'Vergleich schließt nach Auswahl');
	// Vorschau als Bild teilen (am PC: Download)
	await page.click('#wzSteps button[data-step="fertig"]');
	const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), page.click('#shareImg')]);
	ok(/vorschau\.jpg$/.test(dl.suggestedFilename()), `Vorschaubild: ${dl.suggestedFilename()}`);
});

await run('3D: Schatten und Perspektive', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.click('#wzStyles button[data-p="dunkel"]');
	await page.check('#fxSchatten');
	await page.waitForTimeout(400);
	ok((await page.$$('#schatten path')).length > 50, 'Häuser werfen Schatten');
	await page.fill('#fxKipp', '45');
	await page.dispatchEvent('#fxKipp', 'change');
	await page.waitForTimeout(600);
	ok(!!(await page.$('#perspektive')) && !!(await page.$('#dunst')), 'Perspektive gekippt, Dunst am Horizont');
	const t0 = await page.getAttribute('#perspektive path[data-k="haupt"]', 'd');
	const box = await page.locator('#poster').boundingBox();
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 3 + 60, { steps: 6 });
	await page.mouse.up();
	await page.waitForTimeout(400);
	ok(t0 !== (await page.getAttribute('#perspektive path[data-k="haupt"]', 'd')), 'Verschieben in der Perspektive');
	await page.screenshot({ path: `${OUT}/50-perspektive.png` });
	await page.click('#wzSteps button[data-step="fertig"]');
	const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('.wz-dl button[data-f="svg"]')]);
	const f = `${OUT}/3d-${dl.suggestedFilename()}`;
	await dl.saveAs(f);
	const svg = fs.readFileSync(f, 'utf8');
	ok(svg.includes('id="perspektive"') && svg.includes('id="schatten"'), 'SVG-Export enthält Perspektive und Schatten');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.check('#fxH3d');
	await page.waitForTimeout(500);
	ok((await page.$$('#haeuser3d path')).length > 200 && !(await page.$('#schatten')), '3D-Häuser (Wände + Dächer), Schatten dann aus');
	await page.screenshot({ path: `${OUT}/51-3d-haeuser.png` });
	await page.click('#undo');
	// Drehen: Karte und Markierung drehen mit
	await page.click('#wzSteps button[data-step="text"]');
	await page.click('#wzPinAdd button:first-child');
	await page.click('#wzSteps button[data-step="stil"]');
	const d0 = await page.getAttribute('#perspektive path[data-k="haupt"]', 'd');
	await page.fill('#fxDreh', '90');
	await page.dispatchEvent('#fxDreh', 'change');
	await page.waitForTimeout(500);
	ok(d0 !== (await page.getAttribute('#perspektive path[data-k="haupt"]', 'd')) && (await page.textContent('#fxDrehV')).includes('90'), 'Karte um 90° gedreht');
	ok(!!(await page.$('#pins[pointer-events="none"] path')), 'Markierung wird in die Perspektive umgerechnet');
	await page.click('#undo');
	await page.click('#undo');
	for (let i = 0; i < 3; i++) await page.click('#undo'); // Verschieben, Perspektive, Schatten
	await page.waitForTimeout(400);
	ok(!(await page.$('#perspektive')) && !(await page.$('#schatten')), 'Rückgängig nimmt 3D-Effekte zurück');
});

await run('Designs nach Vorbildern: Fokus, Studie, Steckbrief, Kasten, Lupe, Dossier, Raster', { viewport: { width: 1440, height: 900 } }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	const design = async (d) => {
		await page.click(`#wzDesigns button[data-d="${d}"]`);
		await page.waitForTimeout(400);
	};
	await design('fokus');
	ok((await page.$('#poster #fokus')) && (await page.getAttribute('#titel', 'font-family')) === 'SgBR', 'Fokus: Farbfleck unter den Straßen, Pinselschrift');
	ok((await page.textContent('#titel')).trim() === 'Siegritz', 'Fokus: Titel in normaler Schreibweise');
	await page.click('#wzFokusFarben [data-c="#2440d8"]');
	await page.waitForTimeout(300);
	ok((await page.getAttribute('#fokus', 'fill')) === '#2440d8', 'Fokus: Farbe des Flecks wählbar');
	await design('studie');
	ok((await page.$('#poster #tabelle')) && (await page.getAttribute('#kartenhintergrund', 'fill')) === '#ffffff', 'Studie: Info-Leiste und weißes Papier');
	await design('steckbrief');
	ok((await page.textContent('#titel')).trim() === 'SIEGRITZ', 'Nach Pinsel-Design wieder Großbuchstaben');
	await page.fill('#wzInfoNr', '03/10');
	await page.fill('#wzInfoFakten', 'Einwohner: 120');
	await page.waitForTimeout(300);
	const sb = await page.textContent('#steckbrief');
	ok(sb.includes('03/10') && (await page.textContent('#poster')).includes('EINWOHNER'), 'Steckbrief: Nummer und eigene Fakten im Poster');
	await design('kasten');
	ok(!!(await page.$('#poster #kasten')), 'Kasten: Textraster in der Mitte');
	await design('dossier');
	ok((await page.$('#poster #lupe')) && (await page.$('#poster #gitter')) && (await page.$('#poster #kompass')), 'Dossier: Lupe, Gitter, Kompass');
	// Werkzeuge am Poster + Fortschrittsring
	await page.click('#ptIn');
	ok((await page.textContent('#ptProz')).trim() === '125 %', 'Werkzeuge am Poster: Vorschau vergrößern');
	await page.click('#ptFit');
	ok((await page.textContent('#ptProz')).trim() === '100 %', 'Werkzeuge am Poster: einpassen');
	ok((await page.getAttribute('#wzRing', 'stroke-dasharray')) !== '0 100', 'Fortschrittsring zeigt angesehene Bereiche');
	// Fokus anpassen: Form, Größe
	await design('fokus');
	await page.click('#wzFokusForm [data-v="kreis"]');
	await page.waitForTimeout(300);
	ok((await page.evaluate(() => document.querySelector('#fokus').tagName)) === 'circle', 'Fokus: Form „Kreis“ wählbar');
	await page.fill('#wzFokusGr', '0.2');
	await page.waitForTimeout(300);
	ok(+(await page.getAttribute('#fokus', 'r')) < 220, 'Fokus: Größe per Schieberegler');
	// Typografie anpassen: Karte in Buchstaben, Schrift, Zeilen
	await design('typo');
	await page.click('#wzTypoStil [data-v="schnitt"]');
	await page.waitForTimeout(300);
	ok((await page.getAttribute('#karte', 'clip-path')) === 'url(#cTypo)', 'Typografie: Karte nur in den Buchstaben');
	await page.click('#wzTypoZeilen [data-v="1"]');
	await page.click('#wzTypoSchrift [data-v="SgBR"]');
	await page.waitForTimeout(300);
	ok((await page.$$('#titel text')).length === 1 && (await page.getAttribute('#titel text', 'font-family')) === 'SgBR', 'Typografie: Schrift und Zeilenzahl wählbar');
	// Eigene Form: Buchstabe als Standard, Silhouette hochladen, Zahl
	await design('silhouette');
	ok((await page.getAttribute('#cMap path', 'd') || '').length > 100, 'Eigene Form: Karte in Form des Anfangsbuchstabens');
	await page.setInputFiles('#wzFormDatei', new globalThis.URL('./fixtures/silhouette-katze.jpg', import.meta.url).pathname);
	await page.waitForTimeout(800);
	const katze = await page.getAttribute('#cMap path', 'd');
	ok(katze && katze.length > 200, 'Eigene Form: hochgeladene Silhouette schneidet die Karte zu');
	await page.fill('#wzFormText', '25');
	await page.click('#wzFormTextGo');
	await page.waitForTimeout(800);
	ok((await page.getAttribute('#cMap path', 'd')) !== katze, 'Eigene Form: Zahl als Form');
	// Themenwelt „Sunset City“: Filter, Designs mit Himmel, Panels, Plakette
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStilKat [data-w="sunset"]');
	await page.waitForTimeout(300);
	const sichtbareStile = await page.$$eval('#wzStyles > button', (b) => b.filter((x) => x.offsetParent !== null).map((x) => x.dataset.p));
	ok(sichtbareStile.includes('spielkarte') && !sichtbareStile.includes('umriss'), `Themenwelt filtert die Stile (${sichtbareStile.length} sichtbar)`);
	await page.click('#wzStyles [data-p="sunset"]');
	await page.waitForTimeout(400);
	ok((await page.$$eval('#kartenhintergrund, #kartenflaeche', (e) => e.map((x) => x.getAttribute('fill')))).includes('url(#gBg)'), 'Stil „Sunset“ mit Farbverlauf');
	await page.click('#wzSteps button[data-step="design"]');
	ok(await page.locator('#wzDesignKat [data-w="sunset"]').evaluate((b) => b.classList.contains('on')), 'Themenwelt gilt auch bei den Designs');
	await design('sonnenuntergang');
	ok(!!(await page.$('#poster #himmel')) && (await page.getAttribute('#titel', 'font-family')) === 'SgBE', 'Sonnenuntergang: Himmel mit Sonne und Palmen, Plakatschrift');
	await design('cover');
	ok(!!(await page.$('#poster #panels')) && !!(await page.$('#poster #plakette #titel')), 'Cover-Raster: Panels und Titel-Plakette');
	// Album: nur die 10 Farben des Covers (Stil „Album-Abend“ + Design „Album“)
	await page.click('#wzSteps button[data-step="stil"]');
	await page.click('#wzStyles [data-p="albumabend"]');
	await page.waitForTimeout(400);
	await page.click('#wzSteps button[data-step="design"]');
	await design('album');
	const fremd = await page.evaluate(() => {
		const A = ['#2c1e3d', '#5d4872', '#6e74a0', '#8d769d', '#9b8bb2', '#b17b9a', '#db93a3', '#e4a9a4', '#ebc5b9', '#fcf1f9'];
		const f = new Set();
		document.querySelectorAll('#poster *').forEach((e) => {
			if (e.id === 'vorschau' || e.closest('#treffer') || e.closest('#sel')) return;
			for (const at of ['fill', 'stroke', 'stop-color']) {
				const v = (e.getAttribute(at) || '').toLowerCase();
				if (/^#[0-9a-f]{6}$/.test(v) && !A.includes(v)) f.add(v);
			}
		});
		return [...f];
	});
	ok(fremd.length === 0, 'Album: nur die 10 Farben des Covers' + (fremd.length ? ' – fremd: ' + fremd.join(', ') : ''));
	await design('guide');
	ok((await page.getAttribute('#titel', 'stroke')) === '#0b1f3a', 'Map Guide: Titel mit Kontur');
	await page.click('#wzDesignKat [data-w=""]');
	await page.waitForTimeout(200);
	await page.evaluate(() => document.querySelectorAll('.wz-cards.kurz').forEach((e) => e.classList.remove('kurz')));
	await design('einsatz');
	ok((await page.getAttribute('#untertitel', 'font-family').catch(() => null)) !== 'SgBE', 'Nach Sunset-Design wieder eigene Untertitel-Schrift');
	ok((await page.$('#poster #einsatz')) && (await page.$('#poster #absatz')) && !(await page.$('#poster #untertitel')), 'Einsatzkarte: rotes Viertel, Text oben, ohne Untertitel');
	await page.fill('#wzInfoAbsatz', 'Hier fing alles an.');
	await page.waitForTimeout(300);
	ok((await page.textContent('#absatz')).includes('Hier fing alles an.'), 'Einsatzkarte: eigener Text oben');
	await page.click('#wzSteps button[data-step="stil"]');
	await page.evaluate(() => document.querySelector('#wzStyles button[data-p="puls"]').click());
	await page.waitForTimeout(400);
	ok((await page.getAttribute('#kartenhintergrund', 'fill')) === 'url(#gBg)', 'Thema „Am Puls“ mit Farbverlauf');
	await page.check('#fxGlow');
	await page.waitForTimeout(300);
	ok(!!(await page.$('#poster #leuchten')), 'Effekt „Leuchten“');
	await page.screenshot({ path: `${OUT}/60-neue-designs.png` });
	// SVG-Export mit eingebetteter Pinselschrift
	await design('fokus');
	await page.click('#dlBtn');
	await page.click('#dlFmt button[data-f="svg"]');
	const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#dlGo')]);
	const txt = fs.readFileSync(await dl.path(), 'utf8');
	ok(txt.includes("font-family:'SgBR'"), 'SVG-Export bettet die Pinselschrift ein');
});

await run('iPhone – Zwei-Finger-Zoom', { ...devices['iPhone 14'] }, async (page) => {
	await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
	await page.waitForTimeout(500);
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

await run('Orts-Seiten für Google', { viewport: { width: 1280, height: 860 } }, async (page) => {
	const base = URL.replace(/\/$/, '');
	const r = await page.goto(base + '/poster/siegritz');
	ok(r.ok() && (await page.textContent('h1')) === 'Siegritz als Poster', 'Orts-Seite Siegritz erreichbar');
	const html = await r.text();
	ok(html.includes('Fränkische Schweiz') && html.includes('Landkreis Bamberg') && html.includes('Heiligenstadt'), 'Inhalt steht schon im HTML (für Google lesbar)');
	await page.screenshot({ path: `${OUT}/38-ortsseite.png`, fullPage: true });
	const ue = await page.goto(base + '/poster');
	ok(ue.ok() && (await page.$$('section li')).length >= 85, 'Übersicht mit allen Orten');
	const sm = await page.goto(base + '/sitemap.xml');
	ok(sm.ok() && (await sm.text()).includes('/poster/bamberg'), 'Sitemap für Google');
});

if (ONLINE)
	await run('Beispiel mit Ort (online): Sternenhimmel Bamberg', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.click('#bspStrip [data-id="bamberg-sterne"]');
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		await page.waitForTimeout(2000);
		ok((await page.textContent('#widmung')) === '21. Juni 2019 · 22:30 Uhr' && (await page.textContent('#poster')).includes('BAMBERG'), 'Beispiel öffnet Bamberg mit Sternenhimmel vom 21.06.2019');
	});

if (ONLINE)
	await run('3D: Relief aus dem Höhenmodell', { viewport: { width: 1280, height: 860 } }, async (page) => {
		await page.goto(URL + '#ort=pottenstein');
		await page.reload();
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		// Nach dem Laden springt der Editor einmal zum Bereich „Stil“ – erst danach umschalten
		await page.waitForTimeout(1500);
		await page.check('#fxRelief');
		await page.waitForSelector('#relief', { timeout: 40000 }).catch(() => {});
		ok(!!(await page.$('#relief')), 'Relief-Schattierung erscheint');
		ok((await page.textContent('#quelle')).includes('EU-DEM'), 'Quellenangabe Höhendaten');
	});

if (ONLINE)
	await run('3D: echte 3D-Ansicht (Landkarte, Gebäude, Gelände)', { viewport: { width: 1280, height: 860 } }, async (page) => {
		await page.goto(URL + '#ort=bamberg');
		await page.reload();
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		await page.waitForTimeout(1500);
		await page.click('#wzMode button[data-m="std"]');
		await page.click('#wzSteps button[data-step="extras"]');
		ok(await page.locator('#fxGelaende').isVisible(), 'Gelände-Schalter bei Landkarten-Stilen');
		await page.check('#fxH3d');
		await page.check('#fxGelaende');
		await page.fill('#fxKipp', '55');
		await page.dispatchEvent('#fxKipp', 'change');
		await page.waitForSelector('#kamera image', { timeout: 120000 }).catch(() => {});
		ok(!!(await page.$('#kamera image')), '3D-Ansicht von MapLibre gezeichnet');
		ok((await page.textContent('#quelle')).includes('EU-DEM'), 'Quellenangabe Höhendaten');
		await page.screenshot({ path: `${OUT}/52-3d-ansicht.png` });
	});

if (ONLINE)
	await run('Suche beim Tippen und zuletzt gesucht', { viewport: { width: 1280, height: 860 } }, async (page) => {
		await page.fill('#lq', 'Pottenst');
		await page.waitForSelector('#lresults button', { timeout: 20000 }).catch(() => {});
		// Öffentlicher Suchdienst hat manchmal Aussetzer → einmal neu tippen
		if (!(await page.$('#lresults button'))) {
			await page.fill('#lq', 'Pottenstei');
			await page.waitForSelector('#lresults button', { timeout: 20000 }).catch(() => {});
		}
		ok((await page.$$('#lresults button')).length > 0, 'Vorschläge erscheinen beim Tippen (ohne Klick auf Suchen)');
		await page.click('#lresults button');
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		await page.reload();
		await page.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
		await page.focus('#lq');
		await page.waitForTimeout(300);
		ok((await page.textContent('#lresults')).includes('Zuletzt gesucht') && (await page.textContent('#lresults')).includes('Pottenstein'), 'Zuletzt gesucht: Pottenstein');
	});

if (ONLINE)
	await run('Desktop – Orts-Seite öffnet direkt das Poster', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.goto(URL.replace(/\/$/, '') + '/poster/siegritz');
		await page.click('.ideen a[href*="anlass=hochzeit"]');
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
		await page.waitForTimeout(1500);
		ok((await page.textContent('#poster')).includes('SIEGRITZ') && (await page.textContent('#untertitel')) === 'Fränkische Schweiz', 'Knopf öffnet Siegritz mit Untertitel „Fränkische Schweiz“');
		ok((await page.textContent('#widmung').catch(() => '')) === 'Hier haben wir Ja gesagt', 'Anlass „Hochzeit“ direkt angewendet');
		await page.screenshot({ path: `${OUT}/39-ortsseite-poster.png` });
	});

if (ONLINE)
	await run('Desktop – Höhenlinien', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
		await page.waitForTimeout(500);
		await page.click('#wzStyles button[data-p="vintage"]');
		await page.check('#hoehenOn');
		await page.waitForSelector('#hoehenlinien', { timeout: 60000 }).catch(() => {});
		await page.waitForTimeout(600);
		const len = await page.evaluate(() => [...document.querySelectorAll('#hoehenlinien path')].reduce((s, p) => s + (p.getAttribute('d') || '').length, 0));
		ok(len > 2000, `Höhenlinien gezeichnet (${Math.round(len / 1024)} KB Linien)`);
		ok(/Höhe \d+–\d+ m/.test(await page.textContent('#hoehenInfo')), 'Info: ' + (await page.textContent('#hoehenInfo')));
		ok((await page.textContent('#quelle')).includes('EU-DEM'), 'Quellenangabe für Höhendaten');
		await page.screenshot({ path: `${OUT}/23-hoehenlinien.png` });
	});

if (ONLINE)
	await run('Desktop – Route aus GPS-Datei', { viewport: { width: 1440, height: 900 } }, async (page) => {
		await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
		await page.waitForTimeout(500);
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
		await page.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
		await page.waitForSelector('#landing', { state: 'hidden', timeout: 30000 });
		await page.waitForTimeout(500);
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
		await page.click('#wzSteps button[data-step="ort"]');
		await page.click('.wz-pane[data-step="produkt"] [data-sizes] button[data-k="a3"]');
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
		await page.click('#wzSteps button[data-step="ort"]');
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
		await page.click('#wzSteps button[data-step="ort"]');
		for (let i = 0; i < 6; i++) await page.click('#wzZIn');
		await page.waitForFunction(() => document.querySelectorAll('#poster #kartenInhalt image').length >= 2, null, { timeout: 60000 }).catch(() => {});
		ok((await page.$$('#poster #kartenInhalt image')).length >= 2, 'Beim Hineinzoomen wird ein scharfes Detailbild nachgezeichnet');
		await page.screenshot({ path: `${OUT}/8-standardstil-zoom.png` });
		// Größere Gegend laden (Inseln, Seen, Regionen)
		await page.click('#wzSteps button[data-step="stil"]');
		await page.click('#wzMode button[data-m="art"]');
		await page.click('#wzStyles button[data-p="insel"]');
		await page.click('#wzSteps button[data-step="ort"]');
		const w0 = parseInt((await page.textContent('#placeInfo')).match(/(\d+) Kartenelemente/)?.[1] || '0');
		await page.click('#wzWider');
		await page.waitForTimeout(800);
		await page.waitForFunction(() => document.getElementById('loader')?.style.display !== 'block', null, { timeout: 60000 }).catch(() => {});
		await page.waitForTimeout(1500);
		await page.click('#wzWider');
		await page.waitForTimeout(800);
		await page.waitForFunction(() => document.getElementById('loader')?.style.display !== 'block', null, { timeout: 60000 }).catch(() => {});
		await page.waitForTimeout(2000);
		ok((await page.$$('#karte path')).length > 5, 'Größere Gegend geladen (Insel-Silhouette)');
		await page.screenshot({ path: `${OUT}/34-gegend-gross.png` });
	});

await browser.close();
console.log(fails ? `\n${fails} Prüfung(en) fehlgeschlagen` : '\nAlle Prüfungen bestanden');
process.exit(fails ? 1 : 0);
