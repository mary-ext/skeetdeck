import { mkdist } from 'mkdist';

const { writtenFiles } = await mkdist({
	rootDir: '.',
	srcDir: 'lib',
	distDir: 'dist',
	ext: 'js',
	declaration: true,
	esbuild: {
		mangleProps: /^_/,
		mangleCache: {
			_canHide: 'h',
			_causes: 'c',
		},
		dropLabels: ['dev'],
	},
});

console.log(`Written ${writtenFiles.length} files`);
