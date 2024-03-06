import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

import prettier from 'prettier';

import { createIterableReader } from '@mary/reader';
import { untar } from '@mary/tar';

const repo = `bluesky-social/atproto`;

async function main() {
	let sha;
	{
		console.log(`retrieving latest commit`);
		const response = await fetch(`https://api.github.com/repos/${repo}/commits?path=lexicons/`);

		if (!response.ok) {
			console.log(`  response error ${response.status}`);
			return;
		}

		const json = await response.json();
		const latest = json[0];

		if (!latest) {
			console.log(`  latest commit missing?`);
			return;
		}

		sha = latest.sha;
		console.log(`  got ${sha}`);
	}

	const tmpdir = `lexicons-tmp/`;
	let prettierConfig;
	{
		const config = await prettier.resolveConfig(tmpdir);
		prettierConfig = { ...config, parser: 'json' };
	}

	{
		console.log(`retrieving zip file`);
		const response = await fetch(`https://github.com/${repo}/archive/${sha}.tar.gz`);

		if (!response.ok) {
			console.log(`  response error ${response.status}`);
			return;
		}

		const basename = `atproto-${sha}/lexicons/`;

		const ds = new DecompressionStream('gzip');
		const stream = response.body.pipeThrough(ds);

		const reader = createIterableReader(stream);
		const promises = [];

		const decoder = new TextDecoder();

		console.log(`  reading`);
		for await (const entry of untar(reader)) {
			if (entry.type === 'file' && entry.name.startsWith(basename)) {
				const name = entry.name.slice(basename.length);
				const buffer = new Uint8Array(entry.size);

				await entry.read(buffer);

				const promise = (async () => {
					const source = decoder.decode(buffer);
					const formatted = await prettier.format(source, prettierConfig);

					const basedir = tmpdir + path.dirname(name);

					await fsp.mkdir(basedir, { recursive: true });
					await fsp.writeFile(tmpdir + name, formatted);
				})();

				promises.push(promise);
			}
		}

		console.log(`  flushing writes`);
		await Promise.all(promises);
	}

	{
		const source = `https://github.com/${repo}/tree/${sha}/lexicons\n`;

		console.log(`writing readme file`);
		await fsp.writeFile(tmpdir + `README.md`, source);
	}

	{
		const dest = `lexicons/`;

		console.log(`moving folder`);
		await fsp.rm(dest, { recursive: true });
		await fsp.rename(tmpdir, dest);
	}
}

await main();
