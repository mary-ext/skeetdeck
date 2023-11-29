import type { Records } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import type { SignalizedPost } from '../stores/posts.ts';

import { getCurrentDate, getRecordId } from '../utils/misc.ts';
import { createToggleMutation } from '../utils/toggle-mutation.ts';

const likeRecordType = 'app.bsky.feed.like';

const createPostLikeMutation = (post: SignalizedPost) => {
	return createToggleMutation({
		initialState: () => post.viewer.like.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = post.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: Records[typeof likeRecordType] = {
					createdAt: getCurrentDate(),
					subject: {
						uri: post.uri,
						cid: post.cid.value,
					},
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: likeRecordType,
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevFollowingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: likeRecordType,
							rkey: getRecordId(prevFollowingUri),
						},
					});
				}

				return undefined;
			}
		},
		finalize: (likeUri) => {
			post.viewer.like.value = likeUri;
		},
	});
};

const mutations = new WeakMap<SignalizedPost, ReturnType<typeof createPostLikeMutation>>();

export const updatePostLike = (post: SignalizedPost, like: boolean) => {
	let mutate = mutations.get(post);
	if (!mutate) {
		mutations.set(post, (mutate = createPostLikeMutation(post)));
	}

	const promise = mutate(like);
	const likeUri = post.viewer.like;

	post.likeCount.value += likeUri.value ? -1 : 1;
	likeUri.value = like ? 'pending' : undefined;

	return promise;
};
