// Tempo in einer Großstadt (Standard New York): suchen, ganz herauszoomen, ziehen, Designs wählen.
// Aufruf: node tests/grossstadt.mjs [url] · Q="New York" · CPU=4 · HANDY=1
import { chromium, devices } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const b = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
const ctx = await b.newContext(process.env.HANDY ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
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
p.on('pageerror', (e) => console.log('FEHLER', e.message));
const cdp = await ctx.newCDPSession(p);
await p.goto(URL);
await p.fill('#lq', process.env.Q || 'New York');
await p.click('#lgo');
await p.waitForSelector('#lresults button', { timeout: 30000 });
await p.click('#lresults button');
await p.waitForSelector('#landing', { state: 'hidden', timeout: 90000 });
await p.waitForTimeout(6000);
if (process.env.CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.CPU });
const info = () => p.evaluate(() => ({ pfade: document.querySelectorAll('#poster path').length, knoten: document.querySelectorAll('#poster *').length }));
async function messe(name, fn) {
	await p.evaluate(() => { window.__lt.splice(0); window.__fr.splice(0); });
	const prof = process.env.PROF && name.includes(process.env.PROF);
	if (prof) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 300 }); await cdp.send('Profiler.start'); }
	const t0 = Date.now();
	await fn();
	const frB = await p.evaluate(() => window.__fr.slice());
	await p.waitForTimeout(2500);
	if (prof) {
		const { profile } = await cdp.send('Profiler.stop');
		const byId = new Map(profile.nodes.map((n) => [n.id, n])), par = new Map();
		profile.nodes.forEach((n) => (n.children || []).forEach((c) => par.set(c, n.id)));
		const tot = new Map();
		profile.samples.forEach((id, i) => { const dt = (profile.timeDeltas[i] || 0) / 1000; const seen = new Set(); let x = id; while (x) { const n = byId.get(x); const k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; if (!seen.has(k)) { seen.add(k); tot.set(k, (tot.get(k) || 0) + dt); } x = par.get(x); } });
		[...tot].filter(([k]) => !/^\((root|idle)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(String(Math.round(v)).padStart(7), k));
	}
	const lt = await p.evaluate(() => window.__lt.splice(0));
	const fr = await p.evaluate(() => window.__fr.splice(0));
	const stock = fr.filter((x) => x > 50);
	console.log(`${name.padEnd(30)} Blockaden ${String(lt.length).padStart(2)} · zus. ${String(lt.reduce((a, x) => a + x, 0)).padStart(5)} ms · längste ${String(Math.max(0, ...lt)).padStart(4)} · Ruckler ${stock.length} (${Math.round(stock.reduce((a, x) => a + x, 0))} ms) · in Bewegung: ${frB.length} Bilder, Ø ${Math.round(frB.reduce((a, x) => a + x, 0) / Math.max(1, frB.length))} ms · ${JSON.stringify(await info())}`);
}
const box = await p.locator('#poster').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
console.log('Start', JSON.stringify(await info()), await p.textContent('#placeInfo'));
await messe('Ziehen (Start)', async () => { await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 0; i < 20; i++) { await p.mouse.move(cx + i * 15, cy + i * 6); await p.waitForTimeout(16); } await p.mouse.up(); });
await messe('Herauszoomen (Mausrad)', async () => { await p.mouse.move(cx, cy); for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); } });
await p.waitForTimeout(4000);
await messe('Ziehen (herausgezoomt)', async () => { await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 0; i < 20; i++) { await p.mouse.move(cx - i * 15, cy - i * 6); await p.waitForTimeout(16); } await p.mouse.up(); });
await p.waitForTimeout(4000);
await p.evaluate(() => document.querySelector('#wzSteps [data-step="design"]').click());
await p.waitForTimeout(3000);
for (const d of ['kreis', 'passepartout', 'herz', 'poster']) await messe('Design ' + d, () => p.evaluate((d) => document.querySelector(`#wzDesigns [data-d="${d}"]`).click(), d));
await p.evaluate(() => document.querySelector('#wzSteps [data-step="stil"]').click());
await p.waitForTimeout(1500);
for (const s of ['dunkel', 'vintage']) await messe('Stil ' + s, () => p.evaluate((s) => document.querySelector(`#wzStyles [data-p="${s}"]`).click(), s));
await b.close();
