// Tempo-Messung: Blockaden (lange Aufgaben) und Ruckler (Bildpausen > 50 ms) bei typischen Aktionen.
// Aufruf: node tests/tempo.mjs [url]   ·   CPU=4 simuliert ein langsames Handy, ORT=bamberg lädt eine Stadt, W=8000 = Wartezeit je Schritt (ms)
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
	localStorage.setItem('kartenstudio.tipps.v1', '1');
	window.__lt = [];
	window.__fr = [];
	let last = 0;
	const tick = (t) => { if (last) window.__fr.push(t - last); last = t; requestAnimationFrame(tick); };
	requestAnimationFrame(tick);
	new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
});
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
if (process.env.CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.CPU });
const lt = async (name) => {
	const l = await p.evaluate(() => window.__lt.splice(0));
	const f = await p.evaluate(() => window.__fr.splice(0));
	const slow = f.filter((x) => x > 50);
	console.log('   Bilder', f.length, ' ruckler >50ms:', slow.length, ' längster', Math.round(Math.max(0, ...f)), 'ms');
	console.log(name.padEnd(28), 'Summe', l.reduce((a, x) => a + x, 0), 'ms  längste', Math.max(0, ...l), 'ms  (', l.length, 'Blockaden)');
};
await p.goto(URL + (process.env.ORT ? '#ort=' + process.env.ORT : ''));
if (process.env.ORT) await p.reload();
await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
if (!process.env.ORT) await p.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
await p.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
await p.waitForTimeout(+(process.env.W || 4000));
await lt('Laden + Startbilder');
await p.click('#wzStyles button[data-p="dunkel"]');
await p.waitForTimeout(+(process.env.W || 3000));
await lt('Stil wechseln');
const box = await p.locator('#poster').boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
await p.mouse.down();
await p.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 3 + 60, { steps: 20 });
await p.mouse.up();
await p.waitForTimeout(+(process.env.W || 3000));
await lt('Karte ziehen');
await p.click('#wzSteps button[data-step="text"]');
await p.waitForTimeout(500);
await lt('Schritt Text');
await p.type('#wzTitle', 'ABC', { delay: 80 });
await p.waitForTimeout(2000);
await lt('Titel tippen');
await b.close();
