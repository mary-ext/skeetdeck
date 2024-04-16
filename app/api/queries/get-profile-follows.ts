import type { QueryFunctionContext as QC } from '@externdefs/solid-query';

import type { At } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { getCachedProfile, mergeProfile } from '../stores/profiles';

import { moderateProfileList } from '../moderation/utils';

export const getProfileFollowsKey = (uid: At.DID, actor: string, limit = 25) => {
	return ['getProfileFollows', uid, actor, limit] as const;
};
export const getProfileFollows = async (
	ctx: QC<ReturnType<typeof getProfileFollowsKey>, string | undefined>,
) => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getFollows', {
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
		subject: mergeProfile(uid, data.subject),
		profiles: moderateProfileList(
			data.follows.map((actor) => mergeProfile(uid, actor)),
			ctx.meta?.moderation,
		),
	};
};

export const getInitialProfileFollows = (key: ReturnType<typeof getProfileFollowsKey>) => {
	const [, uid, actor] = key;

	const profile = getCachedProfile(uid, actor as At.DID);

	if (profile) {
		return {
			pages: [
				{
					cursor: undefined,
					subject: profile,
					profiles: [],
				},
			],
			pageParams: [undefined],
		};
	}
};
