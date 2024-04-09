import { createMemo, type JSX } from 'solid-js';

import { segmentRichText } from '~/api/richtext/segmentize';
import type { Facet, RichTextSegment } from '~/api/richtext/types';

import { type Linking, LINK_EXTERNAL, LINK_PROFILE, LINK_TAG, useLinking } from './Link';

export interface RichTextReturn {
	t: string;
	f: Facet[] | undefined;
}

export interface RichTextRendererProps<T extends object> {
	item: T;
	/** Expected to be static */
	get: (item: T) => RichTextReturn;
}

interface RichTextUiSegment {
	text: string;
	to: Linking | undefined;
}

const cache = new WeakMap<Facet[], RichTextUiSegment[]>();

const RichTextRenderer = <T extends object>(props: RichTextRendererProps<T>) => {
	const linking = useLinking();
	const get = props.get;

	const segments = createMemo((): RichTextUiSegment[] => {
		const { t: text, f: facets } = get(props.item);

		if (facets !== undefined) {
			let rendered = cache.get(facets);
			if (rendered === undefined) {
				const segments = segmentRichText(text, facets);
				cache.set(facets, (rendered = renderRichText(segments)));
			}

			return rendered;
		}

		return [{ text: text, to: undefined }];
	});

	const render = () => {
		const ui = segments();
		const nodes: JSX.Element = [];

		for (let idx = 0, len = ui.length; idx < len; idx++) {
			const { text, to } = ui[idx];

			if (to) {
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
	};

	return render as unknown as JSX.Element;
};

export default RichTextRenderer;

const renderRichText = (segments: RichTextSegment[]): RichTextUiSegment[] => {
	const ui: RichTextUiSegment[] = [];

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];
		const text = segment.text;

		const mention = segment.mention;
		const link = segment.link;
		const tag = segment.tag;

		let to: Linking | undefined;

		if (mention) {
			to = {
				type: LINK_PROFILE,
				actor: mention.did,
			};
		} else if (tag) {
			to = {
				type: LINK_TAG,
				tag: tag.tag,
			};
		} else if (link) {
			to = {
				type: LINK_EXTERNAL,
				url: link.uri,
				text: text,
			};
		}

		ui.push({ text: text, to: to });
	}

	return ui;
};
