// Bildschirmfotos der Designs nach Vorbildern (Fokus, Studie, Steckbrief …): node tests/neue-designs.mjs [url] [ziel]
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || 'test-results/nd';
const PAARE = [
	['fokus', 'japan'], ['studie', 'dunkel'], ['steckbrief', 'schwarzweiss'], ['steckbrief', 'dunkel'], ['kasten', 'puls'],
	['nachtstadt', 'neon'], ['nachtstadt', 'goldnacht'], ['lupe', 'schwarzweiss'], ['dossier', 'dossier'], ['leise', 'lichter'], ['galerie', 'koenigsblau'], ['polaroid', 'wimmel']
];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1300, height: 1000 } });
await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
const p = await ctx.newPage();
const fehler = [];
p.on('pageerror', (e) => fehler.push(String(e)));
await p.goto(URL);
await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
await p.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
await p.waitForSelector('#landing', { state: 'hidden' });
await p.waitForTimeout(1500);
for (const [d, t] of PAARE) {
	await p.click('#wzSteps button[data-step="stil"]');
	await p.evaluate((t) => document.querySelector(`#wzStyles button[data-p="${t}"]`).click(), t);
	await p.waitForTimeout(400);
	await p.click('#wzSteps button[data-step="design"]');
	await p.evaluate((d) => document.querySelector(`#wzDesigns button[data-d="${d}"]`).click(), d);
	if (d === 'fokus' || d === 'leise') await p.evaluate(() => document.fonts.ready);
	if (t === 'lichter') {
		await p.click('#wzSteps button[data-step="extras"]');
		await p.evaluate(() => { const c = document.getElementById('fxGlow'); if (!c.checked) c.click(); });
	}
	await p.waitForTimeout(1200);
	await p.locator('#poster').screenshot({ path: `${OUT}-${d}-${t}.png` });
	if (t === 'lichter') await p.evaluate(() => document.getElementById('fxGlow').click());
}
console.log(fehler.length ? fehler.join('\n') : 'keine Fehler');
await b.close();
