import type { AppBskyGraphBlock } from '../atp-schema';
import { multiagent } from '../globals/agent';
import type { SignalizedProfile } from '../stores/profiles';
import { getCurrentDate, getRecordId } from '../utils/misc';
import { createToggleMutation } from '../utils/toggle-mutation';

const blockRecordType = 'app.bsky.graph.block';

const createProfileBlockMutation = (profile: SignalizedProfile) => {
	return createToggleMutation({
		initialState: () => profile.viewer.blocking.value,
		mutate: async (prevBlockingUri, shouldBlock) => {
			const uid = profile.uid;
			const agent = await multiagent.connect(uid);

			if (shouldBlock) {
				const record: AppBskyGraphBlock.Record = {
					createdAt: getCurrentDate(),
					subject: profile.did,
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: blockRecordType,
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevBlockingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: blockRecordType,
							rkey: getRecordId(prevBlockingUri),
						},
					});
				}

				return undefined;
			}
		},
		finalize: (blockingUri) => {
			profile.viewer.blocking.value = blockingUri;
		},
	});
};

const mutations = new WeakMap<SignalizedProfile, ReturnType<typeof createProfileBlockMutation>>();

export const updateProfileBlock = (profile: SignalizedProfile, block: boolean) => {
	let mutate = mutations.get(profile);
	if (!mutate) {
		mutations.set(profile, (mutate = createProfileBlockMutation(profile)));
	}

	const promise = mutate(block);
	const blockingUri = profile.viewer.blocking;

	if (!!blockingUri.value !== block) {
		blockingUri.value = block ? 'pending' : undefined;
	}

	return promise;
};
