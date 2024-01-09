import { multiagent } from '../globals/agent.ts';

import type { SignalizedProfile } from '../stores/profiles.ts';

import { createToggleMutation } from '../utils/toggle-mutation.ts';

const createProfileMuteMutation = (profile: SignalizedProfile) => {
	return createToggleMutation({
		initialState: () => profile.viewer.muted.value,
		mutate: async (_prevMuted, shouldMute) => {
			const uid = profile.uid;
			const agent = await multiagent.connect(uid);

			if (shouldMute) {
				await agent.rpc.call('app.bsky.graph.muteActor', {
					data: {
						actor: profile.did,
					},
				});

				return true;
			} else {
				await agent.rpc.call('app.bsky.graph.unmuteActor', {
					data: {
						actor: profile.did,
					},
				});

				return false;
			}
		},
		finalize: (muted) => {
			profile.viewer.muted.value = muted;
		},
	});
};

const mutations = new WeakMap<SignalizedProfile, ReturnType<typeof createProfileMuteMutation>>();

export const updateProfileMute = (profile: SignalizedProfile, mute: boolean) => {
	let mutate = mutations.get(profile);
	if (!mutate) {
		mutations.set(profile, (mutate = createProfileMuteMutation(profile)));
	}

	const promise = mutate(mute);

	profile.viewer.muted.value = mute;

	return promise;
};
