import type { QueryFunctionContext as QC } from '@externdefs/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';

// @todo: should this be committed to global store?
// perhaps it would be better off not to.

export const searchProfilesTypeaheadKey = (uid: At.DID, query: string, limit = 30) => {
	return ['searchProfilesTypeahead', uid, query, limit] as const;
};
export const searchProfilesTypeahead = async (ctx: QC<ReturnType<typeof searchProfilesTypeaheadKey>>) => {
	const [, uid, query, limit] = ctx.queryKey;

	if (query === '' || query.includes(':') || query.includes('"')) {
		return [];
	}

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
		signal: ctx.signal,
		params: {
			q: query,
			limit: limit,
		},
	});

	const data = response.data;

	return data.actors;
};
