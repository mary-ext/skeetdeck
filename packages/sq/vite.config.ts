import { defineConfig } from 'vite';

import solid from 'vite-plugin-solid';

export default defineConfig({
	plugins: [solid()],
	server: {
		hmr: false,
	},
	build: {
		lib: {
			entry: './lib/index.ts',
			formats: ['es'],
		},
		rollupOptions: {
			external: ['solid-js'],
		},
		minify: false,
		sourcemap: true,
		target: 'esnext',
		modulePreload: {
			polyfill: false,
		},
	},
});
