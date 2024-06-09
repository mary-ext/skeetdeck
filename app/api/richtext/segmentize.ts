import type { Facet, FacetFeature } from './types';
import { createUtfString, getUtf8Length, sliceUtf8 } from './unicode';

export interface RichtextSegment {
	text: string;
	feature: FacetFeature | undefined;
}

const createSegment = (text: string, feature: FacetFeature | undefined): RichtextSegment => {
	return { text: text, feature: feature };
};

export const segmentRichText = (rtText: string, facets: Facet[] | undefined): RichtextSegment[] => {
	if (facets === undefined || facets.length === 0) {
		return [createSegment(rtText, undefined)];
	}

	const text = createUtfString(rtText);

	const segments: RichtextSegment[] = [];
	const length = getUtf8Length(text);

	const facetsLength = facets.length;

	let textCursor = 0;
	let facetCursor = 0;

	do {
		const facet = facets[facetCursor];
		const { byteStart, byteEnd } = facet.index;

		if (textCursor < byteStart) {
			segments.push(createSegment(sliceUtf8(text, textCursor, byteStart), undefined));
		} else if (textCursor > byteStart) {
			facetCursor++;
			continue;
		}

		if (byteStart < byteEnd) {
			const subtext = sliceUtf8(text, byteStart, byteEnd);
			const features = facet.features;

			if (features.length === 0 || subtext.trim().length === 0) {
				segments.push(createSegment(subtext, undefined));
			} else {
				segments.push(createSegment(subtext, features[0]));
			}
		}

		textCursor = byteEnd;
		facetCursor++;
	} while (facetCursor < facetsLength);

	if (textCursor < length) {
		segments.push(createSegment(sliceUtf8(text, textCursor, length), undefined));
	}

	return segments;
};
