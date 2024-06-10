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
		const feature = segment.feature;

		let substitute: string | undefined;

		if (feature) {
			const type = feature.$type;

			if (type === 'app.bsky.richtext.facet#link') {
				const uri = feature.uri;
				substitute = isLinkValid(uri, text) ? uri : `[${text.replace(MDLINK_ESCAPE_RE, '\\$1')}](${uri})`;
			} else if (type === 'app.bsky.richtext.facet#mention' || type === 'app.bsky.richtext.facet#tag') {
				substitute = text;
			}
		} else if (loose) {
			substitute = text;
		}

		if (substitute !== undefined) {
			result += substitute;
		} else {
			result += text.replace(ESCAPE_RE, '\\$1');
		}
	}

	return result;
};
