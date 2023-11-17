import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

// @todo: should this be committed to global store?
// perhaps it would be better off not to.

export const searchProfilesTypeaheadKey = (uid: DID, query: string, limit = 30) => {
	return ['searchProfilesTypeahead', uid, query, limit] as const;
};
export const searchProfilesTypeahead = async (ctx: QC<ReturnType<typeof searchProfilesTypeaheadKey>>) => {
	const [, uid, query, limit] = ctx.queryKey;

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
