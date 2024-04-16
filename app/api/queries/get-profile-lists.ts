import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { mergeList } from '../stores/lists';

export const getProfileListsKey = (uid: At.DID, actor: string, limit: number = 30) => {
	return ['getProfileLists', uid, actor, limit] as const;
};
export const getProfileLists = async (ctx: QC<ReturnType<typeof getProfileListsKey>, string | undefined>) => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getLists', {
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
		lists: data.lists.map((list) => mergeList(uid, list)),
	};
};
