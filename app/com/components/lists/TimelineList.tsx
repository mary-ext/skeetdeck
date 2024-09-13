import { createMemo, createRenderEffect, untrack } from 'solid-js';

import type { At } from '@atcute/client/lexicons';
import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@mary/solid-query';

import {
	type TimelineLatestResult,
	type TimelinePage,
	type TimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline';
import { resetInfiniteData } from '~/api/utils/query';

import { getTimelineQueryMeta } from '../../globals/shared';
import List from '../List';
import { VirtualContainer } from '../VirtualContainer';
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

	const timelineDid = createMemo(() => {
		const params = props.params;
		return params.type === 'profile' ? params.actor : undefined;
	});

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

	createRenderEffect((prev: typeof timeline.data | 0) => {
		const next = timeline.data;

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				queryClient.setQueryData(
					getTimelineLatestKey(props.uid, props.params),
					{ cid: pages[0].cid },
					{ updatedAt: untrack(() => timeline.dataUpdatedAt) },
				);
			}
		}

		return next;
	}, 0 as const);

	return (
		<List
			data={timeline.data?.pages.flatMap((page) => page.slices)}
			error={timeline.error}
			render={(slice) => {
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
							timelineDid={timelineDid()}
						/>
					</VirtualContainer>
				));
			}}
			hasNewData={isTimelineStale(timeline.data, latest.data)}
			hasNextPage={timeline.hasNextPage}
			isFetchingNextPage={timeline.isFetchingNextPage || timeline.isLoading}
			isRefreshing={timeline.isRefetching}
			onEndReached={() => timeline.fetchNextPage()}
			onRefresh={() => {
				resetInfiniteData(queryClient, getTimelineKey(props.uid, props.params));
				timeline.refetch();
			}}
		/>
	);
};

export default TimelineList;
