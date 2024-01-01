import type { InfiniteData } from '@pkg/solid-query';

import { produce } from '~/utils/immer.ts';

import type { UnionOf } from '../atp-schema.ts';

import type { SignalizedThread } from '../models/threads.ts';
import type { TimelinePage } from '../queries/get-timeline.ts';

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

	const updatePostThreadNew_ = (draft: SignalizedThread) => {
		// Search the parent
		{
			let curr = draft;
			while (curr) {
				const parent = curr.parent;

				if (!parent || parent.$type !== 'thread') {
					break;
				}

				if (parent.post.uri === postUri) {
					// Insert a notFound post here, so it doesn't look like the reply below
					// it is a root post.
					const notFoundPost: UnionOf<'app.bsky.feed.defs#notFoundPost'> = {
						$type: 'app.bsky.feed.defs#notFoundPost',
						notFound: true,
						uri: postUri,
					};

					curr.parent = notFoundPost;
					return true;
				}

				curr = parent;
			}
		}

		// Search the replies
		const replies = draft.replies;

		if (replies) {
			for (let i = 0, il = replies.length; i < il; i++) {
				const reply = replies[i];

				if (reply.$type !== 'thread') {
					continue;
				}

				if (reply.post.uri === postUri) {
					replies.splice(i, 1);
					return true;
				}

				if (updatePostThreadNew_(reply)) {
					return true;
				}
			}
		}

		return false;
	};

	const updatePostThread = produce((draft: SignalizedThread) => {
		updatePostThreadNew_(draft);
	});

	return [updateTimeline, updatePostThread] as const;
};
