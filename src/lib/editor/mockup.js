// Produkt-Mockups: zeigt das Motiv live als Poster an der Wand (mit/ohne Rahmen),
// Leinwand, T-Shirt oder Tasse. Die Szenen sind selbst gezeichnet (HTML/SVG),
// es werden keine fremden Bilder oder Dienste gebraucht.
import { app as appUntyped } from './app.js';
import { buildSVG, geo } from './zeichnen.js';

/** @type {any} */
const app = appUntyped;

/** Produktarten */
export const PRODUCTS = {
	poster: { name: 'Poster', desc: 'Matt, auf hochwertigem Papier' },
	gerahmt: { name: 'Mit Rahmen', desc: 'Fertig gerahmt zum Aufhängen' },
	leinwand: { name: 'Leinwand', desc: 'Auf Keilrahmen gespannt' },
	shirt: { name: 'T-Shirt', desc: 'Bio-Baumwolle, Motiv auf der Brust' },
	tasse: { name: 'Tasse', desc: 'Keramik, spülmaschinenfest' }
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

/** @param {any} S */
export function product(S) {
	return { type: 'gerahmt', frame: 'schwarz', mat: true, shirt: 'weiss', wall: 'hell', ...(S && S.product) };
}

let url = '';
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
	const old = url;
	url = URL.createObjectURL(new Blob([buildSVG(true)], { type: 'image/svg+xml' }));
	const r = (g.H / g.W).toFixed(4); // Seitenverhältnis des Motivs
	let html = '';
	if (P.type === 'shirt') html = shirtScene(P);
	else if (P.type === 'tasse') html = mugScene();
	else html = wallScene(P, r);
	box.innerHTML = html;
	const img = box.querySelector('.mk-img');
	if (img) /** @type {HTMLImageElement|SVGImageElement} */ (img).setAttribute(img.tagName === 'image' ? 'href' : 'src', url);
	if (old) setTimeout(() => URL.revokeObjectURL(old), 1000);
}

/** @param {any} P @param {string} r */
function wallScene(P, r) {
	const wall = (WALLS[/** @type {keyof typeof WALLS} */ (P.wall)] || WALLS.hell).c;
	const frame = FRAMES[/** @type {keyof typeof FRAMES} */ (P.frame)] || FRAMES.schwarz;
	const framed = P.type === 'gerahmt';
	const cls = `mk-art mk-${P.type}${framed && P.mat ? ' mk-matted' : ''}`;
	return `<div class="mk-room" style="--wall:${wall};--r:${r}">
<div class="mk-light"></div>
<div class="mk-floor"></div>
<div class="mk-side"><i></i><i></i></div>
<div class="mk-vase"><b></b><span></span><span></span><span></span></div>
<div class="${cls}" style="${framed ? `--frame:${frame.css}` : ''}"><div class="mk-paper"><img class="mk-img" alt="Vorschau deines Motivs"></div></div>
</div>`;
}

/** @param {any} P */
function shirtScene(P) {
	const c = (SHIRTS[/** @type {keyof typeof SHIRTS} */ (P.shirt)] || SHIRTS.weiss).c;
	return `<div class="mk-studio"><svg class="mk-shirt" viewBox="0 0 500 560" role="img" aria-label="T-Shirt-Vorschau">
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
