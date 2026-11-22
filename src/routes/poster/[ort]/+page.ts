// Jede Orts-Seite wird beim Bauen als fertiges HTML erzeugt – damit Google sie lesen kann.
import { error } from '@sveltejs/kit';
import { ORTE } from '#lib/seo/orte.js';
import type { PageLoad, EntryGenerator } from './$types';

export const ssr = true;
export const prerender = true;

export const entries: EntryGenerator = () => ORTE.map((o) => ({ ort: o.slug }));

export const load: PageLoad = ({ params }) => {
	const ort = ORTE.find((o) => o.slug === params.ort);
	if (!ort) error(404, 'Ort nicht gefunden');
	return { ort };
};
