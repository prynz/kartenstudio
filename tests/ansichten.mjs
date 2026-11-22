// Bildschirmfotos aller Bereiche (PC + iPhone) zum Begutachten: node tests/ansichten.mjs [url] [ziel-präfix]
import { chromium, devices } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || 'test-results/ux';
const b = await chromium.launch();
for (const [n, o] of [['pc', { viewport: { width: 1440, height: 900 } }], ['ip', devices['iPhone 13']]]) {
	const ctx = await b.newContext(o);
	await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
	const p = await ctx.newPage();
	await p.goto(URL);
	await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
	await p.screenshot({ path: `${OUT}-${n}-0start.png` });
	await p.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
	await p.waitForSelector('#landing', { state: 'hidden' });
	await p.waitForTimeout(2500);
	await p.screenshot({ path: `${OUT}-${n}-00editor.png` });
	for (const s of ['ort', 'stil', 'design', 'text', 'extras', 'fertig']) {
		await p.click(`#wzSteps button[data-step="${s}"]`);
		await p.waitForTimeout(1500);
		await p.screenshot({ path: `${OUT}-${n}-${s}.png` });
		// Länge der Einstellungen messen
		const h = await p.evaluate(() => {
			const w = document.querySelector('.wz-panes');
			return w ? Math.round(w.scrollHeight) : 0;
		});
		console.log(n, s, 'Höhe Einstellungen:', h, 'px');
	}
	await ctx.close();
}
await b.close();
