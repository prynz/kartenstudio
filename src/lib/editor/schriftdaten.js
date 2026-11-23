// Schriften als eingebettete Daten – nur für Dateien, die das Poster „mitnehmen“ (SVG/PNG/PDF,
// Vorschaubilder, Mockups). Am Bildschirm kommen die Schriften über CSS. Dieses Modul wird erst
// nachgeladen (ladeSchriften() in basis.js), damit die Startseite schneller bereit ist.
import FONT_XB_URL from '../assets/fonts/inter-xb.woff?inline';
import FONT_MD_URL from '../assets/fonts/inter-md.woff?inline';
import FONT_FR_URL from '../assets/fonts/frak.woff?inline';
import FONT_SC_URL from '../assets/fonts/script.woff?inline';
import FONT_BR_URL from '../assets/fonts/brush.woff?inline';
import FONT_BE_URL from '../assets/fonts/bebas.woff?inline';
/** @param {string} u */
const b64 = (u) => u.slice(u.indexOf(',') + 1);
/** @type {Record<string, string>} */
export const DATEN = {
	SgXB: b64(FONT_XB_URL),
	SgMD: b64(FONT_MD_URL),
	SgFR: b64(FONT_FR_URL),
	SgSC: b64(FONT_SC_URL),
	SgBR: b64(FONT_BR_URL),
	SgBE: b64(FONT_BE_URL)
};
