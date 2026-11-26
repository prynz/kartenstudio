// Hinweis auf eine neue Version: Die App speichert sich für den Offline-Betrieb im Browser.
// Eine neue Version wird im Hintergrund geladen, greift aber erst nach dem Neuladen der Seite.
// Ohne Hinweis sieht man sonst noch eine Weile den alten Stand (z. B. entfernte Bereiche).

let gezeigt = false;

/** Leiste oben: „Neue Version verfügbar – Neu laden“ */
function zeigen() {
	if (gezeigt) return;
	gezeigt = true;
	const el = document.createElement('div');
	el.className = 'update-hinweis';
	el.setAttribute('role', 'status');
	el.innerHTML = '<span>Neue Version verfügbar <small>Dein Entwurf bleibt gespeichert.</small></span><button type="button">Neu laden</button><button type="button" class="zu" aria-label="Schließen">✕</button>';
	const st = document.createElement('style');
	st.textContent =
		'.update-hinweis{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:10px;background:#262c3a;color:#fff;font:500 13px/1.3 system-ui,sans-serif;padding:8px 8px 8px 16px;border-radius:999px;box-shadow:0 10px 30px rgba(20,24,35,.28);max-width:calc(100% - 24px);animation:upd-in .28s cubic-bezier(.2,.8,.2,1)}' +
		'.update-hinweis small{display:block;opacity:.7;font-size:11px;font-weight:400}' +
		'.update-hinweis button{all:unset;cursor:pointer;background:#fff;color:#262c3a;font-weight:600;padding:7px 14px;border-radius:999px;white-space:nowrap}' +
		'.update-hinweis button.zu{background:transparent;color:#fff;padding:7px 9px;opacity:.75}' +
		'@keyframes upd-in{from{opacity:0;transform:translate(-50%,-8px)}}' +
		'@media (prefers-reduced-motion:reduce){.update-hinweis{animation:none}}';
	document.head.appendChild(st);
	const [neu, zu] = el.querySelectorAll('button');
	neu.addEventListener('click', () => location.reload());
	zu.addEventListener('click', () => el.remove());
	document.body.appendChild(el);
}

/** Beim Start aufrufen: meldet neue Versionen und schaut regelmäßig nach */
export function updateHinweis() {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
	const sw = navigator.serviceWorker;
	// Beim allerersten Besuch übernimmt der Speicher die Seite auch – das ist keine neue Version
	const hatte = !!sw.controller;
	sw.addEventListener('controllerchange', () => {
		if (hatte) zeigen();
	});
	const pruefen = () => sw.getRegistration().then((r) => r && r.update()).catch(() => {});
	// Wer die Seite offen lässt und zurückkommt, bekommt neue Versionen auch mit
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') pruefen();
	});
	setInterval(pruefen, 30 * 60 * 1000);
}
