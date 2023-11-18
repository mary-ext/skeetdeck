import type { Records } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import type { SignalizedProfile } from '../stores/profiles.ts';

import { getCurrentDate, getRecordId } from '../utils/misc.ts';
import { createToggleMutation } from '../utils/toggle-mutation.ts';

const createProfileFollowMutation = (profile: SignalizedProfile) => {
	return createToggleMutation({
		initialState: () => profile.viewer.following.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = profile.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: Records['app.bsky.graph.follow'] = {
					createdAt: getCurrentDate(),
					subject: profile.did,
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: 'app.bsky.graph.follow',
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevFollowingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: 'app.bsky.graph.follow',
							rkey: getRecordId(prevFollowingUri),
						},
					});
				}

				return undefined;
			}
		},
		finalize: (followingUri) => {
			profile.viewer.following.value = followingUri;
		},
	});
};

const mutations = new WeakMap<SignalizedProfile, ReturnType<typeof createProfileFollowMutation>>();

export const updateProfileFollow = (profile: SignalizedProfile, follow: boolean) => {
	let mutate = mutations.get(profile);
	if (!mutate) {
		mutations.set(profile, (mutate = createProfileFollowMutation(profile)));
	}

	const promise = mutate(follow);
	profile.viewer.following.value = follow ? 'pending' : undefined;

	return promise;
};
