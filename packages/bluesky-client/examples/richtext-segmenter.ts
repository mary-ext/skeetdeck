// This example provides a way to segmentize the facets into usable segments of
// rich text for use in rendering post content

// The UnicodeString class is a wrapper for handling UTF-8 and UTF-16 strings
// in a safe manner, as facets are represented with UTF-8 indices.

import type { RefOf, UnionOf } from '../lib/atp-schema.js';

type Facet = RefOf<'app.bsky.richtext.facet'>;
type MentionFacet = UnionOf<'app.bsky.richtext.facet#mention'>;
type LinkFacet = UnionOf<'app.bsky.richtext.facet#link'>;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class UnicodeString {
	utf16: string;
	utf8: Uint8Array;

	constructor(utf16: string) {
		this.utf16 = utf16;
		this.utf8 = encoder.encode(utf16);
	}

	get length() {
		return this.utf8.byteLength;
	}

	slice(start?: number, end?: number): string {
		return decoder.decode(this.utf8.slice(start, end));
	}
}

export interface RichTextSegment {
	text: string;
	link?: LinkFacet;
	mention?: MentionFacet;
}

export interface RichTextOptions {
	text: string;
	facets?: Facet[];
}

const createSegment = (text: string, facet?: Facet): RichTextSegment => {
	let link: LinkFacet | undefined;
	let mention: MentionFacet | undefined;

	if (facet) {
		const features = facet.features;

		for (let idx = 0, len = features.length; idx < len; idx++) {
			const feature = features[idx];

			if (feature.$type === 'app.bsky.richtext.facet#link') {
				link = feature;
			} else if (feature.$type === 'app.bsky.richtext.facet#mention') {
				mention = feature;
			}
		}
	}

	return { text, link, mention };
};

export const segmentRichText = (opts: RichTextOptions) => {
	const text = new UnicodeString(opts.text);
	const facets = opts.facets;

	if (!facets || facets.length < 1) {
		return [createSegment(text.utf16)];
	}

	const segments: RichTextSegment[] = [];
	let textCursor = 0;
	let facetCursor = 0;

	do {
		const facet = facets[facetCursor];
		const index = facet.index;

		if (textCursor < index.byteStart) {
			segments.push(createSegment(text.slice(textCursor, index.byteStart)));
		} else if (textCursor > index.byteStart) {
			facetCursor++;
			continue;
		}

		if (index.byteStart < index.byteEnd) {
			const subtext = text.slice(index.byteStart, index.byteEnd);

			if (!subtext.trim()) {
				segments.push(createSegment(subtext));
			} else {
				segments.push(createSegment(subtext, facet));
			}
		}

		textCursor = index.byteEnd;
		facetCursor++;
	} while (facetCursor < facets.length);

	if (textCursor < text.length) {
		segments.push(createSegment(text.slice(textCursor, text.length)));
	}

	return segments;
};
