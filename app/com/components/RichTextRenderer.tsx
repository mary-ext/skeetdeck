import { type JSX } from 'solid-js';

import { isLinkValid } from '~/api/richtext/renderer.ts';
import { segmentRichText } from '~/api/richtext/segmentize.ts';
import type { Facet, RichTextSegment } from '~/api/richtext/types.ts';

import { type Linking, LINK_EXTERNAL, LINK_PROFILE, LINK_TAG, useLinking } from './Link.tsx';

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

const richtexts = new WeakMap<WeakKey, () => RichTextUiSegment[]>();

const RichTextRenderer = <T extends object>(props: RichTextRendererProps<T>) => {
	const linking = useLinking();
	const get = props.get;

	const segments = () => {
		const item = props.item;

		let segmenter = richtexts.get(item);
		if (!segmenter) {
			richtexts.set(item, (segmenter = createSegmenter(item, get)));
		}

		return segmenter();
	};

	const navigateLink = (ev: MouseEvent | KeyboardEvent) => {
		const enum ShouldLink {
			NO,
			YES,
			WITH_ALT,
		}

		let nav = ShouldLink.NO;

		if (ev instanceof MouseEvent) {
			nav = ev.ctrlKey || ev.button === 1 ? ShouldLink.WITH_ALT : ShouldLink.YES;
		} else if (ev instanceof KeyboardEvent && ev.key === 'Enter') {
			nav = ev.ctrlKey ? ShouldLink.WITH_ALT : ShouldLink.YES;
		}

		if (nav !== ShouldLink.NO) {
			const target = ev.currentTarget as any;
			const to = target.$to as Linking | undefined;

			if (to) {
				linking.navigate(to, nav === ShouldLink.WITH_ALT);
			}
		}
	};

	const render = () => {
		const ui = segments();
		const nodes: JSX.Element = [];

		for (let idx = 0, len = ui.length; idx < len; idx++) {
			const { text, to } = ui[idx];

			if (to) {
				let link: JSX.Element;

				// @todo: should probably stop using <button> on PaneLinkingContext
				// because it hasn't been fun smoothing out the differences between <a>
				// and <button> elements, let's just use <span> instead?
				if (import.meta.env.VITE_MODE === 'desktop' && to.type !== LINK_EXTERNAL) {
					link = (
						<a
							role="link"
							tabindex={0}
							// @ts-expect-error
							prop:$to={to}
							onClick={navigateLink}
							onKeyDown={navigateLink}
							class="cursor-pointer text-accent hover:underline"
						>
							{text}
						</a>
					);
				} else {
					link = linking.render({
						to: to,
						children: text,
						class: 'text-accent hover:underline',
					});
				}

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

const createSegmenter = <T extends object>(item: T, get: (item: T) => RichTextReturn) => {
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
				type: LINK_PROFILE,
				actor: mention.did,
			};
		} else if (tag) {
			to = {
				type: LINK_TAG,
				tag: tag.tag,
			};
		} else if (link) {
			const uri = link.uri;
			const valid = isLinkValid(uri, text);

			to = {
				type: LINK_EXTERNAL,
				url: uri,
				valid: valid,
			};
		}

		ui.push({ text: text, to: to });
	}

	return ui;
};
