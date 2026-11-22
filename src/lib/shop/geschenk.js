// Verschenken: Geschenk-Link (öffnet das Poster mit Grußbotschaft) und Geschenkkarte als Bild.
import { app as appUntyped } from '../editor/app.js';
import { buildSVG, geo } from '../editor/zeichnen.js';
import { shareLink } from '../editor/entwurf.js';
import { dlPlain } from '../export/export.js';
import { msg } from '../editor/ansicht.js';

/** @type {any} */
const app = appUntyped;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

function giftData() {
	const m = /** @type {HTMLTextAreaElement} */ ($('giftMsg')).value.trim().slice(0, 280);
	const f = /** @type {HTMLInputElement} */ ($('giftFrom')).value.trim().slice(0, 60);
	return { msg: m, from: f };
}

/** Zeilen umbrechen für die Karte @param {CanvasRenderingContext2D} c @param {string} t @param {number} w */
function wrap(c, t, w) {
	/** @type {string[]} */
	const out = [];
	t.split(/\n/).forEach((par) => {
		let line = '';
		par.split(/\s+/).forEach((word) => {
			const test = line ? line + ' ' + word : word;
			if (c.measureText(test).width > w && line) {
				out.push(line);
				line = word;
			} else line = test;
		});
		out.push(line);
	});
	return out;
}

/** Geschenkkarte (Postkarte 3:2) mit Posterbild und Botschaft als PNG */
export async function giftCard() {
	const g = giftData();
	await Promise.all(['SgXB', 'SgMD', 'SgFR'].map((f) => document.fonts.load(`40px ${f}`)));
	const W = 2100,
		H = 1400;
	const cv = document.createElement('canvas');
	cv.width = W;
	cv.height = H;
	const c = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d'));
	c.fillStyle = '#f6f3ee';
	c.fillRect(0, 0, W, H);
	// Poster links
	const url = URL.createObjectURL(new Blob([buildSVG(true)], { type: 'image/svg+xml' }));
	const img = new Image();
	await new Promise((res, rej) => {
		img.onload = res;
		img.onerror = rej;
		img.src = url;
	});
	const G = geo();
	const ph = H - 260,
		pw = (ph * G.W) / G.H;
	const fw = Math.min(pw, W * 0.46),
		fh = (fw * G.H) / G.W;
	const px = 130,
		py = (H - fh) / 2;
	c.shadowColor = 'rgba(20,24,35,.25)';
	c.shadowBlur = 40;
	c.shadowOffsetY = 16;
	c.fillStyle = '#fff';
	c.fillRect(px, py, fw, fh);
	c.shadowColor = 'transparent';
	c.drawImage(img, px, py, fw, fh);
	URL.revokeObjectURL(url);
	// Text rechts
	const tx = px + fw + 130,
		tw = W - tx - 130;
	c.fillStyle = '#262c3a';
	c.font = '64px SgFR';
	c.fillText('Für dich', tx, 330);
	c.font = '700 30px SgMD';
	c.fillStyle = '#8a8f9a';
	c.fillText('EIN STÜCK HEIMAT – ' + String((app.DATA && app.DATA.place) || '').toUpperCase(), tx, 395);
	c.fillStyle = '#262c3a';
	c.font = '44px SgMD';
	const lines = wrap(c, g.msg || 'Alles Liebe!', tw).slice(0, 9);
	lines.forEach((l, i) => c.fillText(l, tx, 520 + i * 64));
	if (g.from) {
		c.font = '46px SgFR';
		c.fillText(g.from, tx, 520 + lines.length * 64 + 70);
	}
	c.fillStyle = '#262c3a';
	c.fillRect(tx, H - 200, 90, 6);
	c.font = '28px SgMD';
	c.fillStyle = '#8a8f9a';
	c.fillText('Gestaltet mit Kartenstudio', tx, H - 150);
	const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
	if (blob) dlPlain('Geschenkkarte_' + String((app.DATA && app.DATA.place) || 'Karte').replace(/[^\wäöüÄÖÜß-]+/g, '_') + '.png', blob);
	msg('Geschenkkarte heruntergeladen – zum Ausdrucken oder Verschicken', 'ok');
}

/** Geschenk-Link: öffnet das Poster mit der Botschaft */
export async function giftLink() {
	const url = await shareLink(giftData());
	try {
		const nav = /** @type {any} */ (navigator);
		if (nav.share && matchMedia('(pointer: coarse)').matches) {
			await nav.share({ title: 'Ein Geschenk für dich', url }).catch(() => {});
			return;
		}
		await navigator.clipboard.writeText(url);
		msg('Geschenk-Link kopiert', 'ok');
	} catch (e) {
		window.prompt('Geschenk-Link:', url);
	}
}

/**
 * Beim Öffnen eines Geschenk-Links: Grußbotschaft zeigen.
 * @param {{msg?:string, from?:string}} g
 */
export function showGift(g) {
	if (!g || (!g.msg && !g.from)) return;
	const d = document.createElement('div');
	d.className = 'gift-ov';
	d.setAttribute('role', 'dialog');
	d.setAttribute('aria-modal', 'true');
	const box = document.createElement('div');
	box.className = 'gift-box';
	const h = document.createElement('h3');
	h.textContent = 'Ein Geschenk für dich';
	const p = document.createElement('p');
	p.textContent = g.msg || '';
	const f = document.createElement('p');
	f.className = 'gift-from';
	f.textContent = g.from ? '– ' + g.from : '';
	const b = document.createElement('button');
	b.className = 'btn accent';
	b.textContent = 'Poster ansehen';
	b.onclick = () => d.remove();
	box.append(h, p, f, b);
	d.append(box);
	document.body.append(d);
	b.focus();
}

export function initGift() {
	$('giftLink').onclick = giftLink;
	$('giftCard').onclick = () => giftCard().catch(() => msg('Geschenkkarte konnte nicht erstellt werden', 'err'));
}
