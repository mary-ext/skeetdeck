import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { mergeProfile } from '../stores/profiles';

export const searchProfilesKey = (uid: DID, query: string, limit = 30) => {
	return ['searchProfiles', uid, query, limit] as const;
};
export const searchProfiles = async (ctx: QC<ReturnType<typeof searchProfilesKey>, string | undefined>) => {
	const [, uid, query, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.searchActors', {
		signal: ctx.signal,
		params: {
			q: query,
			limit: limit,
			cursor: ctx.pageParam,
		},
	});

	const data = response.data;
	const profiles = data.actors;

	return {
		cursor: data.cursor,
		profiles: profiles.map((profile) => mergeProfile(uid, profile)),
	};
};
