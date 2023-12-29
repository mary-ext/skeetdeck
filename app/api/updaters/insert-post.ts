import { produce } from '~/utils/immer.ts';

import type { ThreadPage } from '../models/thread.ts';
import { SignalizedPost } from '../stores/posts.ts';

export const producePostsInsert = (posts: SignalizedPost[], parentUri: string) => {
	const updatePostThread = produce((draft: ThreadPage) => {
		const descendants = draft.descendants;

		if (draft.post.uri === parentUri) {
			// @ts-expect-error
			descendants.unshift({ items: posts });
			return;
		}

		for (let i = 0, ilen = descendants.length; i < ilen; i++) {
			const slice = descendants[i];
			const items = slice.items;

			for (let j = 0, jlen = items.length; j < jlen; j++) {
				const item = items[j];

				// It's only at the end, but let's do this to make TS happy.
				if (!(item instanceof SignalizedPost)) {
					break;
				}

				// We found the post, break out of the loop entirely.
				if (item.uri === parentUri) {
					// @ts-expect-error
					slice.items = items.slice(0, j + 1).concat(posts);
					return;
				}
			}
		}
	});

	return updatePostThread;
};
