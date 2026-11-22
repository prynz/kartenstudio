// Profil: welche Funktionen beim Laden eines Beispiels (Standard: Nürnberg) wie viel Rechenzeit brauchen.
// Aufruf: node tests/profil.mjs [url]  ·  BSP=<beispiel-id>  ·  AKTION=h3d (misst das Einschalten der 3D-Häuser)
// Für lesbare Funktionsnamen vorher ohne Verkürzung bauen: npx vite build --minify false
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4173/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('kartenstudio.tipps.v1', '1'));
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.goto(URL); await p.waitForFunction(() => document.querySelectorAll('#wzStyles button').length > 0);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await cdp.send('Profiler.start');
await p.click('#bspStrip [data-id="' + (process.env.BSP || 'nuernberg-nacht') + '"]');
await p.waitForSelector('#landing', { state: 'hidden', timeout: 60000 });
await p.waitForTimeout(+(process.env.W || 6000));
if (process.env.AKTION === 'h3d') {
  await cdp.send('Profiler.stop'); await cdp.send('Profiler.start');
  await p.evaluate(() => { const c = document.getElementById('fxH3d'); c.click(); });
  await p.waitForTimeout(6000);
}
const { profile } = await cdp.send('Profiler.stop');
const byId = new Map(profile.nodes.map((n) => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas; 
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = (n.callFrame.functionName || '(anon)') + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); });
[...self.entries()].filter(([k]) => !/^\(idle\)|^\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log((v / 1000).toFixed(0).padStart(6), 'ms ', k));
await b.close();
