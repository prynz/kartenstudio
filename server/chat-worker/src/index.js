// KI-Hilfe-Chat für Kartenstudio – läuft als Cloudflare Worker (kleiner Server-Baustein).
// Warum ein eigener Server? Der API-Schlüssel darf nie in der Webseite stehen, sonst könnte ihn jeder auslesen
// und auf unsere Kosten nutzen. Hier liegt er als Geheimnis (wrangler secret put ANTHROPIC_API_KEY).
//
// Die Webseite schickt die letzten Chat-Nachrichten, der Worker fragt Claude mit unserem Wissen
// (src/lib/hilfe/wissen.js – dieselbe Datei wie der eingebaute Bot) und gibt eine kurze Antwort zurück.
import Anthropic from '@anthropic-ai/sdk';
import { KI_REGELN, wissenText } from '../../../src/lib/hilfe/wissen.js';

// Fester System-Prompt (ändert sich nicht pro Anfrage → kann zwischengespeichert werden)
const SYSTEM = `${KI_REGELN}\n\n# Wissen über Kartenstudio\n\n${wissenText()}`;
const MAX_NACHRICHTEN = 12;
const MAX_ZEICHEN = 1000;

/** @param {Request} req @param {any} env */
function cors(req, env) {
	const origin = req.headers.get('Origin') || '';
	const erlaubt = String(env.ALLOWED_ORIGINS || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return {
		'Access-Control-Allow-Origin': erlaubt.includes(origin) ? origin : erlaubt[0] || 'null',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		Vary: 'Origin'
	};
}

/** @param {unknown} body @param {number} status @param {Record<string,string>} headers */
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });

/** Eingehende Nachrichten prüfen: nur Text, abwechselnd, mit Nutzer-Frage am Ende @param {any} m */
function pruefen(m) {
	if (!Array.isArray(m) || !m.length) return null;
	const msgs = m.slice(-MAX_NACHRICHTEN).map((x) => ({
		role: x && x.role === 'assistant' ? 'assistant' : 'user',
		content: String((x && x.content) || '').slice(0, MAX_ZEICHEN)
	}));
	while (msgs.length && msgs[0].role !== 'user') msgs.shift();
	if (!msgs.length || msgs[msgs.length - 1].role !== 'user' || !msgs[msgs.length - 1].content.trim()) return null;
	return msgs;
}

export default {
	/** @param {Request} req @param {any} env */
	async fetch(req, env) {
		const h = cors(req, env);
		if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
		if (req.method !== 'POST') return json({ error: 'Nur POST' }, 405, h);
		const origin = req.headers.get('Origin') || '';
		if (env.ALLOWED_ORIGINS && !String(env.ALLOWED_ORIGINS).split(',').map((s) => s.trim()).includes(origin)) return json({ error: 'Nicht erlaubt' }, 403, h);

		// Schutz vor Missbrauch: Begrenzung je Besucher (Cloudflare Rate-Limiting-Binding, siehe wrangler.toml)
		if (env.RATE_LIMITER) {
			const ip = req.headers.get('CF-Connecting-IP') || 'unbekannt';
			const { success } = await env.RATE_LIMITER.limit({ key: ip });
			if (!success) return json({ error: 'Zu viele Fragen – bitte kurz warten.' }, 429, h);
		}

		let body;
		try {
			body = await req.json();
		} catch {
			return json({ error: 'Ungültige Anfrage' }, 400, h);
		}
		const messages = pruefen(body && body.messages);
		if (!messages) return json({ error: 'Keine Frage gefunden' }, 400, h);

		if (!env.ANTHROPIC_API_KEY) return json({ error: 'Chat nicht eingerichtet' }, 503, h);
		const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
		try {
			const res = await client.beta.messages.create({
				model: 'claude-opus-5-5',
				max_tokens: 2000,
				// Kurze Support-Antworten: wenig Denkaufwand reicht und spart Kosten/Wartezeit
				output_config: { effort: 'low' },
				// Lehnt das Modell eine Anfrage aus Sicherheitsgründen ab, springt automatisch ein passendes anderes Modell ein
				betas: ['server-side-fallback-2026-07-01'],
				fallbacks: 'default',
				system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
				messages
			});
			if (res.stop_reason === 'refusal') return json({ reply: 'Dabei kann ich leider nicht helfen. Frag mich gern alles rund um dein Kartenposter!' }, 200, h);
			const reply = res.content
				.filter((b) => b.type === 'text')
				.map((b) => /** @type {any} */ (b).text)
				.join('')
				.trim();
			return json({ reply: reply || 'Entschuldige, da ist etwas schiefgelaufen. Versuch es bitte noch einmal.' }, 200, h);
		} catch (e) {
			if (e instanceof Anthropic.RateLimitError) return json({ error: 'Gerade viel los – bitte gleich nochmal.' }, 503, h);
			if (e instanceof Anthropic.AuthenticationError) {
				console.error('API-Schlüssel fehlt oder ist ungültig');
				return json({ error: 'Chat nicht eingerichtet' }, 503, h);
			}
			if (e instanceof Anthropic.APIError) {
				console.error('Claude-API-Fehler', e.status, e.message);
				return json({ error: 'KI gerade nicht erreichbar' }, 502, h);
			}
			console.error(e);
			return json({ error: 'Interner Fehler' }, 500, h);
		}
	}
};
