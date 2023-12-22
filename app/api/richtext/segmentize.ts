import { createUtfString, getUtf8Length, sliceUtf8 } from './unicode.ts';
import type { Facet, LinkFeature, MentionFeature, RichTextSegment, TagFeature } from './types.ts';

export interface RichTextOptions {
	text: string;
	facets?: Facet[];
	cleanNewLines?: boolean;
}

const createSegment = (text: string, facet?: Facet): RichTextSegment => {
	let link: LinkFeature | undefined;
	let mention: MentionFeature | undefined;
	let tag: TagFeature | undefined;

	if (facet) {
		const features = facet.features;

		for (let idx = 0, len = features.length; idx < len; idx++) {
			const feature = features[idx];
			const type = feature.$type;

			if (type === 'app.bsky.richtext.facet#link') {
				link = feature;
			} else if (type === 'app.bsky.richtext.facet#mention') {
				mention = feature;
			} else if (type === 'app.bsky.richtext.facet#tag') {
				tag = feature;
			}
		}
	}

	return { text, link, mention, tag };
};

export const segmentRichText = (rtText: string, facets: Facet[] | undefined) => {
	if (!facets || facets.length < 1) {
		return [createSegment(rtText)];
	}

	const text = createUtfString(rtText);

	const segments: RichTextSegment[] = [];
	const length = getUtf8Length(text);

	const facetsLength = facets.length;

	let textCursor = 0;
	let facetCursor = 0;

	do {
		const facet = facets[facetCursor];
		const { byteStart, byteEnd } = facet.index;

		if (textCursor < byteStart) {
			segments.push(createSegment(sliceUtf8(text, textCursor, byteStart)));
		} else if (textCursor > byteStart) {
			facetCursor++;
			continue;
		}

		if (byteStart < byteEnd) {
			const subtext = sliceUtf8(text, byteStart, byteEnd);

			if (!subtext.trim()) {
				// dont empty string entities
				segments.push(createSegment(subtext));
			} else {
				segments.push(createSegment(subtext, facet));
			}
		}

		textCursor = byteEnd;
		facetCursor++;
	} while (facetCursor < facetsLength);

	if (textCursor < length) {
		segments.push(createSegment(sliceUtf8(text, textCursor, length)));
	}

	return segments;
};
