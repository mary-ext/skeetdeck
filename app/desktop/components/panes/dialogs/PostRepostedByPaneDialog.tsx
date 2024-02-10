import { createInfiniteQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema';

import { getPostReposts, getPostRepostsKey } from '~/api/queries/get-post-reposts';

import ProfileList from '~/com/components/lists/ProfileList';
import { LINK_PROFILE, useLinking } from '~/com/components/Link';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface PostRepostedByDialogProps {
	/** Expected to be static */
	actor: DID;
	/** Expected to be static */
	rkey: string;
}

const PostRepostedByPaneDialog = (props: PostRepostedByDialogProps) => {
	const { actor, rkey } = props;

	const linking = useLinking();
	const { pane } = usePaneContext();

	const uri = `at://${actor}/app.bsky.feed.post/${rkey}`;

	const reposts = createInfiniteQuery(() => {
		return {
			queryKey: getPostRepostsKey(pane.uid, uri),
			queryFn: getPostReposts,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader title={`Reposts`} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ProfileList
					profiles={reposts.data?.pages.flatMap((page) => page.profiles)}
					fetching={reposts.isFetching}
					error={reposts.error}
					hasMore={reposts.hasNextPage}
					onRetry={() => reposts.fetchNextPage()}
					onLoadMore={() => reposts.fetchNextPage()}
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

export default PostRepostedByPaneDialog;
