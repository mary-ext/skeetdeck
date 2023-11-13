import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { isDid } from '~/api/utils/misc.ts';

import { type SignalizedProfile, getCachedProfile, mergeProfile } from '~/api/stores/profiles.ts';

export const getProfileKey = (uid: DID, actor: string) => {
	return ['getProfile', uid, actor] as const;
};
export const getProfile = async (ctx: QC<ReturnType<typeof getProfileKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.getProfile', {
		signal: ctx.signal,
		params: {
			actor: actor,
		},
	});

	const data = response.data;
	const profile = mergeProfile(uid, data);

	if (data.did === uid) {
		const $accounts = multiagent.accounts;
		const account = $accounts.find((acc) => acc.did === uid);

		if (account) {
			const profile = account.profile;

			if (!profile || profile.indexedAt !== data.indexedAt || profile.handle !== data.handle) {
				account.profile = {
					displayName: data.displayName,
					handle: data.handle,
					avatar: data.avatar,
					indexedAt: data.indexedAt,
				};
			}
		}
	}

	return profile;
};

export const getInitialProfile = (key: ReturnType<typeof getProfileKey>): SignalizedProfile | undefined => {
	const [, uid, actor] = key;

	if (isDid(actor)) {
		const profile = getCachedProfile(uid, actor);

		return profile;
	}

	return;
};
