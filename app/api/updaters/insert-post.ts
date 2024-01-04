import { produce } from '~/utils/immer.ts';

import { type ThreadData } from '../models/threads.ts';
import { SignalizedPost } from '../stores/posts.ts';

export const produceThreadInsert = (posts: SignalizedPost[], parentUri: string) => {
	const updatePostThread = produce((draft: ThreadData) => {
		const maxDepth = draft.maxDepth;
		const descendants = draft.descendants;

		if (draft.post.uri === parentUri) {
			const items = createDescendants(posts, parentUri, descendants.length > 0, 0, maxDepth);
			descendants.unshift(...items);

			return;
		}

		for (let i = 0, il = descendants.length; i < il; i++) {
			const x = descendants[i];

			if (x.type === 'post' && x.item.uri === parentUri) {
				const items = createDescendants(posts, parentUri, !x.isEnd, x.depth + 1, maxDepth);

				x.isEnd = false;
				descendants.splice(i + 1, 0, ...items);
				return;
			}
		}
	});

	return updatePostThread;
};

const createDescendants = (
	posts: SignalizedPost[],
	parentUri: string,
	hasSibling: boolean,
	depth: number,
	maxDepth: number,
) => {
	const items: ThreadData['descendants'] = [];

	const il = posts.length;

	const amount = Math.min(il, maxDepth - depth);
	const end = amount >= il;

	if (amount > 0) {
		for (let i = 0, par = parentUri; i < amount; i++) {
			const post = posts[i];

			items.push({
				type: 'post',
				item: post,
				parentUri: par,
				depth: depth + i,
				// hasNextSibling: hasSibling && i === 0,
				isEnd: end && i === il - 1,
			});

			par = post.uri;
		}
	}

	if (!end && amount >= 0) {
		const last = posts[amount];

		items.push({
			type: 'overflow',
			parentUri: last.uri,
			depth: maxDepth,
			// hasNextSibling: false,
		});
	}

	return items;
};
