// Handy-Ansicht: Einstellungen als Leiste von unten („Bottom-Sheet“).
// Das Poster bleibt oben immer sichtbar; die Leiste scrollt für sich allein.
// Am Griff zieht man sie größer/kleiner, sie rastet an drei Höhen ein.
import { zoom } from './ansicht.js';
import { reducedMotion } from './animation.js';

const MOBILE = '(max-width: 900px)';
const SNAPS = [0.3, 0.58, 0.76]; // Anteil der verfügbaren Höhe
let snap = 1; // Start: mittlere Höhe

const isMobile = () => matchMedia(MOBILE).matches;

/** Verfügbare Höhe unter der Kopfzeile. */
function avail() {
	const app = document.querySelector('.app');
	return app ? app.clientHeight : window.innerHeight;
}

/** @param {number} px @param {boolean} animate */
function apply(px, animate) {
	const side = document.getElementById('side');
	if (!side) return;
	side.classList.toggle('sheet-anim', !!animate && !reducedMotion());
	side.style.setProperty('--sheet', Math.round(px) + 'px');
	const grip = document.getElementById('sheetGrip');
	if (grip) grip.setAttribute('aria-valuenow', String(Math.round((100 * px) / avail())));
}

/** @param {number} i */
function setSnap(i, animate = true) {
	snap = Math.max(0, Math.min(SNAPS.length - 1, i));
	// Bei großer Leiste die Werkzeugleiste ausblenden, damit das Poster Platz hat
	document.body.classList.toggle('sheet-big', snap === SNAPS.length - 1);
	apply(SNAPS[snap] * avail(), animate);
}

/**
 * Einstellungen am Handy öffnen/schließen. Geschlossen: Das Poster füllt den Bildschirm,
 * unten bleibt nur die Werkzeugleiste (wie bei Foto-Apps und Cartida/mapposter).
 * @param {boolean} on
 */
export function sheetZeigen(on) {
	if (!isMobile()) return;
	const zu = document.body.classList.contains('sheet-zu');
	if (on === !zu) return;
	const side = document.getElementById('side');
	if (side) side.classList.toggle('sheet-anim', !reducedMotion());
	document.body.classList.toggle('sheet-zu', !on);
	if (on) setSnap(Math.max(1, snap), true);
}
export const sheetOffen = () => !isMobile() || !document.body.classList.contains('sheet-zu');

/** Abschnitt in der Leiste nach oben holen, damit man seinen Inhalt sieht. */
/** @param {Element | null} sec */
export function revealSection(sec) {
	const side = document.getElementById('side');
	if (!side || !sec) return;
	const grip = document.getElementById('sheetGrip');
	const off = grip && isMobile() ? grip.offsetHeight : 0;
	// Abschnitte darüber, die gerade zuklappen, zählen schon mit ihrer Endhöhe (0)
	let closing = 0;
	for (let el = sec.previousElementSibling; el; el = el.previousElementSibling) {
		const sb = el.querySelector(':scope > .sb.closing');
		if (sb) closing += /** @type {HTMLElement} */ (sb).offsetHeight;
	}
	const top = Math.max(0, /** @type {HTMLElement} */ (sec).offsetTop - closing - off);
	// nur scrollen, wenn der Abschnittskopf nicht schon oben im sichtbaren Bereich ist
	if (top < side.scrollTop || top > side.scrollTop + side.clientHeight * 0.35) {
		side.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
	}
}

export function initSheet() {
	const side = document.getElementById('side');
	const grip = document.getElementById('sheetGrip');
	const canvas = document.getElementById('canvas');
	if (!side || !grip || !canvas) return;

	setSnap(snap, false);
	// Start am Handy: Poster groß, Einstellungen zu – ein Tipp auf ein Werkzeug öffnet sie
	if (isMobile()) document.body.classList.add('sheet-zu');

	// Poster an den freien Platz anpassen, sobald sich die Fläche ändert
	new ResizeObserver(() => zoom()).observe(canvas);
	window.addEventListener('resize', () => setSnap(snap, false));

	/** @type {{y:number,h:number,t:number,moved:boolean,lastY:number,lastT:number,v:number} | null} */
	let drag = null;
	grip.addEventListener('pointerdown', (e) => {
		if (!isMobile()) return;
		drag = { y: e.clientY, h: side.getBoundingClientRect().height, t: performance.now(), moved: false, lastY: e.clientY, lastT: performance.now(), v: 0 };
		grip.setPointerCapture(e.pointerId);
		document.body.classList.add('sheet-dragging');
		e.preventDefault();
	});
	grip.addEventListener('pointermove', (e) => {
		if (!drag) return;
		const dy = e.clientY - drag.y;
		if (Math.abs(dy) > 4) drag.moved = true;
		const now = performance.now();
		drag.v = (e.clientY - drag.lastY) / Math.max(1, now - drag.lastT); // px/ms, positiv = nach unten
		drag.lastY = e.clientY;
		drag.lastT = now;
		const A = avail();
		const h = Math.max(A * 0.18, Math.min(A * 0.88, drag.h - dy));
		apply(h, false);
	});
	const end = () => {
		if (!drag) return;
		const d = drag;
		drag = null;
		document.body.classList.remove('sheet-dragging');
		if (!d.moved) {
			// Antippen: zwischen klein und mittel/groß wechseln
			setSnap(snap === 0 ? 1 : snap === 1 ? 2 : 0);
			return;
		}
		const A = avail();
		const h = side.getBoundingClientRect().height / A;
		const nearest = SNAPS.reduce((b, s, i) => (Math.abs(s - h) < Math.abs(SNAPS[b] - h) ? i : b), 0);
		if (d.v < -0.5) {
			// schnell nach oben gewischt → nächste größere Stufe
			const i = SNAPS.findIndex((s) => s > h + 0.02);
			setSnap(i < 0 ? SNAPS.length - 1 : i);
		} else if (d.v > 0.5) {
			// schnell nach unten gewischt → nächste kleinere Stufe
			let i = -1;
			SNAPS.forEach((s, k) => { if (s < h - 0.02) i = k; });
			// ganz unten schnell nach unten gewischt → Einstellungen schließen
			if (i < 0 && h < SNAPS[0] + 0.04) return sheetZeigen(false);
			setSnap(i < 0 ? 0 : i);
		} else setSnap(nearest);
	};
	grip.addEventListener('pointerup', end);
	grip.addEventListener('pointercancel', end);
	grip.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowUp') setSnap(snap + 1);
		else if (e.key === 'ArrowDown') setSnap(snap - 1);
		else return;
		e.preventDefault();
	});
}

