import { isLinkValid } from './renderer';
import { segmentRichText } from './segmentize';
import type { Facet } from './types';

const MDLINK_ESCAPE_RE = /([\\\]])/g;
const ESCAPE_RE = /([@#\[\\])/g;

export const serializeRichText = (text: string, facets: Facet[] | undefined, loose: boolean) => {
	const segments = segmentRichText(text, facets);

	let result = '';

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];

		const text = segment.text;
		const link = segment.link;
		const tag = segment.tag;
		const mention = segment.mention;

		if (link) {
			const uri = link.uri;
			result += isLinkValid(uri, text) ? uri : `[${text.replace(MDLINK_ESCAPE_RE, '\\$1')}](${uri})`;
		} else if (loose || tag || mention) {
			result += text;
		} else {
			result += text.replace(ESCAPE_RE, '\\$1');
		}
	}

	return result;
};
