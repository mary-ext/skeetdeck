import { For, Match, Switch, createEffect } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import {
	type NotificationsLatestResult,
	type NotificationsPage,
	getNotifications,
	getNotificationsKey,
	getNotificationsLatest,
	getNotificationsLatestKey,
} from '~/api/queries/get-notifications.ts';

import CircularProgress from '../CircularProgress.tsx';

import { Button } from '../../primitives/button.ts';

import Notification from '../items/Notification.tsx';

export interface NotificationListProps {
	uid: DID;
	mask?: number;
}

const isNotificationsStale = (
	timelineData: InfiniteData<NotificationsPage> | undefined,
	latestData: NotificationsLatestResult | undefined,
) => {
	return latestData ? latestData.cid !== timelineData?.pages[0].cid : false;
};

const NotificationList = (props: NotificationListProps) => {
	const queryClient = useQueryClient();

	const notifications = createInfiniteQuery(() => {
		return {
			queryKey: getNotificationsKey(props.uid, props.mask),
			queryFn: getNotifications,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const latest = createQuery(() => {
		const $notifications = notifications.data;

		return {
			queryKey: getNotificationsLatestKey(props.uid),
			queryFn: getNotificationsLatest,
			staleTime: 10_000,
			enabled: $notifications !== undefined,
			refetchOnWindowFocus: (query) => {
				return !isNotificationsStale($notifications, query.state.data);
			},
			refetchInterval: (query) => {
				if (!isNotificationsStale($notifications, query.state.data)) {
					return 30_000;
				}

				return false;
			},
		};
	});

	createEffect((prev: typeof notifications.data | 0) => {
		const next = notifications.data;

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				queryClient.setQueryData<NotificationsLatestResult>(getNotificationsLatestKey(props.uid), (prev) => {
					return {
						...prev!,
						cid: pages[0].cid,
					};
				});
			}
		}

		return next;
	}, 0 as const);

	return (
		<>
			<Switch>
				<Match when={notifications.isRefetching}>
					<div class="grid h-13 shrink-0 place-items-center border-b border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={isNotificationsStale(notifications.data, latest.data)}>
					<button
						onClick={() => {
							const $notifications = notifications.data;

							if ($notifications && $notifications.pages.length > 1) {
								queryClient.setQueryData<InfiniteData<unknown>>(getNotificationsKey(props.uid), (data) => {
									if (data) {
										return {
											pages: data.pages.slice(0, 1),
											pageParams: data.pageParams.slice(0, 1),
										};
									}

									return data;
								});
							}

							notifications.refetch();
						}}
						class="grid h-13 shrink-0 place-items-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new notifications
					</button>
				</Match>
			</Switch>

			<div>
				<For each={notifications.data?.pages.flatMap((page) => page.slices)}>
					{(slice) => {
						return <Notification uid={props.uid} data={slice} />;
					}}
				</For>
			</div>

			<Switch>
				<Match when={notifications.isFetchingNextPage || notifications.isLoading}>
					<div class="grid h-13 shrink-0 place-items-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={notifications.error}>
					{(err) => (
						<div class="flex flex-col items-center px-4 py-6 text-sm text-muted-fg">
							<p>Something went wrong</p>
							<p class="mb-4">{'' + err()}</p>

							<button
								onClick={() => {
									if (notifications.isRefetchError || notifications.isLoadingError) {
										notifications.refetch();
									} else {
										notifications.fetchNextPage();
									}
								}}
								class={/* @once */ Button({ variant: 'primary' })}
							>
								Reload
							</button>
						</div>
					)}
				</Match>

				<Match when={notifications.hasNextPage}>
					<button
						disabled={notifications.isRefetching}
						onClick={() => notifications.fetchNextPage()}
						class="grid h-13 shrink-0 place-items-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more notifications
					</button>
				</Match>

				<Match when={notifications.data}>
					<div class="grid h-13 shrink-0 place-items-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default NotificationList;
