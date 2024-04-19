import { For, Match, Switch, createEffect } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import { getQueryErrorInfo, resetInfiniteData } from '~/api/utils/query';

import {
	type TimelineLatestResult,
	type TimelinePage,
	type TimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline';

import { getTimelineQueryMeta } from '../../globals/shared';

import CircularProgress from '../CircularProgress';
import { VirtualContainer } from '../VirtualContainer';

import GenericErrorView from '../views/GenericErrorView';

import { loadMoreBtn, loadNewBtn } from '../../primitives/interactive';

import Post from '../items/Post';

export interface TimelineListProps {
	uid: At.DID;
	params: TimelineParams;
}

const isTimelineStale = (
	timelineData: InfiniteData<TimelinePage> | undefined,
	latestData: TimelineLatestResult | undefined,
) => {
	return latestData?.cid && timelineData ? latestData.cid !== timelineData.pages[0].cid : false;
};

const TimelineList = (props: TimelineListProps) => {
	const queryClient = useQueryClient();

	const timeline = createInfiniteQuery(() => ({
		queryKey: getTimelineKey(props.uid, props.params),
		queryFn: getTimeline,
		staleTime: Infinity,
		getNextPageParam: (last) => last.cursor,
		initialPageParam: undefined,
		meta: {
			...getTimelineQueryMeta(),
		},
	}));

	const latest = createQuery(() => {
		const $timeline = timeline.data;

		return {
			queryKey: getTimelineLatestKey(props.uid, props.params),
			queryFn: getTimelineLatest,
			staleTime: 30_000,
			enabled: $timeline !== undefined,
			refetchOnWindowFocus: (query) => {
				return !isTimelineStale($timeline, query.state.data);
			},
			refetchInterval: (query) => {
				if (!isTimelineStale($timeline, query.state.data)) {
					// 1 minute, or 5 minutes
					return !document.hidden ? 60_000 : 5 * 60_000;
				}

				return false;
			},
		};
	});

	createEffect((prev: typeof timeline.data | 0) => {
		const next = timeline.data;

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				queryClient.setQueryData(getTimelineLatestKey(props.uid, props.params), {
					cid: pages[0].cid,
				});
			}
		}

		return next;
	}, 0 as const);

	return (
		<>
			<Switch>
				<Match when={timeline.isRefetching}>
					<div class="grid h-13 shrink-0 place-items-center border-b border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={isTimelineStale(timeline.data, latest.data)}>
					<button
						onClick={() => {
							resetInfiniteData(queryClient, getTimelineKey(props.uid, props.params));
							timeline.refetch();
						}}
						class={loadNewBtn}
					>
						Show new posts
					</button>
				</Match>
			</Switch>

			<div>
				<For each={timeline.data?.pages.flatMap((page) => page.slices)}>
					{(slice) => {
						const items = slice.items;
						const len = items.length;

						return items.map((item, idx) => (
							<VirtualContainer estimateHeight={98.8}>
								<Post
									interactive
									post={/* @once */ item.post}
									parent={/* @once */ item.reply?.parent}
									reason={/* @once */ item.reason}
									prev={idx !== 0}
									next={idx !== len - 1}
								/>
							</VirtualContainer>
						));
					}}
				</For>
			</div>

			<Switch>
				<Match when={timeline.isFetchingNextPage || timeline.isLoading}>
					<div class="grid h-13 shrink-0 place-items-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={timeline.error}>
					{(err) => (
						<GenericErrorView
							padded
							error={err()}
							onRetry={() => {
								const info = getQueryErrorInfo(err());

								if (timeline.isLoadingError || (timeline.isRefetchError && info?.pageParam === undefined)) {
									timeline.refetch();
								} else {
									timeline.fetchNextPage();
								}
							}}
						/>
					)}
				</Match>

				<Match when={timeline.hasNextPage}>
					<button
						disabled={timeline.isRefetching}
						onClick={() => timeline.fetchNextPage()}
						class={loadMoreBtn}
					>
						Show more posts
					</button>
				</Match>

				<Match when={timeline.data}>
					<div class="grid h-13 shrink-0 place-items-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default TimelineList;
