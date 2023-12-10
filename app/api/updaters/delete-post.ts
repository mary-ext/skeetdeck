import type { InfiniteData } from '@pkg/solid-query';

import { produce } from '~/utils/immer.ts';

import type { UnionOf } from '../atp-schema.ts';

import type { ThreadPage } from '../models/thread.ts';
import type { TimelinePage } from '../queries/get-timeline.ts';
import { SignalizedPost } from '../stores/posts.ts';

export const producePostDelete = (postUri: string) => {
	const updateTimeline = produce((draft: InfiniteData<TimelinePage>) => {
		const pages = draft.pages;

		for (let i = 0, ilen = pages.length; i < ilen; i++) {
			const page = pages[i];
			const slices = page.slices;

			for (let j = 0, jlen = slices.length; j < jlen; j++) {
				const slice = slices[j];
				const items = slice.items;

				for (let k = 0, klen = items.length; k < klen; k++) {
					const item = items[k];

					// We've found it.
					if (item.post.uri === postUri) {
						if (k === 0) {
							if (klen === 1) {
								// We're the only item in the slice, so remove it entirely.
								slices.splice(j, 1);
							} else {
								// We're first, but not the only one, only remove our own post.
								items.splice(k, 1);
							}
						} else {
							// Remove the post and its connecting replies
							const spliced = items.splice(k, klen);

							// If there's connecting replies, reinsert it as a new slice, just
							// before the current slice as it's guaranteed newer.
							if (spliced.length > 1) {
								slices.splice(j, 0, { items: spliced.slice(1) });
							}
						}

						// We're done, there can only be one post in the entire timeline.
						return;
					}
				}
			}
		}
	});

	const updatePostThread = produce((draft: ThreadPage) => {
		const ancestors = draft.ancestors;
		const descendants = draft.descendants;

		for (let i = 0, il = ancestors.length; i < il; i++) {
			const item = ancestors[i];

			if (!(item instanceof SignalizedPost)) {
				continue;
			}

			if (item.uri === postUri) {
				// Insert a notFound post here, so it doesn't look like the reply below
				// it is a root post.
				const notFoundPost: UnionOf<'app.bsky.feed.defs#notFoundPost'> = {
					$type: 'app.bsky.feed.defs#notFoundPost',
					notFound: true,
					uri: postUri,
				};

				ancestors.splice(0, i + 1, notFoundPost);
				// We're done, if it's in the ancestors then it can't be in descendants
				return;
			}
		}

		for (let i = 0, ilen = descendants.length; i < ilen; i++) {
			const slice = descendants[i];
			const items = slice.items;

			for (let j = 0, jlen = items.length; j < jlen; j++) {
				const item = items[j];

				// notFoundPost and blockedPost are only at the end, so let's break
				// anyway while we're at it.
				if (!(item instanceof SignalizedPost)) {
					break;
				}

				if (item.uri === postUri) {
					// Remove the connecting replies as well because it's gonna look
					// super-odd if they remain connected.
					if (j === 0) {
						descendants.splice(i, 1);
					} else {
						items.splice(j, jlen);
					}

					// We're done here, there can only be one descendant.
					return;
				}
			}
		}
	});

	return [updateTimeline, updatePostThread] as const;
};
