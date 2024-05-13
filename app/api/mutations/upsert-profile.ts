import { XRPCError } from '@mary/bluesky-client/xrpc';

import type { AppBskyActorProfile, At } from '../atp-schema';
import { multiagent } from '../globals/agent';

export const upsertProfile = async (
	uid: At.DID,
	updater: (existing: AppBskyActorProfile.Record | undefined) => AppBskyActorProfile.Record,
) => {
	const agent = await multiagent.connect(uid);

	const existing = await agent.rpc
		.get('com.atproto.repo.getRecord', {
			params: {
				repo: uid,
				collection: 'app.bsky.actor.profile',
				rkey: 'self',
			},
		})
		.catch((err) => {
			if (err instanceof XRPCError) {
				if (err.kind === 'InvalidRequest') {
					return undefined;
				}
			}

			return Promise.reject(err);
		});

	const updated = updater(existing?.data.value as AppBskyActorProfile.Record | undefined);

	await agent.rpc.call('com.atproto.repo.putRecord', {
		data: {
			repo: uid,
			collection: 'app.bsky.actor.profile',
			rkey: 'self',
			record: updated,
			swapRecord: existing?.data.cid,
		},
	});
};
