// Ladezeit der Startseite: erste Anzeige, größtes Element, Blockierzeit (PC + gedrosseltes Handy). Aufruf: node tests/ladezeit.mjs
import { chromium, devices } from 'playwright';
const b = await chromium.launch();
for (const [n, o, cpu] of [['PC', { viewport: { width: 1440, height: 900 } }, 1], ['Handy (4× langsamer)', devices['iPhone 13'], 4]]) {
	const ctx = await b.newContext(o);
	const p = await ctx.newPage();
	const cdp = await ctx.newCDPSession(p);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
	await cdp.send('Network.enable');
	await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 70, downloadThroughput: (cpu > 1 ? 9 : 40) * 1024 * 1024 / 8, uploadThroughput: 2e6 });
	await p.addInitScript(() => { window.__m = {}; new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__m[e.name === 'first-contentful-paint' ? 'fcp' : e.entryType] = Math.round(e.startTime)))).observe({ type: 'paint', buffered: true }); new PerformanceObserver((l) => { const e = l.getEntries().pop(); window.__m.lcp = Math.round(e.startTime); window.__m.el = (e.element && (e.element.tagName + ' ' + (e.element.className || '') + ' ' + (e.url || '').split('/').pop())) || ''; }).observe({ type: 'largest-contentful-paint', buffered: true }); window.__tbt = 0; new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__tbt += Math.max(0, e.duration - 50)))).observe({ type: 'longtask', buffered: true }); });
	const t0 = Date.now();
	await p.goto('http://localhost:4173/', { waitUntil: 'load' });
	const load = Date.now() - t0;
	await p.waitForTimeout(2500);
	const m = await p.evaluate(() => ({ ...window.__m, tbt: Math.round(window.__tbt) }));
	console.log(n.padEnd(22), 'Erste Anzeige', m.fcp, 'ms · Größtes Element', m.lcp, 'ms · geladen', load, 'ms · Blockierzeit', m.tbt, 'ms', m.el);
	await ctx.close();
}
await b.close();
