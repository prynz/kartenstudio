// Produkt-Mockups: zeigt das Motiv live als Poster an der Wand (mit/ohne Rahmen),
// Leinwand, T-Shirt oder Tasse. Die Szenen sind selbst gezeichnet (HTML/SVG),
// es werden keine fremden Bilder oder Dienste gebraucht.
import { app as appUntyped } from './app.js';
import { alsBild, buildSVG, geo } from './zeichnen.js';
import { schriftenDa } from './basis.js';
import { paper, paperOrFree, fitPrint } from './druck.js';
import { clampView } from './zustand.js';
import { viewCenterLL } from './seitenleiste.js';
import { defaultSky, loadSky, skyLabel, skyReady } from '../themen/himmel.js';

/** @type {any} */
const app = appUntyped;

/** Produktarten */
export const PRODUCTS = {
	poster: { name: 'Poster', desc: 'Matt, auf hochwertigem Papier' },
	gerahmt: { name: 'Mit Rahmen', desc: 'Fertig gerahmt zum Aufhängen' },
	leinwand: { name: 'Leinwand', desc: 'Auf Keilrahmen gespannt' },
	shirt: { name: 'T-Shirt', desc: 'Bio-Baumwolle, Motiv auf der Brust' },
	tasse: { name: 'Tasse', desc: 'Keramik, spülmaschinenfest' },
	alu: { name: 'Alu-Dibond', desc: '3 mm Aluverbund, matt, mit Aufhängung' },
	aufsteller: { name: 'A5 Aufsteller', desc: 'Kleines Bild im Rahmen zum Hinstellen' },
	download: { name: 'Download', desc: 'Druckdatei sofort, ohne Versand' }
};

/** Bilderrahmen: Name und Farbverlauf (Holz/Metall) */
export const FRAMES = {
	schwarz: { name: 'Schwarz', css: 'linear-gradient(135deg,#2a2a2a,#111 60%,#262626)' },
	weiss: { name: 'Weiß', css: 'linear-gradient(135deg,#ffffff,#ecebe8 70%,#f7f6f3)' },
	eiche: { name: 'Eiche', css: 'repeating-linear-gradient(100deg,#c79b6b 0 3px,#bb8d5d 3px 5px,#cfa676 5px 9px)' },
	nuss: { name: 'Nussbaum', css: 'repeating-linear-gradient(100deg,#5e3d27 0 3px,#4f321f 3px 6px,#6a4630 6px 9px)' },
	gold: { name: 'Gold', css: 'linear-gradient(135deg,#c7a24f,#f0d98a 35%,#a8842f 65%,#e6c66d)' },
	alu: { name: 'Alu', css: 'linear-gradient(135deg,#d9dce0,#aeb2b8 40%,#eef0f2 60%,#b9bdc3)' },
	navy: { name: 'Navy', css: 'linear-gradient(135deg,#323a4c,#262c3a 60%,#2d3446)' }
};

export const SHIRTS = {
	weiss: { name: 'Weiß', c: '#f6f5f2' },
	sand: { name: 'Sand', c: '#e4d9c6' },
	grau: { name: 'Grau meliert', c: '#b8bbbf' },
	salbei: { name: 'Salbei', c: '#a9b59c' },
	navy: { name: 'Navy', c: '#262c3a' },
	bordeaux: { name: 'Bordeaux', c: '#6e2430' },
	schwarz: { name: 'Schwarz', c: '#1c1c1e' }
};

export const WALLS = {
	hell: { name: 'Hell', c: '#efece6' },
	beton: { name: 'Beton', c: '#c8c6c1' },
	salbei: { name: 'Salbei', c: '#b7c2ae' },
	terrakotta: { name: 'Terrakotta', c: '#d6b29a' },
	dunkel: { name: 'Dunkel', c: '#3b3f48' }
};

/**
 * Räume: Möbel in echten Maßen (cm), damit die Postergröße realistisch wirkt.
 * `top` = Höhe der Möbel, `gap` = Abstand bis zur Posterunterkante, `w` = Möbelbreite.
 */
export const ROOMS = {
	wohnen: { name: 'Sideboard', c: '#b88f63', w: 160, top: 75, gap: 28, surf: 67 },
	sofa: { name: 'Sofa', c: '#a9a196', w: 210, top: 85, gap: 26 },
	flur: { name: 'Flur', c: '#3c3a37', w: 100, top: 80, gap: 30, surf: 80 },
	buero: { name: 'Büro', c: '#d9cdb8', w: 140, top: 75, gap: 48, surf: 75 }
};

/** @param {any} S */
export function product(S) {
	return { type: 'gerahmt', frame: 'schwarz', mat: true, shirt: 'weiss', wall: 'hell', room: 'wohnen', model: false, ...(S && S.product) };
}

let url = '';
/** @type {string[]} */
let setUrls = [];
let motivKey = '';
let motivLauf = 0;
/** Schlüssel des Motivs: alles am Poster außer der Produktwahl */
function motivSchluessel() {
	const { product: _p, ...rest } = app.S;
	return JSON.stringify([rest, app.DATA && app.DATA.place, app.DATA && app.DATA.feats.length, schriftenDa()]);
}

/**
 * Passendes 3er-Set: Koordinaten-Poster, die eigene Karte, Sternenhimmel – gleicher Stil, gleiches Design.
 * @returns {string[]} Bild-Adressen [links, mitte, rechts]
 */
function setBilder() {
	const keep = app.S;
	const [lon, lat] = viewCenterLL();
	/** @param {(c:any)=>void} fn */
	const variante = (fn) => {
		const c = JSON.parse(JSON.stringify(keep));
		fn(c);
		app.S = c;
		try {
			fitPrint(c);
			clampView(c.view);
			return URL.createObjectURL(new Blob([buildSVG(true)], { type: 'image/svg+xml' }));
		} finally {
			app.S = keep;
		}
	};
	const links = variante((c) => {
		c.motif = 'koord';
		c.koord = c.koord || { lat: +lat.toFixed(5), lon: +lon.toFixed(5), text: '', align: 'mitte' };
		c.pins = [];
	});
	const mitte = keep.motif === 'karte' || !keep.motif ? url : variante((c) => (c.motif = 'karte'));
	const rechts = variante((c) => {
		c.motif = 'sterne';
		c.sky = c.sky || defaultSky(lat, lon);
		c.note = { on: true, text: skyLabel(c.sky), auto: true };
	});
	return [links, mitte, rechts];
}
let timer = 0;

/** Mockup neu zeichnen (verzögert, damit schnelles Tippen flüssig bleibt) */
export function scheduleMockup(delay = 120) {
	clearTimeout(timer);
	timer = window.setTimeout(renderMockup, delay);
}

export function renderMockup() {
	const box = document.getElementById('mkScene');
	if (!box || !app.DATA || !app.S || !document.body.classList.contains('mk-on')) return;
	const P = product(app.S);
	const g = geo();
	// Motiv nur neu malen, wenn sich am Poster etwas geändert hat (Produkt, Rahmen, Wandfarbe … nicht).
	// Früher hing hier jedes Mal die ganze Karte als SVG-Bild drin → bei Städten ≈ 0,4 s je Öffnen/Klick.
	const key = motivSchluessel();
	const fertig = key === motivKey; // auch wenn es gerade noch gemalt wird
	if (!fertig) {
		motivKey = key;
		const lauf = ++motivLauf;
		// nur so groß malen, wie das Poster in der Szene höchstens erscheint (Bildpunkte kosten Zeit)
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const lang = Math.max(480, Math.min(1400, Math.round(Math.max(box.clientWidth, box.clientHeight) * 0.75 * dpr)));
		const w = Math.round(g.W >= g.H ? lang : (lang * g.W) / g.H);
		const svg = buildSVG(true);
		// erst nach dem nächsten Bild malen → der Menüwechsel erscheint sofort
		new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 0)))
			.then(() => (lauf === motivLauf ? alsBild(svg, w) : Promise.reject()))
			.then((u) => {
				if (lauf !== motivLauf) return URL.revokeObjectURL(u);
				const vorher = url;
				url = u;
				box.querySelectorAll('.mk-img').forEach((el) => el.setAttribute(el.tagName === 'image' ? 'href' : 'src', u));
				box.querySelectorAll('.mk-set-img').forEach((el, i) => {
					if (!setUrls[i] || setUrls[i] === vorher) el.setAttribute('src', u);
				});
				if (vorher) setTimeout(() => URL.revokeObjectURL(vorher), 1000);
			})
			.catch(() => {});
	}
	const alteSet = setUrls;
	setUrls = [];
	const istSet = !!P.set && /^(poster|gerahmt|leinwand|alu)$/.test(P.type);
	if (istSet) {
		if (!skyReady()) loadSky().then(() => renderMockup());
		setUrls = setBilder();
	}
	let html = '';
	if (P.type === 'shirt') html = shirtScene(P);
	else if (P.type === 'tasse') html = mugScene();
	else if (P.type === 'download') html = downloadScene();
	else html = wallScene(P);
	box.innerHTML = html;
	const img = box.querySelector('.mk-img');
	// bis das neue Motiv fertig ist, bleibt das vorige stehen (kein leerer Rahmen)
	if (img && url) /** @type {HTMLImageElement|SVGImageElement} */ (img).setAttribute(img.tagName === 'image' ? 'href' : 'src', url);
	box.querySelectorAll('.mk-set-img').forEach((el) => el.setAttribute('src', setUrls[+(/** @type {HTMLElement} */ (el).dataset.i || 0)] || url));
	alteSet.forEach((u) => u !== url && setTimeout(() => URL.revokeObjectURL(u), 1000));
}

/** Möbel als SVG in cm (1 Einheit = 1 cm), unten bündig auf dem Boden */
const FURN = {
	wohnen: `<svg viewBox="0 -62 160 137" style="width:calc(var(--u)*160)"><defs><linearGradient id="fw1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#cfaa7f"/><stop offset="1" stop-color="#b08559"/></linearGradient></defs>
<rect x="0" y="8" width="160" height="56" rx="2.5" fill="url(#fw1)"/><rect x="0" y="8" width="160" height="2.2" rx="1" fill="#ddbf98"/>
<rect x="5" y="15" width="73" height="42" rx="1.5" fill="none" stroke="#000" stroke-opacity=".13"/><rect x="82" y="15" width="73" height="42" rx="1.5" fill="none" stroke="#000" stroke-opacity=".13"/>
<rect x="70" y="34" width="5" height="1.6" rx=".8" fill="#000" opacity=".25"/><rect x="85" y="34" width="5" height="1.6" rx=".8" fill="#000" opacity=".25"/>
<path d="M10 64l-2 11h3l3-11zM150 64l2 11h-3l-3-11z" fill="#8a6644"/>
<path d="M131 8c-6 0-8-5-7-11 1-5 4-8 7-8s6 3 7 8c1 6-1 11-7 11z" fill="#ece8e0"/><path d="M131-10c-2-14-9-26-16-34M131-10c1-17 4-30 9-42M131-10c4-12 11-20 17-24" fill="none" stroke="#6f7d5c" stroke-width=".9" stroke-linecap="round"/>
<g fill="#7f8f68"><ellipse cx="115" cy="-44" rx="3.2" ry="1.8" transform="rotate(-40 115 -44)"/><ellipse cx="140" cy="-52" rx="3.2" ry="1.8" transform="rotate(-70 140 -52)"/><ellipse cx="148" cy="-34" rx="3.2" ry="1.8" transform="rotate(-20 148 -34)"/><ellipse cx="121" cy="-31" rx="2.6" ry="1.5" transform="rotate(-50 121 -31)"/><ellipse cx="137" cy="-32" rx="2.6" ry="1.5" transform="rotate(-80 137 -32)"/></g>
<rect x="28" y="1" width="26" height="7" rx="1" fill="#4b5161"/><rect x="30" y="-4" width="22" height="5" rx="1" fill="#c6b9a4"/></svg>`,
	sofa: `<svg viewBox="0 0 210 85" style="width:calc(var(--u)*210)"><defs><linearGradient id="fs1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#b3ab9f"/><stop offset="1" stop-color="#9a9286"/></linearGradient></defs>
<rect x="14" y="10" width="182" height="46" rx="9" fill="url(#fs1)"/><rect x="0" y="34" width="26" height="42" rx="9" fill="#a39b8f"/><rect x="184" y="34" width="26" height="42" rx="9" fill="#a39b8f"/>
<rect x="22" y="48" width="83" height="26" rx="6" fill="#b8b0a4"/><rect x="105" y="48" width="83" height="26" rx="6" fill="#b4aca0"/>
<rect x="30" y="22" width="40" height="30" rx="7" fill="#d8cfbf" transform="rotate(-6 50 37)"/><rect x="142" y="22" width="38" height="29" rx="7" fill="#7b8b7a" transform="rotate(5 161 36)"/>
<path d="M12 76h6l-1 9h-4zM192 76h6l-1 9h-4z" fill="#5a4a3a"/></svg>`,
	flur: `<svg viewBox="-40 -50 175 130" style="width:calc(var(--u)*175);margin-left:calc(var(--u)*-15)"><rect x="0" y="0" width="100" height="4" rx="1" fill="#3c3a37"/><rect x="4" y="4" width="92" height="12" fill="#4a4743"/>
<path d="M6 16l2 64h2.5l1-64zM94 16l-2 64h-2.5l-1-64z" fill="#2e2c2a"/><rect x="10" y="56" width="80" height="2" fill="#2e2c2a"/>
<ellipse cx="72" cy="-3" rx="11" ry="3" fill="#cdbfa8"/><rect x="18" y="-26" width="16" height="26" rx="2" fill="#e9e4da"/><rect x="21" y="-23" width="10" height="20" fill="#cfc6b6"/>
<path d="M-30 80l4-34h24l4 34z" fill="#c9b7a0"/><path d="M-14 46c-2-20-14-30-22-36M-14 46c0-22 6-38 12-46M-14 46c4-16 14-24 22-28" fill="none" stroke="#5c7052" stroke-width="1.4" stroke-linecap="round"/>
<g fill="#6d8463"><ellipse cx="-34" cy="12" rx="5" ry="2.4" transform="rotate(-35 -34 12)"/><ellipse cx="-3" cy="2" rx="5" ry="2.4" transform="rotate(-75 -3 2)"/><ellipse cx="7" cy="19" rx="5" ry="2.4" transform="rotate(-15 7 19)"/><ellipse cx="-24" cy="26" rx="4" ry="2" transform="rotate(-50 -24 26)"/><ellipse cx="-8" cy="22" rx="4" ry="2" transform="rotate(-85 -8 22)"/></g></svg>`,
	buero: `<svg viewBox="0 -48 140 123" style="width:calc(var(--u)*140)"><rect x="0" y="0" width="140" height="4" rx="1" fill="#d9cdb8"/><path d="M6 4h4v71H6zM130 4h4v71h-4z" fill="#3b3f48"/>
<path d="M112 0l2-3h12l2 3z" fill="#3b3f48"/><path d="M120-3L108-34l-14 8" fill="none" stroke="#3b3f48" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M96-34l-9 9 6 2 8-7z" fill="#3b3f48"/><ellipse cx="90" cy="-23" rx="6" ry="1.6" fill="#fff6d6" opacity=".9"/>
<path d="M30 0h44l-3-2H33z" fill="#9aa0aa"/><path d="M34-2l-3-26h42l-3 26z" fill="#c7ccd3"/><path d="M36-4l-2.4-21h37l-2.4 21z" fill="#262c3a"/>
<rect x="84" y="-9" width="14" height="9" rx="1" fill="#b0784f"/><path d="M98-7c3 0 3 5 0 5" fill="none" stroke="#b0784f" stroke-width="1.2"/>
<path d="M40 30c0-8 5-12 12-12h36c7 0 12 4 12 12v45H40z" fill="#4b5161" opacity=".9"/></svg>`
};

/** @param {any} P */
function wallScene(P) {
	const wall = (WALLS[/** @type {keyof typeof WALLS} */ (P.wall)] || WALLS.hell).c;
	const frame = FRAMES[/** @type {keyof typeof FRAMES} */ (P.frame)] || FRAMES.schwarz;
	const auf = P.type === 'aufsteller';
	// Der Aufsteller steht auf einem Möbel – auf dem Sofa geht das nicht, dann Sideboard
	let roomKey = /** @type {keyof typeof ROOMS} */ (ROOMS[/** @type {keyof typeof ROOMS} */ (P.room)] ? P.room : 'wohnen');
	if (auf && roomKey === 'sofa') roomKey = 'wohnen';
	const R = ROOMS[roomKey];
	const framed = P.type === 'gerahmt' || auf;
	const Z = auf ? { w: 14.8, h: 21, name: 'A5' } : paperOrFree(app.S);
	const fixed = auf || !!paper(app.S);
	const extra = auf ? 2 * 1.4 : framed ? 2 * 2.4 + (P.mat ? 2 * 5 : 0) : 0; // Rahmen + Passepartout in cm
	const wcm = Z.w + extra,
		hcm = Z.h + extra;
	// surf = Höhe der Abstellfläche (Oberkante Möbel ohne Deko)
	const B = auf ? /** @type {any} */ (R).surf ?? R.top : R.top + R.gap;
	const set = !!P.set && !auf;
	const luecke = Math.max(6, Z.w * 0.18); // Abstand zwischen den Postern im Set (cm)
	const gesamt = set ? wcm * 3 + luecke * 2 : wcm; // Unterkante über dem Boden (cm); der Aufsteller steht direkt auf dem Möbel
	// Maßstab: alles passt hinein – kleine Poster werden etwas näher „fotografiert“ (Möbel ragen dann unten heraus)
	const uh = Math.max(80 / (B + hcm + 10), Math.min(44 / hcm, 1.6));
	const uw = (set ? 88 : 72) / gesamt;
	const cls = `mk-art mk-${auf ? 'gerahmt mk-auf' : P.type}${framed && P.mat && !auf ? ' mk-matted' : ''}`;
	const paperBg = (app.S.lay && app.S.lay.papier) || (app.S.bg && app.S.bg !== 'none' ? app.S.bg : '#ffffff');
	const dims = `${String(Z.w).replace('.', ',')} × ${String(Z.h).replace('.', ',')} cm`;
	const label = !fixed ? 'ca. ' + dims : /^\d/.test(Z.name) ? dims : `${Z.name.replace(' quer', '')} · ${dims}`;
	return `<div class="mk-room mk-r-${roomKey}" style="--wall:${wall};--u:min(${uh.toFixed(3)}cqh,${uw.toFixed(3)}cqw);--ft:min(12cqh,calc(90cqh - var(--u) * ${(B + hcm).toFixed(1)}));--wcm:${Z.w};--hcm:${Z.h};--b:${B}">
<div class="mk-light"></div>
<div class="mk-floor"></div>
<div class="mk-furn">${FURN[roomKey]}</div>
${
		set
			? `<div class="mk-set" style="--gap:${luecke}">${[0, 1, 2].map((i) => `<div class="${cls}" style="${framed ? `--frame:${frame.css};` : ''}--paper:${paperBg}"><div class="mk-paper"><img class="mk-set-img" data-i="${i}" alt="Poster ${i + 1} des Sets"></div></div>`).join('')}</div>`
			: `<div class="${cls}" style="${framed ? `--frame:${frame.css};` : ''}--paper:${paperBg}"><div class="mk-paper"><img class="mk-img" alt="Vorschau deines Motivs"></div></div>`
	}
<div class="mk-size">${set ? '3er-Set · je ' : ''}${label}</div>
</div>`;
}

/** Download: Motiv als Datei, mit den Formaten darunter */
function downloadScene() {
	return `<div class="mk-studio mk-dl"><div class="mk-dl-card"><img class="mk-img" alt="Vorschau deines Motivs"><div class="mk-dl-files"><span>PDF</span><span>PNG</span><span>SVG</span></div><p>Sofort nach dem Kauf · zum Selbstdrucken</p></div></div>`;
}

/** @param {any} P */
function shirtScene(P) {
	const c = (SHIRTS[/** @type {keyof typeof SHIRTS} */ (P.shirt)] || SHIRTS.weiss).c;
	const m = !!P.model;
	// Am Model: schlichte, flache Figur (Kopf, Hals, Arme) hinter dem Shirt
	const model = m
		? `<path d="M36 184L92 236L104 330Q108 372 96 398Q84 410 70 404Q58 396 60 372L56 300Z" fill="#e2b896"/><path d="M464 184L408 236L396 330Q392 372 404 398Q416 410 430 404Q442 396 440 372L444 300Z" fill="#e2b896"/>
<path d="M222 -8h56v62h-56z" fill="#d9ab87"/><ellipse cx="250" cy="-70" rx="62" ry="76" fill="#e8c09f"/>
<path d="M186 -78c-6-60 30-92 70-90 44 2 70 34 62 92-8-22-26-40-58-44-32 4-60 18-74 42z" fill="#3b2f2a"/>`
		: '';
	return `<div class="mk-studio"><svg class="mk-shirt${m ? ' mk-model' : ''}" viewBox="${m ? '0 -170 500 730' : '0 0 500 560'}" role="img" aria-label="T-Shirt-Vorschau">${model}
<defs>
<linearGradient id="mkFold" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<clipPath id="mkBody"><path d="M190 40C210 70 290 70 310 40L385 68L470 180L408 238L392 222L392 540L108 540L108 222L92 238L30 180L115 68Z"/></clipPath>
</defs>
<ellipse cx="250" cy="548" rx="170" ry="10" fill="#000" opacity=".08"/>
<path d="M190 40C210 70 290 70 310 40L385 68L470 180L408 238L392 222L392 540L108 540L108 222L92 238L30 180L115 68Z" fill="${c}"/>
<g clip-path="url(#mkBody)">
<image class="mk-img" x="160" y="112" width="180" height="250" preserveAspectRatio="xMidYMin meet"/>
<rect width="500" height="560" fill="url(#mkFold)"/>
</g>
<path d="M190 40C210 78 290 78 310 40C292 60 208 60 190 40Z" fill="#000" opacity=".14"/>
<path d="M115 68L30 180L92 238M385 68L470 180L408 238" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="2"/>
</svg></div>`;
}

function mugScene() {
	return `<div class="mk-studio mk-table"><svg class="mk-mug" viewBox="0 0 500 420" role="img" aria-label="Tassen-Vorschau">
<defs>
<linearGradient id="mkCyl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".36" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
<clipPath id="mkMugBody"><path d="M110 72V318Q110 346 225 348Q340 346 340 318V72Z"/></clipPath>
</defs>
<ellipse cx="236" cy="352" rx="150" ry="16" fill="#000" opacity=".12"/>
<path d="M336 118C428 104 436 268 336 262" fill="none" stroke="#e9e8e4" stroke-width="30" stroke-linecap="round"/>
<path d="M336 118C428 104 436 268 336 262" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="30" stroke-linecap="round"/>
<path d="M110 72V318Q110 346 225 348Q340 346 340 318V72Z" fill="#fbfbf9"/>
<g clip-path="url(#mkMugBody)">
<image class="mk-img" x="128" y="98" width="194" height="226" preserveAspectRatio="xMidYMid meet"/>
<rect x="100" y="60" width="250" height="300" fill="url(#mkCyl)"/>
</g>
<ellipse cx="225" cy="72" rx="115" ry="17" fill="#f3f2ee"/>
<ellipse cx="225" cy="74" rx="104" ry="12" fill="#2b2420"/>
<ellipse cx="225" cy="72" rx="115" ry="17" fill="none" stroke="#000" stroke-opacity=".08"/>
</svg></div>`;
}
