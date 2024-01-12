import type { Records } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import type { SignalizedFeed } from '../stores/feeds.ts';

import { getCurrentDate, getRecordId } from '../utils/misc.ts';
import { createToggleMutation } from '../utils/toggle-mutation.ts';

const likeRecordType = 'app.bsky.feed.like';

const createFeedLikeMutation = (feed: SignalizedFeed) => {
	return createToggleMutation({
		initialState: () => feed.viewer.like.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = feed.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: Records[typeof likeRecordType] = {
					createdAt: getCurrentDate(),
					subject: {
						uri: feed.uri,
						cid: feed.cid.value,
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
			feed.viewer.like.value = likeUri;
		},
	});
};

const mutations = new WeakMap<SignalizedFeed, ReturnType<typeof createFeedLikeMutation>>();

export const updateFeedLike = (feed: SignalizedFeed, like: boolean) => {
	let mutate = mutations.get(feed);
	if (!mutate) {
		mutations.set(feed, (mutate = createFeedLikeMutation(feed)));
	}

	const promise = mutate(like);
	const likeUri = feed.viewer.like;

	if (!!likeUri.value !== like) {
		feed.likeCount.value += likeUri.value ? -1 : 1;
		likeUri.value = like ? 'pending' : undefined;
	}

	return promise;
};
