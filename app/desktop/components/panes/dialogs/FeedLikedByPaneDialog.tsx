import type { At } from '@atcute/client/lexicons';
import { createInfiniteQuery, createQuery } from '@mary/solid-query';

import { getFeedInfo, getFeedInfoKey, getInitialFeedInfo } from '~/api/queries/get-feed-info';
import { getLikes, getLikesKey } from '~/api/queries/get-likes';

import { getModerationOptions } from '~/com/globals/shared';

import { LINK_PROFILE, useLinking } from '~/com/components/Link';
import ProfileList from '~/com/components/lists/ProfileList';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface FeedLikedByPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const FeedLikedByPaneDialog = (props: FeedLikedByPaneDialogProps) => {
	const { actor, rkey } = props;

	const linking = useLinking();
	const { pane } = usePaneContext();

	const uri = `at://${actor}/app.bsky.feed.generator/${rkey}`;

	const feed = createQuery(() => {
		const key = getFeedInfoKey(pane.uid, uri);

		return {
			queryKey: key,
			queryFn: getFeedInfo,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialFeedInfo(key),
		};
	});

	const likes = createInfiniteQuery(() => {
		return {
			queryKey: getLikesKey(pane.uid, uri),
			queryFn: getLikes,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			meta: {
				moderation: getModerationOptions(),
			},
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={`Likes`}
				subtitle={(() => {
					const $feed = feed.data;

					if ($feed) {
						return $feed.name.value;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ProfileList
					query={likes}
					onItemClick={(profile, alt) => {
						if (alt) {
							return;
						}

						linking.navigate({ type: LINK_PROFILE, actor: profile.did });
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default FeedLikedByPaneDialog;
