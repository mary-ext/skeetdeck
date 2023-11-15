import { type JSX } from 'solid-js';

import { isLinkValid } from '~/api/richtext/renderer.ts';
import { segmentRichText } from '~/api/richtext/segmentize.ts';
import type { Facet, RichTextSegment } from '~/api/richtext/types.ts';

import { type Linking, LinkingType, useLinking } from './Link.tsx';

export interface RichTextItem {
	$richtext?: unknown;
}

export interface RichTextReturn {
	t: string;
	f: Facet[] | undefined;
}

export interface RichTextRendererProps<T extends RichTextItem> {
	item: T;
	/** Expected to be static */
	get: (item: T) => RichTextReturn;
}

interface RichTextUiSegment {
	text: string;
	to: Linking | undefined;
}

const RichTextRenderer = <T extends RichTextItem>(props: RichTextRendererProps<T>) => {
	const linking = useLinking();
	const get = props.get;

	const segments = () => {
		const item = props.item;
		const segmenter = (item.$richtext ||= createSegmenter(item, get)) as () => RichTextUiSegment[];

		return segmenter();
	};

	const render = () => {
		const ui = segments();
		const nodes: JSX.Element = [];

		for (let idx = 0, len = ui.length; idx < len; idx++) {
			const { text, to } = ui[idx];

			if (to) {
				const link = linking.render({
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

const createSegmenter = <T extends RichTextItem>(item: T, get: (item: T) => RichTextReturn) => {
	let _text: string;
	let _facets: Facet[] | undefined;

	let _ui: RichTextUiSegment[];

	return (): RichTextUiSegment[] => {
		const { t: text, f: facets } = get(item);

		if (_text !== text || _facets !== facets) {
			_text = text;
			_facets = facets;

			const segments = segmentRichText(text, facets);
			_ui = renderRichText(segments);
		}

		return _ui;
	};
};

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
				type: LinkingType.PROFILE,
				actor: mention.did,
			};
		} else if (tag) {
			to = {
				type: LinkingType.TAG,
				tag: tag.tag,
			};
		} else if (link) {
			const uri = link.uri;
			const valid = isLinkValid(uri, text);

			to = {
				type: LinkingType.EXTERNAL,
				url: uri,
				valid: valid,
			};
		}

		ui.push({ text: text, to: to });
	}

	return ui;
};
