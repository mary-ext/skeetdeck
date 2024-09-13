import type { At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { multiagent } from '../globals/agent';
import { mergeProfile } from '../stores/profiles';

export const getSuggestedFollowsKey = (uid: At.DID, limit = 30) => {
	return ['getSuggestedFollows', uid, limit] as const;
};
export const getSuggestedFollows = async (
	ctx: QC<ReturnType<typeof getSuggestedFollowsKey>, string | undefined>,
) => {
	const [, uid, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.getSuggestions', {
		signal: ctx.signal,
		params: {
			cursor: ctx.pageParam,
			limit: limit,
		},
	});

	const data = response.data;
	const profiles = data.actors;

	return {
		cursor: data.cursor,
		profiles: profiles.map((profile) => mergeProfile(uid, profile)),
	};
};
