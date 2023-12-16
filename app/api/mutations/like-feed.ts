import type { QueryClient } from '@pkg/solid-query';

import type { DID, Records, RefOf } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import type { Shadow } from '../caches/shadow.ts';
import { feedShadow } from '../caches/feeds.ts';

import { getCurrentDate, getRecordId } from '../utils/misc.ts';

const likeRecordType = 'app.bsky.feed.like';

type FeedView = RefOf<'app.bsky.feed.defs#generatorView'>;

export const updateFeedLike = async (qc: QueryClient, uid: DID, feed: Shadow<FeedView>) => {
	const likeUri = feed.viewer?.like;

	const agent = await multiagent.connect(uid);

	if (!likeUri) {
		const record: Records[typeof likeRecordType] = {
			createdAt: getCurrentDate(),
			subject: {
				uri: feed.uri,
				cid: feed.cid,
			},
		};

		const response = await agent.rpc.call('com.atproto.repo.createRecord', {
			data: {
				repo: uid,
				collection: likeRecordType,
				record: record,
			},
		});

		feedShadow.update([qc, uid, feed.uri], {
			likeCount: (feed.likeCount ?? 0) + 1,
			likeUri: response.data.uri,
		});
	} else {
		await agent.rpc.call('com.atproto.repo.deleteRecord', {
			data: {
				repo: uid,
				collection: likeRecordType,
				rkey: getRecordId(likeUri),
			},
		});

		feedShadow.update([qc, uid, feed.uri], {
			likeCount: (feed.likeCount ?? 1) - 1,
			likeUri: undefined,
		});
	}
};
