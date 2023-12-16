import type { QueryClient } from '@pkg/solid-query';
import type { DID, RefOf } from '../atp-schema.ts';

import { createShadow } from './shadow.ts';

type FeedView = RefOf<'app.bsky.feed.defs#generatorView'>;

export interface FeedShadow {
	likeUri: string | undefined;
	likeCount: number;
}

export const feedShadow = createShadow(
	(feed: FeedView, shadow: Partial<FeedShadow>) => {
		return {
			...feed,
			likeCount: shadow.likeCount,
			viewer: {
				...feed.viewer,
				like: shadow.likeUri,
			},
		};
	},
	(queryClient: QueryClient, uid: DID, uri: string) => {
		const results: FeedView[] = [];

		// @todo: does listing responses need to be counted here as well?
		// the worst thing is that the like count is stale... but that's fine...
		{
			const standalone = queryClient.getQueryData<FeedView>(['getFeedInfo', uid, uri]);
			if (standalone) {
				results.push(standalone);
			}
		}

		return results;
	},
);
