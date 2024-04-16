import type { QueryFunctionContext as QC } from '@externdefs/solid-query';

import type { AppBskyFeedDefs, At } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { createBatchedFetch } from '../utils/batch-fetch';

import { getCachedPost, mergePost, type SignalizedPost } from '../stores/posts';

import _getDid from './_did';

type Post = AppBskyFeedDefs.PostView;
type Query = [uid: At.DID, uri: string];

export const fetchPost = createBatchedFetch<Query, string, Post>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.uri,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const uris = queries.map((query) => query[1]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.feed.getPosts', {
			params: {
				uris: uris,
			},
		});

		return response.data.posts;
	},
});

export const getPostKey = (uid: At.DID, uri: string) => {
	return ['getPost', uid, uri] as const;
};
export const getPost = async (ctx: QC<ReturnType<typeof getPostKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	const post = await fetchPost([uid, uri]);
	ctx.signal.throwIfAborted();

	return mergePost(uid, post);
};

export const getInitialPost = (key: ReturnType<typeof getPostKey>): SignalizedPost | undefined => {
	const [, uid, uri] = key;

	const post = getCachedPost(uid, uri);

	return post;
};
