import * as path from 'node:path';
import { defineConfig } from 'vite';

import solid from 'vite-plugin-solid';

export default defineConfig({
	root: 'desktop',
	plugins: [
		solid({
			typescript: {
				optimizeConstEnums: true,
			},
		}),
	],
	build: {
		minify: 'terser',
		sourcemap: true,
		target: 'esnext',
		modulePreload: {
			polyfill: false,
		},
		terserOptions: {
			compress: {
				passes: 2,
			},
		},
	},
	resolve: {
		alias: {
			'~': path.join(__dirname, '.'),
		},
	},
});
