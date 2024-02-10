import * as path from 'node:path';
import { defineConfig } from 'vite';

import solid from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	root: 'desktop',
	plugins: [
		solid(),
		VitePWA({
			registerType: 'prompt',
			injectRegister: null,
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg}'],
				cleanupOutdatedCaches: true,
			},
			manifest: {
				name: 'Skeetdeck',
				short_name: 'Skeetdeck',
				description: 'A deck-based client for Bluesky social media',
				display: 'standalone',
				id: '/?source=pwa',
				start_url: '/?source=pwa',
				background_color: '#000000',
				scope: '/',
				icons: [
					{
						src: 'favicon.png',
						type: 'image/png',
						sizes: '150x150',
					},
				],
			},
		}),
	],
	build: {
		minify: 'terser',
		sourcemap: true,
		target: 'esnext',
		modulePreload: false,
		rollupOptions: {
			output: {
				chunkFileNames: 'assets/[hash].js',
			},
		},
		terserOptions: {
			compress: {
				passes: 2,
			},
		},
	},
	resolve: {
		extensions: ['.desktop.ts', '.desktop.tsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
		alias: {
			'~': path.join(__dirname, '.'),
		},
	},
});
