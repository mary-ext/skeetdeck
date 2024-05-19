import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { moderateProfileList } from '../moderation/utils';
import { mergeProfile } from '../stores/profiles';

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

	return moderateProfileList(
		data.actors.map((actor) => mergeProfile(uid, actor)),
		ctx.meta?.moderation,
	);
};
