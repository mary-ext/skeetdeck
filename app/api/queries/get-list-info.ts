import type { QueryFunctionContext as QC, QueryClient } from '@pkg/solid-query';

import type { DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import { findListInQueryData as findListInProfileListsData } from './get-profile-lists.ts';

export const getListInfoKey = (uid: DID, uri: string) => {
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
	return data.list;
};

export const getInitialListInfo = (client: QueryClient, key: ReturnType<typeof getListInfoKey>) => {
	const [, uid, uri] = key;

	{
		const data = findListInProfileListsData(client, uid, uri);
		if (data) {
			return data;
		}
	}
};
