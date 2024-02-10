import type { InfiniteData } from '@pkg/solid-query';

import { produce } from '~/utils/immer';

import type { UnionOf } from '../atp-schema';

import type { ThreadData } from '../models/threads';
import type { TimelinePage } from '../queries/get-timeline';
import { SignalizedPost } from '../stores/posts';

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

	const updatePostThread = produce((draft: ThreadData) => {
		const ancestors = draft.ancestors;
		const descendants = draft.descendants;

		// Search ancestors
		for (let i = ancestors.length - 1; i >= 0; i--) {
			const item = ancestors[i];

			// If we encountered something else then there's nothing else upwards
			if (!(item instanceof SignalizedPost)) {
				break;
			}

			if (item.uri === postUri) {
				// Insert a #notFoundPost here to make it clear it's been deleted.
				const notFoundPost: UnionOf<'app.bsky.feed.defs#notFoundPost'> = {
					$type: 'app.bsky.feed.defs#notFoundPost',
					notFound: true,
					uri: postUri,
				};

				ancestors.splice(0, i + 1, notFoundPost);

				// We're done, if it's in ancestors then it's not in descendants
				return;
			}
		}

		// Search descendants
		for (let i = 0, il = descendants.length; i < il; i++) {
			const x = descendants[i];

			if (x.type === 'post' && x.item.uri === postUri) {
				const parentUri = x.parentUri;

				// We've found the post, now let's find where the rabbit-hole ends.
				{
					const depth = x.depth;
					let amount = 1;

					// Anything that's >depth is ours, we immediately break when it finds
					// an item that isn't.
					for (let j = i + 1; j < il; j++) {
						const c = descendants[j];

						if (c.depth <= depth) {
							break;
						}

						amount++;
					}

					descendants.splice(i, amount);
				}

				// Next, we'll go to the parent and adjust the isEnd property.
				{
					const parent = i !== 0 && descendants[i - 1];

					// If the previous item in descendants array isn't our parent, then it
					// can be assumed that there's another reply in the parent, so we
					// don't need to adjust anything.
					if (parent && parent.type === 'post' && parent.item.uri === parentUri) {
						parent.isEnd = i === descendants.length - 1 || descendants[i].parentUri !== parentUri;
					}
				}

				// We're done.
				return;
			}
		}
	});

	return [updateTimeline, updatePostThread] as const;
};
