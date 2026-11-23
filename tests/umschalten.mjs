// Tempo beim schnellen Umschalten von Stilen und Designs (wie ein Mensch, der durchklickt).
// Aufruf: node tests/umschalten.mjs [url]   ·   ORT=bamberg (Stadt laden, braucht Internet), CPU=4 (langsames Gerät), TAKT=150 (ms zwischen Klicks)
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const TAKT = +(process.env.TAKT || 150);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const b = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
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
await p.goto(URL + (process.env.ORT ? '#ort=' + process.env.ORT : ''));
if (process.env.ORT) await p.reload();
await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
if (!process.env.ORT) await p.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
await p.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
await p.waitForTimeout(6000);
await p.evaluate(() => window.__lt.splice(0));

/** Klickt nacheinander (Takt) und misst, bis das zuletzt Gewählte sichtbar ist */
async function serie(name, sel, attr, werte, pruef) {
	await p.evaluate(() => window.__lt.splice(0));
	await p.evaluate(() => window.__fr.splice(0));
	if (process.env.PROF) {
		await cdp.send('Profiler.enable');
		await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
		await cdp.send('Profiler.start');
	}
	const t0 = Date.now();
	for (const w of werte) {
		// Klick wie ein Mensch: Ereignis wird eingereiht, auch wenn die Seite gerade beschäftigt ist
		await p.evaluate(([s, a, w]) => setTimeout(() => document.querySelector(`${s} [data-${a}="${w}"]`).click(), 0), [sel, attr, w]);
		await p.waitForTimeout(TAKT);
	}
	const letzte = werte[werte.length - 1];
	await p.waitForFunction(pruef, letzte, { timeout: 60000, polling: 50 });
	const fertig = Date.now() - t0 - TAKT * (werte.length - 1);
	await p.waitForTimeout(1500);
	const l = await p.evaluate(() => window.__lt.splice(0));
	const fr = await p.evaluate(() => window.__fr.splice(0));
	const stock = fr.filter((x) => x > 50);
	console.log('   Stocken: Bildpausen >50 ms', stock.length, '· zusammen', Math.round(stock.reduce((a, x) => a + x, 0)), 'ms · längste', Math.round(Math.max(0, ...fr)), 'ms');
	if (process.env.PROF) {
		const { profile } = await cdp.send('Profiler.stop');
		const byId = new Map(profile.nodes.map((n) => [n.id, n]));
		const self = new Map();
		profile.samples.forEach((id, i) => {
			const n = byId.get(id);
			const k = (n.callFrame.functionName || '(anon)') + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber;
			self.set(k, (self.get(k) || 0) + (profile.timeDeltas[i] || 0));
		});
		[...self.entries()].filter(([k]) => !/^\(idle\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log('   ', (v / 1000).toFixed(0).padStart(5), 'ms ', k));
	}
	console.log(name.padEnd(22), 'fertig', String(fertig).padStart(5), 'ms nach letztem Klick ·  Blockaden', l.length, ' Summe', l.reduce((a, x) => a + x, 0), 'ms  längste', Math.max(0, ...l), 'ms');
}
await p.click('#wzSteps button[data-step="stil"]');
await p.evaluate(() => document.querySelectorAll('.wz-cards.kurz').forEach((e) => e.classList.remove('kurz')));
const stile = ['dunkel', 'vintage', 'koralle', 'blaupause', 'umriss', 'goldnacht', 'japan', 'neon'];
await serie('Stile durchklicken', '#wzStyles', 'p', stile, (w) => document.querySelector(`#wzStyles [data-p="${w}"]`).classList.contains('on') && !document.documentElement.classList.contains('vt'));
await p.click('#wzSteps button[data-step="design"]');
await p.evaluate(() => document.querySelectorAll('.wz-cards.kurz').forEach((e) => e.classList.remove('kurz')));
const designs = ['klassisch', 'galerie', 'kreis', 'herz', 'fokus', 'steckbrief', 'typo', 'poster'];
await serie('Designs durchklicken', '#wzDesigns', 'd', designs, (w) => document.querySelector(`#wzDesigns [data-d="${w}"]`).classList.contains('on'));
await b.close();
