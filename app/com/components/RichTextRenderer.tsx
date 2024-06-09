import { type JSX } from 'solid-js';

import { segmentRichText } from '~/api/richtext/segmentize';
import type { Facet } from '~/api/richtext/types';

import { LINK_EXTERNAL, LINK_PROFILE, LINK_TAG, useLinking, type Linking } from './Link';

export interface RichTextRendererProps {
	text: string;
	facets: Facet[] | undefined;
}

const RichTextRenderer = (props: RichTextRendererProps) => {
	const linking = useLinking();

	return (() => {
		const text = props.text;
		const facets = props.facets;

		if (facets === undefined || facets.length === 0) {
			return text;
		}

		const nodes: JSX.Element[] = [];
		const segments = segmentRichText(text, facets);

		for (let idx = 0, len = segments.length; idx < len; idx++) {
			const { text, feature } = segments[idx];

			let to: Linking | undefined;

			if (feature) {
				const type = feature.$type;

				if (type === 'app.bsky.richtext.facet#link') {
					to = {
						type: LINK_EXTERNAL,
						url: feature.uri,
						text: text,
					};
				} else if (type === 'app.bsky.richtext.facet#mention') {
					to = {
						type: LINK_PROFILE,
						actor: feature.did,
					};
				} else if (type === 'app.bsky.richtext.facet#tag') {
					to = {
						type: LINK_TAG,
						tag: feature.tag,
					};
				}
			}

			if (to !== undefined) {
				const link: JSX.Element = linking.render({
					to: to,
					children: text,
					class: 'text-accent hover:underline',
				});

				nodes.push(link);
			} else {
				nodes.push(text);
			}
		}

		return nodes;
	}) as unknown as JSX.Element;
};

export default RichTextRenderer;
