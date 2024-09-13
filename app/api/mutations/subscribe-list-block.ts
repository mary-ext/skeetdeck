import type { AppBskyGraphListblock } from '@atcute/client/lexicons';

import { multiagent } from '../globals/agent';
import type { SignalizedList } from '../stores/lists';
import { getCurrentDate, getRecordId } from '../utils/misc';
import { createToggleMutation } from '../utils/toggle-mutation';

const blockRecordType = 'app.bsky.graph.listblock';

const createListBlockMutation = (list: SignalizedList) => {
	return createToggleMutation({
		initialState: () => list.viewer.blocked.value,
		mutate: async (prevBlockedUri, shouldBlock) => {
			const uid = list.uid;
			const agent = await multiagent.connect(uid);

			if (shouldBlock) {
				const record: AppBskyGraphListblock.Record = {
					$type: 'app.bsky.graph.listblock',
					createdAt: getCurrentDate(),
					subject: list.uri,
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
				if (prevBlockedUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: blockRecordType,
							rkey: getRecordId(prevBlockedUri),
						},
					});
				}

				return undefined;
			}
		},
		finalize: (blockedUri) => {
			list.viewer.blocked.value = blockedUri;
		},
	});
};

const mutations = new WeakMap<SignalizedList, ReturnType<typeof createListBlockMutation>>();

export const subscribeListBlock = (list: SignalizedList, block: boolean) => {
	let mutate = mutations.get(list);
	if (!mutate) {
		mutations.set(list, (mutate = createListBlockMutation(list)));
	}

	const promise = mutate(block);
	const blockedUri = list.viewer.blocked;

	if (!!blockedUri.value !== block) {
		blockedUri.value = block ? 'pending' : undefined;
	}

	return promise;
};
