import type { AppBskyFeedRepost } from '@atcute/client/lexicons';

import { multiagent } from '../globals/agent';
import type { SignalizedPost } from '../stores/posts';
import { getCurrentDate, getRecordId } from '../utils/misc';
import { createToggleMutation } from '../utils/toggle-mutation';

const repostRecordType = 'app.bsky.feed.repost';

const createPostRepostMutation = (post: SignalizedPost) => {
	return createToggleMutation({
		initialState: () => post.viewer.repost.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = post.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: AppBskyFeedRepost.Record = {
					$type: 'app.bsky.feed.repost',
					createdAt: getCurrentDate(),
					subject: {
						uri: post.uri,
						cid: post.cid.value,
					},
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: repostRecordType,
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevFollowingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: repostRecordType,
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
	const repostUri = post.viewer.repost;

	if (!!repostUri.value !== repost) {
		post.repostCount.value += repostUri.value ? -1 : 1;
		repostUri.value = repost ? 'pending' : undefined;
	}

	return promise;
};
