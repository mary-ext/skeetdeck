import { For, Match, Switch, createEffect, createMemo } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import {
	type TimelineLatestResult,
	type TimelinePage,
	type TimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import Post from '../items/Post.tsx';
import CircularProgress from '../CircularProgress.tsx';
import { useSharedPreferences } from '../SharedPreferences.tsx';
import { VirtualContainer } from '../VirtualContainer.tsx';

import button from '../../primitives/button.ts';

export interface TimelineListProps {
	uid: DID;
	params: TimelineParams;
}

const isTimelineStale = (
	timelineData: InfiniteData<TimelinePage> | undefined,
	latestData: TimelineLatestResult | undefined,
) => {
	return latestData ? latestData.cid !== timelineData?.pages[0].cid : false;
};

const TimelineList = (props: TimelineListProps) => {
	const sharedPrefs = useSharedPreferences();

	const queryClient = useQueryClient();

	const timeline = createInfiniteQuery(() => ({
		queryKey: getTimelineKey(props.uid, props.params),
		queryFn: getTimeline,
		getNextPageParam: (last) => last.cursor,
		initialPageParam: undefined,
		meta: {
			timelineOpts: sharedPrefs,
		},
	}));

	const latest = createQuery(() => {
		const $timeline = timeline.data;

		return {
			queryKey: getTimelineLatestKey(props.uid, props.params),
			queryFn: getTimelineLatest,
			staleTime: 10_000,
			enabled: $timeline !== undefined,
			refetchOnWindowFocus: (query) => {
				return !isTimelineStale($timeline, query.state.data);
			},
			refetchInterval: (query) => {
				if (!isTimelineStale($timeline, query.state.data)) {
					return 30_000;
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
							const $timeline = timeline.data;

							if ($timeline && $timeline.pages.length > 1) {
								queryClient.setQueryData<InfiniteData<unknown>>(
									getTimelineKey(props.uid, props.params),
									(data) => {
										if (data) {
											return {
												pages: data.pages.slice(0, 1),
												pageParams: data.pageParams.slice(0, 1),
											};
										}

										return data;
									},
								);
							}

							timeline.refetch();
						}}
						class="grid h-13 shrink-0 place-items-center border-b border-divider text-sm text-accent hover:bg-hinted"
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
						<div class="flex flex-col items-center px-4 py-6 text-sm text-muted-fg">
							<p>Something went wrong</p>
							<p class="mb-4">{'' + err()}</p>

							<button
								onClick={() => {
									if (timeline.isRefetchError || timeline.isLoadingError) {
										timeline.refetch();
									} else {
										timeline.fetchNextPage();
									}
								}}
								class={/* @once */ button({ variant: 'primary' })}
							>
								Reload
							</button>
						</div>
					)}
				</Match>

				<Match when={timeline.hasNextPage}>
					<button
						disabled={timeline.isRefetching}
						onClick={() => timeline.fetchNextPage()}
						class="grid h-13 shrink-0 place-items-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
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
