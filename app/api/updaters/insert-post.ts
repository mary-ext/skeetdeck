import { produce } from '~/utils/immer.ts';

import { type SignalizedThread } from '../models/threads.ts';
import { SignalizedPost } from '../stores/posts.ts';

export const produceThreadInsert = (posts: SignalizedPost[], parentUri: string) => {
	let thread: SignalizedThread;

	for (let i = posts.length - 1; i >= 0; i--) {
		const post = posts[i];

		thread = {
			$type: 'thread',
			parent: undefined,
			post: post,
			replies: thread! && [thread],
		};
	}

	const updatePostThread_ = (draft: SignalizedThread) => {
		const replies = draft.replies;

		if (draft.post.uri === parentUri) {
			if (replies) {
				replies.unshift(thread);
			} else {
				draft.replies = [thread];
			}

			return true;
		}

		if (replies) {
			for (let i = 0, il = replies.length; i < il; i++) {
				const reply = replies[i];

				if (reply.$type === 'thread') {
					if (updatePostThread_(reply)) {
						return true;
					}
				}
			}
		}

		return false;
	};

	const updatePostThread = produce((draft: SignalizedThread) => {
		updatePostThread_(draft);
	});

	return updatePostThread;
};
