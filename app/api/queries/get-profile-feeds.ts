import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { mergeFeed } from '../stores/feeds';

export const getProfileFeedsKey = (uid: At.DID, actor: string, limit: number = 30) => {
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

	return {
		cursor: data.cursor,
		feeds: data.feeds.map((feed) => mergeFeed(uid, feed)),
	};
};
