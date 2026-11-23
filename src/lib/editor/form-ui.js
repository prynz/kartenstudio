// Bedienung „Eigene Form“ (Bereich Design): Bild hochladen oder Buchstabe/Zahl als Form.
import { app as appUntyped } from './app.js';
import { change } from './zustand.js';
import { msg } from './ansicht.js';
import { aktuelleForm } from './zeichnen.js';
import { bildLaden, formAusMaske, maske, textForm, formPfad, zuletzt } from './silhouette.js';
import { pickDesign, smooth } from './assistent.js';

/** @type {any} */
const app = appUntyped;
/** @param {string} id */
const $ = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/** Zuletzt hochgeladenes Bild (nur im Speicher – zum Nachjustieren von Schwelle/Umkehren) @type {ImageData|null} */
let bild = null;

/** Neue Form übernehmen: Seitenverhältnis anpassen, Design „Eigene Form“ sicherstellen @param {any} F */
function setzen(F) {
	if (!F) return msg('In diesem Bild wurde keine Form gefunden – probier „Umkehren“ oder ein Bild mit klarem Umriss.', 'warn');
	smooth(() =>
		change(() => {
			const S = app.S;
			S.form = F;
			const D = S.lay && S.lay.shape === 'eigen' ? S.design : 'silhouette';
			pickDesign(S, D);
		})
	);
}
function ausBild() {
	if (!bild) return;
	const um = /** @type {HTMLInputElement} */ ($('wzFormUm')).checked;
	const sw = +(/** @type {HTMLInputElement} */ ($('wzFormSchw')).dataset.eigen || -1);
	const m = maske(bild, { umkehren: um, schwelle: sw });
	const F = formAusMaske(m, bild.width, bild.height);
	setzen(F);
	const r = /** @type {HTMLInputElement} */ ($('wzFormSchw'));
	if (zuletzt.schwelle >= 0 && r.dataset.eigen == null) r.value = String(zuletzt.schwelle);
	$('wzFormSchwRow').classList.toggle('hidden', zuletzt.schwelle < 0);
}

export function initForm() {
	$('wzFormDatei').addEventListener('change', async (e) => {
		const inp = /** @type {HTMLInputElement} */ (e.target);
		const f = inp.files && inp.files[0];
		inp.value = '';
		if (!f) return;
		try {
			bild = await bildLaden(f);
		} catch (err) {
			return msg('Dieses Bild konnte nicht gelesen werden.', 'warn');
		}
		/** @type {HTMLInputElement} */ ($('wzFormUm')).checked = false;
		delete (/** @type {HTMLInputElement} */ ($('wzFormSchw')).dataset.eigen);
		$('wzFormBildOpt').classList.remove('hidden');
		ausBild();
	});
	$('wzFormUm').addEventListener('change', ausBild);
	const r = /** @type {HTMLInputElement} */ ($('wzFormSchw'));
	r.addEventListener('change', () => {
		r.dataset.eigen = r.value;
		ausBild();
	});
	const text = () => {
		const t = /** @type {HTMLInputElement} */ ($('wzFormText')).value.trim();
		if (!t) return;
		bild = null;
		$('wzFormBildOpt').classList.add('hidden');
		document.fonts.load('60px SgXB').then(() => setzen(textForm(t)));
	};
	$('wzFormTextGo').addEventListener('click', text);
	$('wzFormText').addEventListener('keydown', (e) => e.key === 'Enter' && text());
	$('wzFormWeg').addEventListener('click', () => {
		bild = null;
		$('wzFormBildOpt').classList.add('hidden');
		smooth(() =>
			change(() => {
				delete app.S.form;
				pickDesign(app.S, app.S.design);
			})
		);
	});
}

let vorKey = '';
/** Vorschau der Form im Bedienfeld */
export function syncForm() {
	const S = app.S;
	const an = !!(S && S.lay && S.lay.shape === 'eigen');
	$('wzForm').classList.toggle('hidden', !an);
	if (!an) return;
	const F = aktuelleForm(S);
	$('wzFormWeg').classList.toggle('hidden', !S.form);
	const key = F ? F.ringe.length + ':' + F.ringe[0].length + ':' + F.a : '';
	if (key === vorKey) return;
	vorKey = key;
	$('wzFormBild').innerHTML = F ? `<path d="${formPfad(F, 100, 100)}" fill="currentColor" fill-rule="evenodd"/>` : '';
}
