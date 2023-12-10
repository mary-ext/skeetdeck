import { produce } from '~/utils/immer.ts';

import type { ThreadPage } from '~/api/models/thread.ts';

import { SignalizedPost } from '~/api/stores/posts.ts';

export const producePostThreadInsert = (post: SignalizedPost, parentUri: string) => {
	return produce((data: ThreadPage) => {
		const descendants = data.descendants;

		if (data.post.uri === parentUri) {
			descendants.unshift({ items: [post] });
			return;
		}

		for (let i = 0, ilen = descendants.length; i < ilen; i++) {
			const slice = descendants[i];
			const items = slice.items;

			// UI always has actualDepth + 1 for the height,
			// so let's use that as our assumption.
			if (items.length > data.depth - 1) {
				continue;
			}

			for (let j = 0, jlen = items.length; j < jlen; j++) {
				const item = items[j];

				// It's only at the end, but let's do this to make TS happy.
				if (!(item instanceof SignalizedPost)) {
					break;
				}

				// We found the post, break out of the loop entirely.
				if (item.uri === parentUri) {
					items.splice(j + 1, jlen, post);
					return;
				}
			}
		}
	});
};
