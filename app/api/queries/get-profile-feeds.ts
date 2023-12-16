import type { InfiniteData, QueryFunctionContext as QC, QueryClient } from '@pkg/solid-query';

import type { DID, ResponseOf } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';
import { getRepoId } from '../utils/misc.ts';

export const getProfileFeedsKey = (uid: DID, actor: string, limit: number = 30) => {
	return ['getProfileFeeds', uid, actor, limit] as const;
};
export const getProfileFeeds = async (ctx: QC<ReturnType<typeof getProfileFeedsKey>, string | undefined>) => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.feed.getActorFeeds', {
		signal: ctx.signal,
		params: {
			actor: actor,
			limit: limit,
			cursor: ctx.pageParam,
		},
	});

	const data = response.data;

	return data;
};

type ResponseData = InfiniteData<ResponseOf<'app.bsky.feed.getActorFeeds'>>;

export const findFeedInQueryData = (client: QueryClient, uid: DID, uri: string) => {
	const actor = getRepoId(uri) as DID;

	const queries = client.getQueriesData<ResponseData>({
		queryKey: ['getProfileFeeds', uid, actor],
	});

	for (let i = 0, ilen = queries.length; i < ilen; i++) {
		const data = queries[i][1];

		if (!data) {
			continue;
		}

		const pages = data.pages;

		for (let j = 0, jlen = pages.length; j < jlen; j++) {
			const page = pages[j];
			const lists = page.feeds;

			for (let k = 0, klen = lists.length; k < klen; k++) {
				const feed = lists[k];

				if (feed.uri === uri) {
					return feed;
				}
			}
		}
	}
};
