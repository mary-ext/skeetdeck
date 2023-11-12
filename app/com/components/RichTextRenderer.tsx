import { type JSX } from 'solid-js';
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

const TRIM_HOST_RE = /^www\./;
const TRIM_URLTEXT_RE = /^\s*(https?:\/\/)?(?:www\.)?/;
const PATH_MAX_LENGTH = 18;

export const toShortUrl = (uri: string): string => {
	try {
		const url = new URL(uri);
		const protocol = url.protocol;

		const host = url.host.replace(TRIM_HOST_RE, '');
		const pathname = url.pathname;

		const path = (pathname === '/' ? '' : pathname) + url.search + url.hash;

		if (protocol === 'http:' || protocol === 'https:') {
			if (path.length > PATH_MAX_LENGTH) {
				return host + path.slice(0, PATH_MAX_LENGTH - 1) + '…';
			}

			return host + path;
		}
	} catch {}

	return uri;
};

const buildHostPart = (url: URL) => {
	const username = url.username;
	// const password = url.password;

	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const port = url.port;

	// const auth = username ? username + (password ? ':' + password : '') + '@' : '';

	// Perhaps might be best if we always warn on authentication being passed.
	const auth = username ? '\0@@\0' : '';
	const host = hostname + (port ? ':' + port : '');

	return auth + host;
};

export const isLinkValid = (uri: string, text: string) => {
	let url: URL;
	let protocol: string;
	try {
		url = new URL(uri);
		protocol = url.protocol;

		if (protocol !== 'https:' && protocol !== 'http:') {
			return false;
		}
	} catch {
		return false;
	}

	const expectedHost = buildHostPart(url);
	const length = expectedHost.length;

	const normalized = text.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const normalizedLength = normalized.length;

	const boundary = normalizedLength >= length ? normalized[length] : undefined;

	return (
		(!boundary || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};
