import { multiagent } from '../globals/agent';

import type { SignalizedList } from '../stores/lists';

import { createToggleMutation } from '../utils/toggle-mutation';

const createListMuteMutation = (list: SignalizedList) => {
	return createToggleMutation({
		initialState: () => list.viewer.muted.value,
		mutate: async (_prevMuted, shouldMute) => {
			const uid = list.uid;
			const agent = await multiagent.connect(uid);

			if (shouldMute) {
				await agent.rpc.call('app.bsky.graph.muteActorList', {
					data: {
						list: list.uri,
					},
				});

				return true;
			} else {
				await agent.rpc.call('app.bsky.graph.unmuteActorList', {
					data: {
						list: list.uri,
					},
				});

				return false;
			}
		},
		finalize: (muted) => {
			list.viewer.muted.value = muted;
		},
	});
};

const mutations = new WeakMap<SignalizedList, ReturnType<typeof createListMuteMutation>>();

export const subscribeListMute = (list: SignalizedList, mute: boolean) => {
	let mutate = mutations.get(list);
	if (!mutate) {
		mutations.set(list, (mutate = createListMuteMutation(list)));
	}

	const promise = mutate(mute);

	list.viewer.muted.value = mute;

	return promise;
};
