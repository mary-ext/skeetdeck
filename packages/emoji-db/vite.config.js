import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		target: 'esnext',
		minify: false,
		lib: {
			entry: 'lib/Database.js',
			fileName: 'emoji-db',
			formats: ['es'],
		},
	},
});
