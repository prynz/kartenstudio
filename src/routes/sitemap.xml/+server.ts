// Sitemap für Google: Startseite, Orts-Übersicht, alle Orts-Seiten (wird beim Bauen als Datei erzeugt).
import { ORTE } from '#lib/seo/orte.js';
import { KONFIG } from '#lib/konfig.js';

export const prerender = true;

export function GET() {
	const urls = ['', '/poster', ...ORTE.map((o) => `/poster/${o.slug}`)];
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
		urls.map((u) => `<url><loc>${KONFIG.site}${u}${u ? '' : '/'}</loc></url>`).join('\n') +
		'\n</urlset>\n';
	return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
