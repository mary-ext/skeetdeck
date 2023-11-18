import type { Records } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import type { SignalizedPost } from '../stores/posts.ts';

import { getCurrentDate, getRecordId } from '../utils/misc.ts';
import { createToggleMutation } from '../utils/toggle-mutation.ts';

const createPostRepostMutation = (post: SignalizedPost) => {
	return createToggleMutation({
		initialState: () => post.viewer.repost.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = post.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: Records['app.bsky.feed.repost'] = {
					createdAt: getCurrentDate(),
					subject: {
						uri: post.uri,
						cid: post.cid.value,
					},
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: 'app.bsky.feed.repost',
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevFollowingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: 'app.bsky.feed.repost',
							rkey: getRecordId(prevFollowingUri),
						},
					});
				}

				return undefined;
			}
		},
		finalize: (repostUri) => {
			post.viewer.repost.value = repostUri;
		},
	});
};

const mutations = new WeakMap<SignalizedPost, ReturnType<typeof createPostRepostMutation>>();

export const updatePostRepost = (post: SignalizedPost, repost: boolean) => {
	let mutate = mutations.get(post);
	if (!mutate) {
		mutations.set(post, (mutate = createPostRepostMutation(post)));
	}

	const promise = mutate(repost);

	if (post.viewer.repost.value) {
		post.repostCount.value--;
	} else {
		post.repostCount.value++;
	}

	post.viewer.repost.value = repost ? 'pending' : undefined;

	return promise;
};
