import { createInfiniteQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getPostReposts, getPostRepostsKey } from '~/api/queries/get-post-reposts.ts';

import ProfileList from '~/com/components/lists/ProfileList.tsx';
import { LinkingType, useLinking } from '~/com/components/Link.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

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

	const likes = createInfiniteQuery(() => {
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
					profiles={likes.data?.pages.flatMap((page) => page.profiles)}
					fetching={likes.isFetching}
					error={likes.error}
					hasMore={likes.hasNextPage}
					onRetry={() => {
						if (likes.isRefetchError || likes.isLoadingError) {
							likes.refetch();
						} else {
							likes.fetchNextPage();
						}
					}}
					onLoadMore={() => likes.fetchNextPage()}
					onItemClick={(profile, alt) => {
						if (alt) {
							return;
						}

						linking.navigate({ type: LinkingType.PROFILE, actor: profile.did });
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default PostRepostedByPaneDialog;