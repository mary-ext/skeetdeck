export let graphemeLen: (text: string) => number;

if (Intl.Segmenter) {
	const segmenter = new Intl.Segmenter();

	graphemeLen = (text) => {
		const iterator = segmenter.segment(text)[Symbol.iterator]();
		let count = 0;

		while (!iterator.next().done) {
			count++;
		}

		return count;
	};
} else {
	console.log('Intl.Segmenter API not available, falling back to polyfill...');

	const { countGraphemes } = await import('./graphemer.ts');
	graphemeLen = countGraphemes;
}
