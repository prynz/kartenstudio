<script lang="ts">
	import { asset } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('favicon.svg')} type="image/svg+xml" />
	<link rel="manifest" href={asset('manifest.webmanifest')} />
	<link rel="apple-touch-icon" href={asset('apple-touch-icon.png')} />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="Kartenstudio" />
</svelte:head>

{@render children()}
