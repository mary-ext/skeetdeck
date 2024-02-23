import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { getCachedList, mergeList } from '../stores/lists';

export const getListInfoKey = (uid: At.DID, uri: string) => {
	return ['getListInfo', uid, uri] as const;
};
export const getListInfo = async (ctx: QC<ReturnType<typeof getListInfoKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getList', {
		signal: ctx.signal,
		params: {
			list: uri,
			limit: 1,
		},
	});

	const data = response.data;
	return mergeList(uid, data.list);
};

export const getInitialListInfo = (key: ReturnType<typeof getListInfoKey>) => {
	const [, uid, uri] = key;

	const list = getCachedList(uid, uri);

	return list;
};
