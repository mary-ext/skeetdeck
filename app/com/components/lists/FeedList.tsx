import { type JSX, For } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getProfileFeeds, getProfileFeedsKey } from '~/api/queries/get-profile-feeds.ts';

import { loadMoreBtn } from '../../primitives/interactive.ts';

import GenericErrorView from '../views/GenericErrorView.tsx';
import CircularProgress from '../CircularProgress.tsx';
import { VirtualContainer } from '../VirtualContainer.tsx';

import FeedItem from '../items/FeedItem.tsx';

export interface FeedListProps {
	uid: DID;
	actor: string;
}

const FeedList = (props: FeedListProps) => {
	const feeds = createInfiniteQuery(() => {
		return {
			queryKey: getProfileFeedsKey(props.uid, props.actor),
			queryFn: getProfileFeeds,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return [
		<div>
			<For each={feeds.data?.pages.flatMap((page) => page.feeds)}>
				{(feed) => {
					return (
						<VirtualContainer estimateHeight={96}>
							<FeedItem feed={feed} />
						</VirtualContainer>
					);
				}}
			</For>
		</div>,

		() => {
			if (feeds.isFetching) {
				return (
					<div class="grid h-13 shrink-0 place-items-center">
						<CircularProgress />
					</div>
				);
			}

			if (feeds.isError) {
				return (
					<GenericErrorView
						error={feeds.error}
						onRetry={() => {
							feeds.fetchNextPage();
						}}
					/>
				);
			}

			if (feeds.hasNextPage) {
				return (
					<button onClick={() => feeds.fetchNextPage()} class={loadMoreBtn}>
						Show more feeds
					</button>
				);
			}

			return (
				<div class="grid h-13 shrink-0 place-items-center">
					<p class="text-sm text-muted-fg">End of list</p>
				</div>
			);
		},
	] as unknown as JSX.Element;
};

export default FeedList;
