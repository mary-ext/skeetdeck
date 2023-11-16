// This example provides the one necessary function for RichText graphemes,
// we only need `graphemeLen` to count how many graphemes there are on a text.

// We rely on Intl.Segmenter when available, only falling back to `graphemer`
// npm module when it's not, this way, newer browsers supporting the Intl API
// won't have to incur the costs of loading the polyfill.

/** @type {(text: string) => number} */
export let graphemeLen;

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

	const { default: Graphemer } = await import('graphemer');
	const graphemer = new Graphemer();

	graphemeLen = (text) => graphemer.countGraphemes(text);
}
