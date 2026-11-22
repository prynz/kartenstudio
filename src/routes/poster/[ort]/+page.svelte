<script lang="ts">
	// Orts-Seite für Google: „Bamberg als Poster“ – mit echten Ortsdaten und direktem Einstieg ins fertige Poster.
	import { resolve } from '$app/paths';
	import { KONFIG } from '#lib/konfig.js';
	import { grad, nachbarn, texte } from '#lib/seo/seite.js';
	import xb from '#lib/assets/fonts/inter-xb.woff?url';
	import fr from '#lib/assets/fonts/frak.woff?url';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const o = $derived(data.ort);
	const t = $derived(texte(o));
	const nah = $derived(nachbarn(o, 6));
	const start = $derived(resolve('/') + '#ort=' + o.slug);
	const titel = $derived(`${o.name} als Poster – Karte gestalten | Kartenstudio`);
	const beschreibung = $derived(`${o.name} (${o.landkreis ? 'Landkreis ' + o.landkreis : o.bezirk}) als Kartenposter, Shirt oder Tasse: Ort ist schon eingestellt – Stil, Design und Text wählen, fertig.`);
	const ANL = [
		['heimat', 'Heimat-Poster', 'Der Siegritz-Look: Navy-Balken, Fraktur'],
		['hochzeit', 'Hochzeit', 'Herzform mit Herz an der richtigen Stelle'],
		['geburt', 'Geburt', 'Rund, Pastell, mit Stern'],
		['zuhause', 'Neues Zuhause', 'Klar, modern, mit Koordinaten'],
		['verein', 'Verein & Firma', 'Kräftig, ideal fürs Vereins-Shirt']
	];
	// Kleines, für jeden Ort etwas anderes „Kartenbild“ als Vorschau (nur Zierde, keine echte Karte)
	const linien = $derived.by(() => {
		let s = [...o.slug].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483647 || 1;
		const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
		const out: string[] = [];
		for (let i = 0; i < 9; i++) {
			const y0 = r() * 180,
				y1 = r() * 180;
			out.push(`M-10 ${y0.toFixed(0)} C60 ${(y0 + (r() - 0.5) * 80).toFixed(0)} 100 ${(y1 + (r() - 0.5) * 80).toFixed(0)} 170 ${y1.toFixed(0)}`);
		}
		for (let i = 0; i < 6; i++) {
			const x0 = r() * 160;
			out.push(`M${x0.toFixed(0)} -10 C${(x0 + (r() - 0.5) * 60).toFixed(0)} 60 ${(x0 + (r() - 0.5) * 60).toFixed(0)} 120 ${(x0 + (r() - 0.5) * 40).toFixed(0)} 190`);
		}
		return out;
	});
	const haeuser = $derived.by(() => {
		let s = ([...o.slug].reduce((a, c) => a * 17 + c.charCodeAt(0), 3) % 2147483647) || 1;
		const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
		return Array.from({ length: o.typ === 'dorf' ? 40 : 90 }, () => ({ x: 40 + (r() - 0.5) * 120 + 40, y: 90 + (r() - 0.5) * 120, w: 3 + r() * 6, h: 3 + r() * 5, a: (r() - 0.5) * 40 }));
	});
</script>

<svelte:head>
	<title>{titel}</title>
	<meta name="description" content={beschreibung} />
	<link rel="canonical" href={`${KONFIG.site}/poster/${o.slug}`} />
	<meta property="og:title" content={titel} />
	<meta property="og:description" content={beschreibung} />
	<meta property="og:type" content="website" />
	{@html `<style>@font-face{font-family:SgXB;src:url(${xb}) format('woff');font-display:swap}@font-face{font-family:SgFR;src:url(${fr}) format('woff');font-display:swap}</style>`}
</svelte:head>

<div class="seo">
	<header>
		<a class="brand" href={resolve('/')} data-sveltekit-reload>Kartenstudio</a>
		<a class="alle" href={resolve('/poster')}>Alle Orte</a>
	</header>

	<main>
		<section class="hero">
			<div class="txt">
				<p class="eyebrow">{t.art} · {o.landkreis ? 'Landkreis ' + o.landkreis : o.bezirk}{o.fs ? ' · Fränkische Schweiz' : ''}</p>
				<h1>{o.name} als Poster</h1>
				<p class="lead">{t.lead}</p>
				<a class="cta" href={start} data-sveltekit-reload>{o.name} jetzt gestalten</a>
				<p class="klein">Ohne Anmeldung · Vorschau sofort · Druckdatei zum Herunterladen</p>
			</div>
			<div class="poster" aria-hidden="true">
				<svg viewBox="0 0 160 220">
					<rect width="160" height="220" rx="9" fill="#262c3a" />
					<rect x="6" y="6" width="148" height="164" rx="5" fill="#fff" />
					<g clip-path="url(#k)">
						<clipPath id="k"><rect x="6" y="6" width="148" height="164" rx="5" /></clipPath>
						{#each haeuser as h, i (i)}
							<rect x={h.x} y={h.y} width={h.w} height={h.h} transform={`rotate(${h.a.toFixed(0)} ${h.x} ${h.y})`} fill="none" stroke="#262c3a" stroke-width=".6" />
						{/each}
						{#each linien as d, i (i)}
							<path {d} fill="none" stroke="#262c3a" stroke-width={i < 2 ? 2.4 : 0.8} stroke-linecap="round" />
						{/each}
					</g>
					<text x="80" y="194" text-anchor="middle" fill="#fff" font-family="SgXB" font-size={o.name.length > 12 ? 9 : 13} letter-spacing="2">{o.name.toUpperCase()}</text>
					<text x="80" y="208" text-anchor="middle" fill="#fff" font-family="SgFR" font-size="7.5">{o.fs ? 'Fränkische Schweiz' : o.landkreis || o.bezirk}</text>
				</svg>
			</div>
		</section>

		<section>
			<h2>Ideen für dein {o.name}-Poster</h2>
			<div class="ideen">
				{#each ANL as [k, name, d] (k)}
					<a href={start + '&anlass=' + k} data-sveltekit-reload><b>{name}</b><span>{d}</span></a>
				{/each}
			</div>
			{#each t.ideen as i (i)}<p>{i}</p>{/each}
		</section>

		<section class="fakten">
			<h2>{o.name} auf einen Blick</h2>
			<dl>
				<div><dt>Koordinaten</dt><dd>{grad(o.lat, 'N', 'S')} · {grad(o.lon, 'O', 'W')}</dd></div>
				<div><dt>{o.landkreis ? 'Landkreis' : 'Verwaltung'}</dt><dd>{o.landkreis || 'kreisfreie Stadt'}</dd></div>
				<div><dt>Regierungsbezirk</dt><dd>{o.bezirk}</dd></div>
				{#if o.fs}<div><dt>Region</dt><dd>Fränkische Schweiz</dd></div>{/if}
			</dl>
			<p class="klein">Die Koordinaten kannst du im Poster als eigene Zeile anzeigen – oder ein reines Koordinaten-Poster mit deinem Text gestalten.</p>
		</section>

		<section>
			<h2>So entsteht dein Poster</h2>
			<ol class="schritte">
				<li><b>{o.name} ist schon eingestellt.</b> Ausschnitt verschieben oder größer wählen.</li>
				<li><b>Stil und Design wählen</b> – von Siegritz-Navy über Pop-Art bis Sternenhimmel.</li>
				<li><b>Text anpassen</b>, Herz oder Pin setzen, Datum ergänzen.</li>
				<li><b>Als Poster, Rahmen, Leinwand, Shirt oder Tasse ansehen</b> – maßstäblich im Raum.</li>
			</ol>
			<a class="cta" href={start} data-sveltekit-reload>Los geht’s mit {o.name}</a>
		</section>

		<section>
			<h2>Orte in der Nähe</h2>
			<ul class="nah">
				{#each nah as n (n.slug)}
					<li><a href={resolve('/poster/[ort]', { ort: n.slug })}>{n.name}</a> <span>{Math.round(n.km)} km</span></li>
				{/each}
			</ul>
		</section>
	</main>

	<footer>
		Kartendaten © OpenStreetMap-Mitwirkende ·
		<a href={resolve('/impressum')}>Impressum</a> · <a href={resolve('/datenschutz')}>Datenschutz</a> · <a href={resolve('/lizenzen')}>Lizenzen</a>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f4f0;
	}
	.seo {
		--navy: #262c3a;
		--ink: #1c1f26;
		--muted: #5d6475;
		--line: #e3e1db;
		color: var(--ink);
		font: 16px/1.6 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
		max-width: 980px;
		margin: 0 auto;
		padding: 0 max(16px, env(safe-area-inset-left, 0px)) 48px max(16px, env(safe-area-inset-right, 0px));
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 18px 0;
	}
	.brand {
		font-weight: 700;
		color: var(--navy);
		text-decoration: none;
		font-size: 18px;
	}
	.alle {
		color: var(--navy);
		font-size: 14px;
		font-weight: 600;
	}
	section {
		background: #fff;
		border: 1px solid var(--line);
		border-radius: 18px;
		padding: 24px clamp(16px, 3vw, 32px);
		margin-top: 16px;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
		gap: 28px;
		align-items: center;
	}
	@media (max-width: 720px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
		}
		.poster {
			max-width: 240px;
			margin: 0 auto;
		}
	}
	.eyebrow {
		font-size: 12.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		font-weight: 600;
		margin: 0;
	}
	h1 {
		font-size: clamp(30px, 5vw, 44px);
		line-height: 1.1;
		margin: 8px 0 12px;
		color: var(--navy);
		letter-spacing: -0.5px;
		text-wrap: balance;
	}
	h2 {
		font-size: 21px;
		margin: 0 0 12px;
		color: var(--navy);
	}
	.lead {
		font-size: 18px;
		color: var(--muted);
		margin: 0 0 20px;
		max-width: 52ch;
	}
	.cta {
		display: inline-block;
		background: var(--navy);
		color: #fff;
		text-decoration: none;
		font-weight: 600;
		padding: 13px 22px;
		border-radius: 12px;
		transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.cta:hover {
		transform: translateY(-1px);
	}
	.cta:focus-visible,
	a:focus-visible {
		outline: 2px solid #2f6fe4;
		outline-offset: 3px;
	}
	.klein {
		font-size: 13.5px;
		color: var(--muted);
		margin: 10px 0 0;
	}
	.poster svg {
		width: 100%;
		height: auto;
		filter: drop-shadow(0 14px 24px rgba(20, 24, 35, 0.22));
	}
	.ideen {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 10px;
		margin-bottom: 14px;
	}
	.ideen a {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-decoration: none;
		color: var(--ink);
		border: 1.5px solid var(--line);
		border-radius: 12px;
		padding: 12px 14px;
		transition: border-color 0.2s;
	}
	.ideen a:hover {
		border-color: var(--navy);
	}
	.ideen span {
		font-size: 13px;
		color: var(--muted);
	}
	dl {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
		margin: 0;
	}
	dt {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	dd {
		margin: 2px 0 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.schritte {
		padding-left: 20px;
		margin: 0 0 18px;
	}
	.schritte li {
		margin: 6px 0;
	}
	.nah {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
	}
	.nah a {
		color: var(--navy);
		font-weight: 600;
	}
	.nah span {
		color: var(--muted);
		font-size: 13px;
	}
	footer {
		margin-top: 28px;
		font-size: 13px;
		color: var(--muted);
		text-align: center;
	}
	footer a {
		color: inherit;
	}
</style>
