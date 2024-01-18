import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import { type SignalizedProfile, mergeProfile } from '../stores/profiles.ts';

export interface ListMember {
	uri: string;
	profile: SignalizedProfile;
}

export interface ListMembersPage {
	cursor: string | undefined;
	members: Array<ListMember>;
}

export const getListMembersKey = (uid: DID, uri: string, limit = 25) => {
	return ['getListMembers', uid, uri, limit] as const;
};
export const getListMembers = async (ctx: QC<ReturnType<typeof getListMembersKey>, string | undefined>) => {
	const [, uid, uri, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getList', {
		signal: ctx.signal,
		params: {
			list: uri,
			limit: limit,
			cursor: ctx.pageParam,
		},
	});

	const data = response.data;

	const page: ListMembersPage = {
		cursor: data.cursor,
		members: data.items.map((item) => ({
			uri: item.uri,
			profile: mergeProfile(uid, item.subject),
		})),
	};

	return page;
};
