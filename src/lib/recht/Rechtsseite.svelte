<script lang="ts">
	// Gemeinsamer Rahmen für Impressum, Datenschutz und AGB (schlicht, gut lesbar, auch am Handy).
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} – Kartenstudio</title>
	<meta name="robots" content="noindex" />
	<meta name="description" content="{title} von Kartenstudio – Karten-Poster deines Ortes gestalten." />
</svelte:head>

<div class="recht">
	<a class="zur" href={resolve('/')}>‹ Zurück zum Kartenstudio</a>
	<h1>{title}</h1>
	{@render children()}
	<nav>
		<a href={resolve('/impressum')}>Impressum</a> · <a href={resolve('/datenschutz')}>Datenschutz</a> · <a href={resolve('/agb')}>AGB</a> · <a href={resolve('/lizenzen')}>Lizenzen</a>
	</nav>
</div>

<style>
	.recht {
		max-width: 720px;
		margin: 0 auto;
		padding: 32px 16px 64px;
		font: 15.5px/1.65 Inter, system-ui, sans-serif;
		color: #1c1f26;
		background: #fff;
		min-height: 100vh;
		box-sizing: border-box;
	}
	h1 {
		font-size: 30px;
		letter-spacing: -0.5px;
		margin: 18px 0 20px;
		color: #262c3a;
	}
	.recht :global(h2) {
		font-size: 18px;
		margin: 28px 0 8px;
		color: #262c3a;
	}
	.recht :global(.ph) {
		background: #fff3cd;
		border-radius: 4px;
		padding: 0 4px;
		font-weight: 600;
	}
	.recht :global(.hinweis) {
		background: #fff8e6;
		border: 1px solid #f0d58a;
		border-radius: 12px;
		padding: 12px 14px;
		font-size: 14px;
	}
	a {
		color: #2f6fe4;
	}
	.zur {
		font-weight: 600;
		text-decoration: none;
	}
	nav {
		margin-top: 40px;
		font-size: 14px;
		color: #6b7180;
	}
</style>
