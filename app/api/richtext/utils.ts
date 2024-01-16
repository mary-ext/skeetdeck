import { isLinkValid } from './renderer.ts';
import { segmentRichText } from './segmentize.ts';

import type { Facet } from './types.ts';

export const serializeRichText = (text: string, facets: Facet[] | undefined, loose: boolean) => {
	const segments = segmentRichText(text, facets);

	let result = '';

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];

		const text = segment.text;
		const link = segment.link;

		if (link) {
			const uri = link.uri;

			result += isLinkValid(link.uri, text) ? uri : loose ? `[${text}](${uri})` : text;
		} else {
			result += text;
		}
	}

	return result;
};
