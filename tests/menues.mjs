// Tempo beim Durchklicken der Menüs (Werkzeugleiste, Fertig-Reiter, Gruppen aufklappen).
// Aufruf: node tests/menues.mjs [url] · CPU=4 (langsames Gerät) · ORT=bamberg (echte Stadt, Internet) · HANDY=1 · PROF=1
import { chromium, devices } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const b = await chromium.launch({ proxy, args: ['--ignore-certificate-errors'] });
const ctx = await b.newContext(process.env.HANDY ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
	localStorage.setItem('kartenstudio.tipps.v1', '1');
	window.__lt = [];
	new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
});
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
if (process.env.CPU) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.CPU });
await p.goto(URL + (process.env.ORT ? '#ort=' + process.env.ORT : ''));
if (process.env.ORT) await p.reload();
await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0, null, { timeout: 60000 });
if (!process.env.ORT) await p.evaluate(() => window.dispatchEvent(new Event('ks-demo')));
await p.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
await p.waitForTimeout(8000);

const prof = new Map();
async function profStart() { if (!process.env.PROF) return; await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 300 }); await cdp.send('Profiler.start'); }
async function profStop() {
	if (!process.env.PROF) return;
	const { profile } = await cdp.send('Profiler.stop');
	const byId = new Map(profile.nodes.map((n) => [n.id, n]));
	profile.samples.forEach((id, i) => {
		const n = byId.get(id);
		const k = (n.callFrame.functionName || '(anon)') + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber;
		prof.set(k, (prof.get(k) || 0) + (profile.timeDeltas[i] || 0) / 1000);
	});
}
/** Klick und Zeit bis zum nächsten gezeichneten Bild + Blockaden danach */
async function klick(name, js) {
	await p.evaluate(() => window.__lt.splice(0));
	const ms = await p.evaluate(async (js) => {
		const t0 = performance.now();
		new Function(js)();
		await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
		return Math.round(performance.now() - t0);
	}, js);
	await p.waitForTimeout(1200);
	const lt = await p.evaluate(() => window.__lt.splice(0));
	const sum = lt.reduce((a, x) => a + x, 0);
	console.log(`${name.padEnd(28)} bis Bild ${String(ms).padStart(5)} ms · Blockaden danach ${String(lt.length).padStart(2)} · zus. ${String(sum).padStart(5)} ms · längste ${Math.max(0, ...lt)}`);
	return ms + sum;
}
await profStart();
let ges = 0;
const schritte = ['ort', 'stil', 'design', 'text', 'extras', 'fertig'];
for (let runde = 0; runde < 2; runde++) {
	console.log('— Runde', runde + 1);
	for (const s of schritte) ges += await klick('Bereich ' + s, `document.querySelector('#wzSteps [data-step="${s}"]').click()`);
	for (const r of ['laden', 'teilen', 'produkt']) ges += await klick('Fertig-Reiter ' + r, `document.querySelector('[data-fz="${r}"]')?.click()`);
}
ges += await klick('Stil: Alle (Gruppe 1)', `document.querySelector('#wzStyles .wz-gr-mehr')?.click()`);
ges += await klick('Design-Chip Formen', `document.querySelector('#wzSteps [data-step="design"]').click(); document.querySelector('#wzDesignKat [data-welt="formen"], #wzDesignKat button:nth-child(4)')?.click()`);
await profStop();
console.log('SUMME', ges, 'ms');
if (process.env.PROF) [...prof].sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([k, v]) => console.log(String(Math.round(v)).padStart(6), k));
await b.close();
