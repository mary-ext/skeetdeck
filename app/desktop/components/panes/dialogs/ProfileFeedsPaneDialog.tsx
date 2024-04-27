import { createInfiniteQuery, createQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';
import { getProfileFeeds, getProfileFeedsKey } from '~/api/queries/get-profile-feeds';

import List from '~/com/components/List';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import FeedItem from '~/com/components/items/FeedItem';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface ProfileFeedsPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
}

const ProfileFeedsPaneDialog = (props: ProfileFeedsPaneDialogProps) => {
	const { actor } = props;

	const { pane } = usePaneContext();

	const profile = createQuery(() => {
		// @todo: shouldn't be necessary to put initialData for this one I think?
		return {
			queryKey: getProfileKey(pane.uid, actor),
			queryFn: getProfile,
		};
	});

	const feeds = createInfiniteQuery(() => {
		return {
			queryKey: getProfileFeedsKey(pane.uid, props.actor),
			queryFn: getProfileFeeds,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={`Feeds`}
				subtitle={(() => {
					const $subject = profile.data;

					if ($subject) {
						return `@${$subject.handle.value}`;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<List
					data={feeds.data?.pages.flatMap((page) => page.feeds)}
					error={feeds.error}
					render={(feed) => {
						return (
							<VirtualContainer estimateHeight={96}>
								<FeedItem feed={feed} />
							</VirtualContainer>
						);
					}}
					hasNextPage={feeds.hasNextPage}
					isFetchingNextPage={feeds.isFetching}
					onEndReached={() => feeds.fetchNextPage()}
				/>
			</div>
		</PaneDialog>
	);
};

export default ProfileFeedsPaneDialog;
