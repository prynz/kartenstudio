import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Für GitHub Pages liegt die App unter /kartenstudio – der Pfad kommt aus BASE_PATH.
// Lokal (npm run dev) bleibt er leer.
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: '404.html' }),
			paths: { base },
			// Links wie /#ort=bamberg sind Startbefehle für die App, keine Sprungmarken
			prerender: { handleMissingId: 'ignore' }
		})
	],
	server: { host: true }
});
