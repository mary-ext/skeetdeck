import type { AppBskyGraphFollow } from '../atp-schema';
import { multiagent } from '../globals/agent';
import type { SignalizedProfile } from '../stores/profiles';
import { getCurrentDate, getRecordId } from '../utils/misc';
import { createToggleMutation } from '../utils/toggle-mutation';

const followRecordType = 'app.bsky.graph.follow';

const createProfileFollowMutation = (profile: SignalizedProfile) => {
	return createToggleMutation({
		initialState: () => profile.viewer.following.value,
		mutate: async (prevFollowingUri, shouldFollow) => {
			const uid = profile.uid;
			const agent = await multiagent.connect(uid);

			if (shouldFollow) {
				const record: AppBskyGraphFollow.Record = {
					createdAt: getCurrentDate(),
					subject: profile.did,
				};

				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: followRecordType,
						record: record,
					},
				});

				return response.data.uri;
			} else {
				if (prevFollowingUri) {
					await agent.rpc.call('com.atproto.repo.deleteRecord', {
						data: {
							repo: uid,
							collection: followRecordType,
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
	const followingUri = profile.viewer.following;

	if (!!followingUri.value !== follow) {
		profile.followersCount.value += followingUri.value ? -1 : 1;
		followingUri.value = follow ? 'pending' : undefined;
	}

	return promise;
};
