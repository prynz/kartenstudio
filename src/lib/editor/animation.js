// Sanfte Übergänge für die Bedienoberfläche.
// Grundsatz: Animationen sind kurz (≈ 0,2–0,3 s), folgen einer weichen
// Kurve und werden abgeschaltet, wenn das Gerät „Bewegung reduzieren“ wünscht.

export const EASE = 'cubic-bezier(.2,.8,.2,1)';

export function reducedMotion() {
	return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Akkordeon-Schritte der Seitenleiste auf- und zuklappen.
 * `change` ändert die Klassen (`open`); danach werden alle Abschnitte,
 * deren Zustand sich geändert hat, in der Höhe animiert.
 * @param {() => void} change
 */
export function animateSections(change) {
	const secs = [...document.querySelectorAll('.sec')];
	const before = secs.map((s) => {
		const sb = /** @type {HTMLElement|null} */ (s.querySelector(':scope > .sb'));
		return { s, sb, open: s.classList.contains('open'), h: sb ? sb.offsetHeight : 0 };
	});
	change();
	if (reducedMotion()) return;
	for (const b of before) {
		const nowOpen = b.s.classList.contains('open');
		if (!b.sb || nowOpen === b.open) continue;
		const sb = b.sb;
		sb.getAnimations().forEach((a) => a.cancel());
		if (nowOpen) {
			const h = sb.offsetHeight;
			sb.style.overflow = 'hidden';
			const a = sb.animate(
				[
					{ height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' },
					{ height: h + 'px', opacity: 1 }
				],
				{ duration: 300, easing: EASE }
			);
			a.onfinish = a.oncancel = () => (sb.style.overflow = '');
		} else {
			sb.classList.add('closing');
			const a = sb.animate(
				[
					{ height: b.h + 'px', opacity: 1 },
					{ height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }
				],
				{ duration: 240, easing: EASE }
			);
			a.onfinish = a.oncancel = () => sb.classList.remove('closing');
		}
	}
}

/** Startseite ausblenden, Poster weich erscheinen lassen. */
export function revealEditor() {
	const landing = document.getElementById('landing');
	const poster = document.getElementById('poster');
	if (!landing) return;
	const wasVisible = !landing.classList.contains('hidden');
	if (!wasVisible || reducedMotion()) {
		landing.classList.add('hidden');
		return;
	}
	const a = landing.animate(
		[
			{ opacity: 1, transform: 'none' },
			{ opacity: 0, transform: 'scale(1.02)' }
		],
		{ duration: 260, easing: EASE }
	);
	a.onfinish = () => landing.classList.add('hidden');
	poster?.animate(
		[
			{ opacity: 0, transform: 'translateY(14px) scale(.97)' },
			{ opacity: 1, transform: 'none' }
		],
		{ duration: 520, delay: 120, easing: EASE, fill: 'backwards' }
	);
}
