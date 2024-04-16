import { createInfiniteQuery } from '@externdefs/solid-query';

import type { At } from '~/api/atp-schema';

import { getLikes, getLikesKey } from '~/api/queries/get-likes';

import { getModerationOptions } from '~/com/globals/shared';

import ProfileList from '~/com/components/lists/ProfileList';
import { LINK_PROFILE, useLinking } from '~/com/components/Link';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface PostLikedByDialogProps {
	/** Expected to be static */
	actor: At.DID;
	/** Expected to be static */
	rkey: string;
}

const PostLikedByPaneDialog = (props: PostLikedByDialogProps) => {
	const { actor, rkey } = props;

	const linking = useLinking();
	const { pane } = usePaneContext();

	const uri = `at://${actor}/app.bsky.feed.post/${rkey}`;

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
			<PaneDialogHeader title={`Likes`} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ProfileList
					profiles={likes.data?.pages.flatMap((page) => page.profiles)}
					fetching={likes.isFetching}
					error={likes.error}
					hasMore={likes.hasNextPage}
					onRetry={() => likes.fetchNextPage()}
					onLoadMore={() => likes.fetchNextPage()}
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

export default PostLikedByPaneDialog;
