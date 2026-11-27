<script lang="ts">
	// Archiv aller bisherigen Stile, Designs, Motive, Landkarten-Stile und Effekte (eingefroren vor dem
	// Umbau auf den neuen Karteneditor). Eigenständig: liest nur static/archiv/archiv.json + Bilder.
	// Je Eintrag eine Entscheidung (Nachbauen / Vielleicht / Entfernen), im Browser gemerkt.
	import { onMount } from 'svelte';
	import { asset, resolve } from '$app/paths';

	type Eintrag = { id: string; name: string; desc: string; gruppe?: string };
	type Bereich = { id: string; titel: string; text: string; eintraege: Eintrag[] };
	type Archiv = { stand: string; hinweis: string; bereiche: Bereich[]; funktionen: { name: string; desc: string }[] };
	type Wahl = 'ja' | 'vielleicht' | 'nein';

	const SPEICHER = 'kartenstudio.archiv.v1';
	const WAHL: { k: Wahl; t: string }[] = [
		{ k: 'ja', t: 'Nachbauen' },
		{ k: 'vielleicht', t: 'Vielleicht' },
		{ k: 'nein', t: 'Entfernen' }
	];

	let archiv = $state<Archiv | null>(null);
	let fehler = $state('');
	let wahl = $state<Record<string, Wahl>>({});
	let filter = $state<'' | Wahl | 'offen'>('');
	let kopiert = $state(false);

	const schluessel = (b: string, id: string) => b + '/' + id;
	const bild = (b: string, id: string) => asset(`archiv/${b}/${id}.webp` as any);

	function setzen(b: string, id: string, w: Wahl) {
		const k = schluessel(b, id);
		const neu = { ...wahl };
		if (neu[k] === w) delete neu[k];
		else neu[k] = w;
		wahl = neu;
		try {
			localStorage.setItem(SPEICHER, JSON.stringify(neu));
		} catch {}
	}
	const sichtbar = (b: string, id: string) => {
		const w = wahl[schluessel(b, id)];
		return !filter || (filter === 'offen' ? !w : w === filter);
	};
	const zaehl = (w: Wahl) => Object.values(wahl).filter((x) => x === w).length;
	const gesamt = () => (archiv ? archiv.bereiche.reduce((n, b) => n + b.eintraege.length, 0) : 0);

	/** Entscheidungen als Text zum Weitergeben */
	async function kopieren() {
		if (!archiv) return;
		let t = `Kartenstudio – Auswahl aus dem Archiv (Stand ${archiv.stand})\n`;
		for (const w of WAHL) {
			t += `\n${w.t}:\n`;
			for (const b of archiv.bereiche)
				for (const e of b.eintraege) if (wahl[schluessel(b.id, e.id)] === w.k) t += `- ${b.titel}: ${e.name} (${e.id})\n`;
		}
		try {
			await navigator.clipboard.writeText(t);
			kopiert = true;
			setTimeout(() => (kopiert = false), 2000);
		} catch {
			alert(t);
		}
	}

	onMount(async () => {
		try {
			wahl = JSON.parse(localStorage.getItem(SPEICHER) || '{}');
		} catch {}
		try {
			const r = await fetch(asset('archiv/archiv.json' as any));
			archiv = await r.json();
		} catch {
			fehler = 'Das Archiv konnte nicht geladen werden.';
		}
	});
</script>

<svelte:head>
	<title>Archiv: Stile & Designs · Kartenstudio</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="ar">
	<header>
		<a class="zurueck" href={resolve('/')} data-sveltekit-reload>‹ Zum Editor</a>
		<h1>Archiv: bisherige Stile, Designs & Effekte</h1>
		{#if archiv}
			<p class="lead">{archiv.hinweis} Stand {archiv.stand}. Markiere bei jedem Eintrag, ob er im neuen Editor nachgebaut werden soll – deine Auswahl bleibt in diesem Browser gespeichert.</p>
		{/if}
		<div class="leiste">
			<div class="filter" role="tablist" aria-label="Filter">
				<button type="button" class:an={filter === ''} onclick={() => (filter = '')}>Alle <i>{gesamt()}</i></button>
				<button type="button" class:an={filter === 'offen'} onclick={() => (filter = 'offen')}>Offen <i>{gesamt() - Object.keys(wahl).length}</i></button>
				{#each WAHL as w}
					<button type="button" class="f-{w.k}" class:an={filter === w.k} onclick={() => (filter = w.k)}>{w.t} <i>{zaehl(w.k)}</i></button>
				{/each}
			</div>
			<button type="button" class="kopie" onclick={kopieren}>{kopiert ? 'Kopiert ✓' : 'Liste kopieren'}</button>
		</div>
		{#if archiv}
			<nav>
				{#each archiv.bereiche as b}<a href="#{b.id}">{b.titel} <i>{b.eintraege.length}</i></a>{/each}
				<a href="#funktionen">Weitere Funktionen</a>
			</nav>
		{/if}
	</header>

	{#if fehler}<p class="fehler">{fehler}</p>{/if}

	{#if archiv}
		{#each archiv.bereiche as b}
			<section id={b.id}>
				<h2>{b.titel} <i>{b.eintraege.length}</i></h2>
				<p class="text">{b.text}</p>
				<div class="raster" class:hoch={b.id !== 'stil'}>
					{#each b.eintraege as e (e.id)}
						{#if sichtbar(b.id, e.id)}
							<article class="w-{wahl[schluessel(b.id, e.id)] || 'offen'}">
								<div class="bild"><img src={bild(b.id, e.id)} alt={e.name} loading="lazy" decoding="async" /></div>
								<div class="info">
									<b>{e.name}</b>
									{#if e.gruppe}<small class="gr">{e.gruppe}</small>{/if}
									{#if e.desc}<p>{e.desc}</p>{/if}
									<code>{e.id}</code>
								</div>
								<div class="wahl">
									{#each WAHL as w}
										<button type="button" class="w-{w.k}" class:an={wahl[schluessel(b.id, e.id)] === w.k} onclick={() => setzen(b.id, e.id, w.k)}>{w.t}</button>
									{/each}
								</div>
							</article>
						{/if}
					{/each}
				</div>
			</section>
		{/each}
		<section id="funktionen">
			<h2>Weitere Funktionen</h2>
			<p class="text">Ohne Vorschaubild – zum Nachlesen, was es gab.</p>
			<ul class="fkt">
				{#each archiv.funktionen as f}<li><b>{f.name}</b> – {f.desc}</li>{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.ar {
		--navy: #262c3a;
		max-width: 1240px;
		margin: 0 auto;
		padding: 24px 20px 80px;
		font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
		color: #1c1f26;
	}
	:global(body) {
		background: #f6f4f0;
	}
	header {
		position: sticky;
		top: 0;
		z-index: 5;
		background: rgba(246, 244, 240, 0.94);
		backdrop-filter: blur(8px);
		padding: 10px 0 12px;
		margin-bottom: 8px;
	}
	.zurueck {
		color: #2f6fe4;
		text-decoration: none;
		font-size: 13px;
	}
	h1 {
		font-size: 24px;
		margin: 6px 0 6px;
	}
	.lead {
		font-size: 14px;
		color: #5b616d;
		margin: 0 0 12px;
		max-width: 820px;
		line-height: 1.5;
	}
	.leiste {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
		justify-content: space-between;
	}
	.filter {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	button {
		font: inherit;
	}
	.filter button,
	.kopie {
		border: 1px solid #d9d5cd;
		background: #fff;
		border-radius: 999px;
		padding: 7px 13px;
		font-size: 13px;
		cursor: pointer;
		transition: background 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.filter button.an {
		background: var(--navy);
		color: #fff;
		border-color: var(--navy);
	}
	.filter i,
	nav i,
	h2 i {
		font-style: normal;
		opacity: 0.6;
		font-weight: 400;
	}
	.kopie {
		background: var(--navy);
		color: #fff;
		border-color: var(--navy);
		font-weight: 600;
	}
	nav {
		display: flex;
		gap: 14px;
		flex-wrap: wrap;
		margin-top: 10px;
		font-size: 13px;
	}
	nav a {
		color: #1c1f26;
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}
	nav a:hover {
		border-color: currentColor;
	}
	section {
		padding-top: 22px;
		scroll-margin-top: 150px;
	}
	h2 {
		font-size: 19px;
		margin: 0 0 2px;
	}
	.text {
		font-size: 13px;
		color: #5b616d;
		margin: 0 0 14px;
	}
	.raster {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		gap: 14px;
	}
	article {
		background: #fff;
		border: 1px solid #e6e2da;
		border-radius: 12px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: border-color 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	article.w-ja {
		border-color: #2e9a5b;
		box-shadow: 0 0 0 2px rgba(46, 154, 91, 0.18);
	}
	article.w-nein {
		opacity: 0.55;
	}
	article.w-vielleicht {
		border-color: #d29a1c;
	}
	.bild {
		aspect-ratio: 1;
		background: #efebe4;
		display: grid;
		place-items: center;
		padding: 10px;
	}
	.hoch .bild {
		aspect-ratio: 4 / 5;
	}
	.bild img {
		max-width: 100%;
		max-height: 100%;
		display: block;
		filter: drop-shadow(0 3px 8px rgba(20, 24, 35, 0.15));
	}
	.info {
		padding: 10px 12px 6px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
	}
	.info b {
		font-size: 14px;
	}
	.gr {
		font-size: 11px;
		color: #7a808b;
	}
	.info p {
		font-size: 12px;
		color: #5b616d;
		margin: 2px 0 0;
		line-height: 1.4;
	}
	code {
		font-size: 11px;
		color: #9aa0aa;
		margin-top: auto;
		padding-top: 4px;
	}
	.wahl {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border-top: 1px solid #eee;
	}
	.wahl button {
		border: 0;
		background: #fff;
		padding: 8px 2px;
		font-size: 11.5px;
		cursor: pointer;
		color: #5b616d;
	}
	.wahl button + button {
		border-left: 1px solid #eee;
	}
	.wahl button.w-ja.an {
		background: #2e9a5b;
		color: #fff;
	}
	.wahl button.w-vielleicht.an {
		background: #d29a1c;
		color: #fff;
	}
	.wahl button.w-nein.an {
		background: #b8463d;
		color: #fff;
	}
	.fkt {
		font-size: 14px;
		line-height: 1.7;
		padding-left: 18px;
	}
	.fehler {
		color: #b8463d;
	}
	@media (max-width: 600px) {
		.raster {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}
		header {
			position: static;
		}
	}
</style>
