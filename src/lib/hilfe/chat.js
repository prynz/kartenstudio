// Hilfe-Chat: beantwortet Kundenfragen.
// Ohne Server: eingebauter Antwort-Bot (Stichwort-Suche im Wissen, sofort, kostenlos).
// Mit Server (KONFIG.chatApi gesetzt): echte KI-Antworten über server/chat-worker – fällt bei Fehlern auf den eingebauten Bot zurück.
import { FAQ } from './wissen.js';
import { KONFIG } from '../konfig.js';
import { app as appUntyped } from '../editor/app.js';
import { goStep, enableSky } from '../editor/assistent.js';
import { EASE, reducedMotion } from '../editor/animation.js';

/** @type {any} */
const app = appUntyped;
/** @type {{role:'user'|'assistant', content:string}[]} */
const verlauf = [];
let offen = false;

/** Text vereinfachen für den Vergleich @param {string} s */
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}€ ]+/gu, ' ').replace(/\s+/g, ' ').trim();

/**
 * Passende Antworten im Wissen finden (beste zuerst).
 * @param {string} frage
 */
export function finde(frage) {
	const t = ' ' + norm(frage) + ' ';
	const words = t.trim().split(' ').filter((w) => w.length > 3);
	return FAQ.map((f) => {
		let s = 0;
		f.k.forEach((k) => {
			const kk = norm(k);
			if (t.includes(' ' + kk) || (kk.length > 4 && t.includes(kk))) s += kk.includes(' ') ? 3 : 2;
		});
		// leichte Zusatzpunkte für Wörter aus der Beispielfrage
		const q = norm(f.q);
		words.forEach((w) => q.includes(w) && (s += 0.5));
		return { f, s };
	})
		.filter((x) => x.s >= 2)
		.sort((a, b) => b.s - a.s)
		.map((x) => x.f);
}

/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/**
 * Nachricht ins Fenster schreiben (immer als reiner Text – nie als HTML).
 * @param {'bot'|'du'} wer @param {string} text @param {import('./wissen.js').Faq['act'][]} [aktionen] @param {string[]} [vorschlaege]
 */
function zeige(wer, text, aktionen = [], vorschlaege = []) {
	const box = $('chatLog');
	const m = document.createElement('div');
	m.className = 'cm cm-' + wer;
	const p = document.createElement('p');
	p.textContent = text;
	m.appendChild(p);
	aktionen.filter(Boolean).forEach((a) => {
		if (!a) return;
		const b = document.createElement('button');
		b.type = 'button';
		b.className = 'cm-act';
		b.textContent = a.label + ' ›';
		b.onclick = () => aktion(a);
		m.appendChild(b);
	});
	if (vorschlaege.length) {
		const v = document.createElement('div');
		v.className = 'cm-vor';
		vorschlaege.forEach((q) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.textContent = q;
			b.onclick = () => frage(q);
			v.appendChild(b);
		});
		m.appendChild(v);
	}
	box.appendChild(m);
	if (!reducedMotion()) m.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE });
	box.scrollTop = box.scrollHeight;
}

/** Knopf in einer Antwort: zum passenden Schritt springen @param {any} a */
function aktion(a) {
	if (!app.DATA) {
		zeige('bot', 'Such zuerst einen Ort oder öffne das Beispiel – dann bringe ich dich direkt hin.');
		return;
	}
	if (a.do === 'sterne') {
		goStep('stil');
		enableSky();
	} else if (a.step) goStep(a.step);
	if (matchMedia('(max-width: 900px)').matches) oeffne(false);
}

/** Antwort aus dem eingebauten Wissen @param {string} q */
function lokaleAntwort(q) {
	const treffer = finde(q);
	if (!treffer.length) {
		zeige('bot', 'Dazu weiß ich leider (noch) nichts Genaues. Vielleicht hilft dir eine dieser Fragen – oder schreib uns, die Kontaktdaten stehen im Impressum.', [], ['Was kostet ein Poster?', 'Welche Größen gibt es?', 'Kann ich direkt bestellen?']);
		return;
	}
	const [f, ...rest] = treffer;
	zeige('bot', f.a, f.act ? [f.act] : [], rest.slice(0, 2).map((r) => r.q));
}

/** Frage stellen @param {string} q */
async function frage(q) {
	q = q.trim().slice(0, 500);
	if (!q) return;
	zeige('du', q);
	verlauf.push({ role: 'user', content: q });
	const inp = /** @type {HTMLInputElement} */ ($('chatIn'));
	inp.value = '';
	if (KONFIG.chatApi) {
		$('chatLog').classList.add('tippt');
		try {
			const r = await fetch(KONFIG.chatApi, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: verlauf.slice(-10), schritt: app.wizStep || '' })
			});
			if (!r.ok) throw new Error('HTTP ' + r.status);
			const j = await r.json();
			const text = String(j.reply || '').slice(0, 2000);
			if (!text) throw new Error('leer');
			verlauf.push({ role: 'assistant', content: text });
			// Passenden Knopf aus dem Wissen anbieten, wenn die Frage klar zu einem Thema passt
			const t = finde(q)[0];
			zeige('bot', text, t && t.act ? [t.act] : []);
			return;
		} catch (e) {
			console.warn('KI-Chat nicht erreichbar, nutze eingebautes Wissen', e);
		} finally {
			$('chatLog').classList.remove('tippt');
		}
	}
	lokaleAntwort(q);
}

/** Fenster öffnen/schließen @param {boolean} [an] */
export function oeffne(an = !offen) {
	offen = an;
	const p = $('chat');
	p.classList.toggle('on', an);
	p.setAttribute('aria-hidden', String(!an));
	$('chatBtn').setAttribute('aria-expanded', String(an));
	if (an) {
		if (!$('chatLog').children.length)
			zeige(
				'bot',
				KONFIG.chatApi ? 'Hallo! Ich bin der KI-Assistent von Kartenstudio. Frag mich alles rund um dein Poster.' : 'Hallo! Ich helfe dir bei Fragen rund um dein Poster. Tippe eine Frage oder wähle eine:',
				[],
				['Wie funktioniert Kartenstudio?', 'Was kostet ein Poster?', 'Gibt es einen Sternenhimmel?', 'Ist die Datei gut genug für den Druck?']
			);
		if (!reducedMotion()) p.animate([{ opacity: 0, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE });
		setTimeout(() => /** @type {HTMLInputElement} */ ($('chatIn')).focus({ preventScroll: true }), 50);
	}
}

export function initChat() {
	$('chatBtn').onclick = () => oeffne();
	$('chatX').onclick = () => oeffne(false);
	$('chatForm').addEventListener('submit', (e) => {
		e.preventDefault();
		frage(/** @type {HTMLInputElement} */ ($('chatIn')).value);
	});
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && offen) oeffne(false);
	});
	$('chatMode').textContent = KONFIG.chatApi ? 'KI-Assistent · Beta' : 'Antwortet sofort';
}
