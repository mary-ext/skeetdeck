import type { At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { multiagent } from '../globals/agent';
import { moderateProfileList } from '../moderation/utils';
import { mergeProfile } from '../stores/profiles';

export const getLikesKey = (uid: At.DID, uri: string, limit = 25) => {
	return ['getLikes', uid, uri, limit] as const;
};
export const getLikes = async (ctx: QC<ReturnType<typeof getLikesKey>, string | undefined>) => {
	const [, uid, uri, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.feed.getLikes', {
		signal: ctx.signal,
		params: {
			uri: uri,
			limit: limit,
			cursor: ctx.pageParam,
		},
	});

	const data = response.data;

	return {
		cursor: data.cursor,
		profiles: moderateProfileList(
			data.likes.map((like) => mergeProfile(uid, like.actor)),
			ctx.meta?.moderation,
		),
	};
};
