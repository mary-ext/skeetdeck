import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { AppBskyActorDefs, At } from '../atp-schema';
import { multiagent } from '../globals/agent';
import { getCachedProfile, mergeProfile, type SignalizedProfile } from '../stores/profiles';
import { createBatchedFetch } from '../utils/batch-fetch';

type ProfileData = AppBskyActorDefs.ProfileViewDetailed;
type Query = [uid: At.DID, actor: string];

export const fetchProfileBatched = createBatchedFetch<Query, string, ProfileData>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.did,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const actors = queries.map((query) => query[1]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.actor.getProfiles', {
			params: {
				actors,
			},
		});

		const profiles = response.data.profiles;
		return profiles;
	},
});

export const getProfileKey = (uid: At.DID, actor: string) => {
	return ['getProfile', uid, actor] as const;
};
export const getProfile = async (ctx: QC<ReturnType<typeof getProfileKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	let data: ProfileData;

	if (ctx.meta?.batched) {
		data = await fetchProfileBatched([uid, actor]);
		ctx.signal.throwIfAborted();
	} else {
		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.actor.getProfile', {
			signal: ctx.signal,
			params: {
				actor: actor,
			},
		});

		data = response.data;
	}

	const profile = mergeProfile(uid, data);

	if (data.did === uid) {
		const $accounts = multiagent.accounts;
		const account = $accounts.find((acc) => acc.did === uid);

		if (account) {
			const profile = account.profile;

			if (!profile || profile.indexedAt !== data.indexedAt /* || profile.handle !== data.handle */) {
				account.profile = {
					displayName: data.displayName,
					// handle: data.handle,
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

	const profile = getCachedProfile(uid, actor as At.DID);

	return profile;
};
