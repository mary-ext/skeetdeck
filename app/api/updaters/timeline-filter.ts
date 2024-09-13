import { type InfiniteData } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import type { TimelineSlice } from '~/api/models/timeline';
import type { TimelinePage } from '~/api/queries/get-timeline';

import { produce } from '~/utils/immer';

export const produceTimelineFilter = (did: At.DID) => {
	const isSliceMatching = (slice: TimelineSlice) => {
		const items = slice.items;

		for (let k = items.length - 1; k >= 0; k--) {
			const item = items[k];

			if (item.reason?.by.did === did || item.post.author.did === did) {
				return true;
			}
		}

		return false;
	};

	const updateTimeline = produce((draft: InfiniteData<TimelinePage>) => {
		const pages = draft.pages;

		for (let i = 0, il = pages.length; i < il; i++) {
			const page = pages[i];
			const slices = page.slices;

			for (let j = slices.length - 1; j >= 0; j--) {
				const slice = slices[j];

				if (isSliceMatching(slice)) {
					slices.splice(j, 1);
				}
			}
		}
	});

	return updateTimeline;
};
