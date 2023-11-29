import { Immer } from 'immer';

import type { DID } from '~/api/atp-schema.ts';

import { type InfiniteData } from '@pkg/solid-query';

import type { TimelineSlice } from '~/api/models/timeline.ts';
import type { TimelinePage, TimelinePageCursor } from '~/api/queries/get-timeline.ts';

const immer = new Immer({ autoFreeze: false });

export const produce = immer.produce;

export const produceTimelineFilter = (did: DID) => {
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
		const params = draft.pageParams;

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

		for (let i = 0, il = params.length; i < il; i++) {
			const param = params[i] as TimelinePageCursor | undefined;

			if (param) {
				const slices = param.remaining;

				for (let j = slices.length - 1; j >= 0; j--) {
					const slice = slices[j];

					if (isSliceMatching(slice)) {
						slices.splice(j, 1);
					}
				}
			}
		}
	});

	return updateTimeline;
};
