import type { QueryFunctionContext as QC } from '@externdefs/solid-query';

import type { AppBskyFeedDefs, At } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { createBatchedFetch } from '../utils/batch-fetch';

import { getCachedFeed, mergeFeed } from '../stores/feeds';

type Feed = AppBskyFeedDefs.GeneratorView;
type Query = [uid: At.DID, uri: string];

export const fetchFeedBatched = createBatchedFetch<Query, string, Feed>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.uri,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const uris = queries.map((query) => query[1]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.feed.getFeedGenerators', {
			params: {
				feeds: uris,
			},
		});

		return response.data.feeds;
	},
});

export const getFeedInfoKey = (uid: At.DID, uri: string) => {
	return ['getFeedInfo', uid, uri] as const;
};
export const getFeedInfo = async (ctx: QC<ReturnType<typeof getFeedInfoKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	// @todo: wrap this under ctx.meta?.batched condition?
	const feed = await fetchFeedBatched([uid, uri]);
	ctx.signal.throwIfAborted();

	return mergeFeed(uid, feed);
};

export const getInitialFeedInfo = (key: ReturnType<typeof getFeedInfoKey>) => {
	const [, uid, uri] = key;

	const feed = getCachedFeed(uid, uri);

	return feed;
};
