<script lang="ts">
	// Übersicht aller Orts-Seiten, nach Regierungsbezirk – für Besucher und für Google.
	import { resolve } from '$app/paths';
	import { KONFIG } from '#lib/konfig.js';
	import { nachBezirk } from '#lib/seo/seite.js';

	const gruppen = Object.entries(nachBezirk()).sort((a, b) => a[0].localeCompare(b[0], 'de'));
</script>

<svelte:head>
	<title>Ortsposter aus Franken und Bayern | Kartenstudio</title>
	<meta name="description" content="Dein Dorf oder deine Stadt in Franken und Bayern als Kartenposter, Shirt oder Tasse – Ort wählen, Poster steht sofort." />
	<link rel="canonical" href={`${KONFIG.site}/poster`} />
</svelte:head>

<div class="seo">
	<header><a class="brand" href={resolve('/')} data-sveltekit-reload>Kartenstudio</a></header>
	<h1>Ortsposter aus Franken und Bayern</h1>
	<p class="lead">Wähle deinen Ort – das Poster ist sofort fertig eingestellt. Dein Ort fehlt? Auf der <a href={resolve('/')} data-sveltekit-reload>Startseite</a> findest du jeden Ort der Welt.</p>
	{#each gruppen as [bezirk, orte] (bezirk)}
		<section>
			<h2>{bezirk}</h2>
			<ul>
				{#each orte as o (o.slug)}
					<li><a href={resolve('/poster/[ort]', { ort: o.slug })}>{o.name}</a>{#if o.fs}<span> · Fränk. Schweiz</span>{/if}</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #f5f4f0;
	}
	.seo {
		color: #1c1f26;
		font: 16px/1.6 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
		max-width: 980px;
		margin: 0 auto;
		padding: 0 max(16px, env(safe-area-inset-left, 0px)) 48px max(16px, env(safe-area-inset-right, 0px));
	}
	header {
		padding: 18px 0;
	}
	.brand {
		font-weight: 700;
		color: #262c3a;
		text-decoration: none;
		font-size: 18px;
	}
	h1 {
		font-size: clamp(28px, 5vw, 40px);
		color: #262c3a;
		margin: 6px 0 8px;
		text-wrap: balance;
	}
	.lead {
		color: #5d6475;
		max-width: 60ch;
	}
	section {
		background: #fff;
		border: 1px solid #e3e1db;
		border-radius: 16px;
		padding: 18px clamp(16px, 3vw, 28px);
		margin-top: 14px;
	}
	h2 {
		font-size: 19px;
		color: #262c3a;
		margin: 0 0 10px;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 6px 14px;
	}
	a {
		color: #262c3a;
		font-weight: 600;
	}
	a:focus-visible {
		outline: 2px solid #2f6fe4;
		outline-offset: 2px;
	}
	span {
		color: #5d6475;
		font-size: 13px;
	}
</style>
