import { For, Match, Switch, createEffect, createSignal } from 'solid-js';

import {
	type InfiniteData,
	createInfiniteQuery,
	createQuery,
	useQueryClient,
	createMutation,
} from '@pkg/solid-query';

import { resetInfiniteData } from '~/api/utils/query.ts';

import { updateNotificationsSeen } from '~/api/mutations/update-notifications-seen.ts';
import {
	type NotificationsLatestResult,
	type NotificationsPage,
	REASONS,
	getNotifications,
	getNotificationsKey,
	getNotificationsLatest,
	getNotificationsLatestKey,
} from '~/api/queries/get-notifications.ts';

import type { NotificationsPaneConfig } from '../../../globals/panes.ts';

import Notification from '~/com/components/items/Notification.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { loadMoreBtn, loadNewBtn } from '~/com/primitives/interactive.ts';

import CheckAllIcon from '~/com/icons/baseline-check-all.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';
import NotificationsPaneSettings from '../settings/NotificationsPaneSettings.tsx';

const isNotificationsStale = (
	timelineData: InfiniteData<NotificationsPage> | undefined,
	latestData: NotificationsLatestResult | undefined,
) => {
	return latestData ? latestData.cid !== timelineData?.pages[0].cid : false;
};

const NotificationsPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<NotificationsPaneConfig>();

	const queryClient = useQueryClient();

	const notifications = createInfiniteQuery(() => {
		return {
			queryKey: getNotificationsKey(pane.uid),
			queryFn: getNotifications,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const latest = createQuery(() => {
		const $notifications = notifications.data;

		return {
			queryKey: getNotificationsLatestKey(pane.uid),
			queryFn: getNotificationsLatest,
			staleTime: 10_000,
			enabled: $notifications !== undefined,
			refetchOnWindowFocus: (query) => {
				return !isNotificationsStale($notifications, query.state.data);
			},
			refetchInterval: (query) => {
				if (!isNotificationsStale($notifications, query.state.data)) {
					// 30 seconds, or 3 minutes
					return !document.hidden ? 30_000 : 3 * 60_000;
				}

				return false;
			},
		};
	});

	const refetchNotifications = () => {
		resetInfiniteData(queryClient, getNotificationsKey(pane.uid));
		notifications.refetch();
	};

	const read = createMutation(() => {
		return {
			mutationKey: ['updateNotificationsSeen', pane.uid],
			mutationFn: async () => {
				const date = notifications.data?.pages[0].date;

				if (!date) {
					return;
				}

				await updateNotificationsSeen(pane.uid, new Date(date));
			},
			onSuccess: () => {
				queryClient.setQueryData<NotificationsLatestResult>(getNotificationsLatestKey(pane.uid), (data) => {
					if (data) {
						return { ...data, read: true };
					}

					return data;
				});

				refetchNotifications();
			},
		};
	});

	createEffect((prev: typeof notifications.data | 0) => {
		const next = notifications.data;

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				queryClient.setQueryData<NotificationsLatestResult>(getNotificationsLatestKey(pane.uid), (prev) => {
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
			<Pane>
				<PaneHeader title={pane.title || 'Notifications'}>
					<button
						title="Mark notifications as read"
						onClick={() => read.mutate()}
						disabled={
							read.isPending ||
							notifications.isLoading ||
							notifications.isRefetching ||
							!notifications.data?.pages[0].date
						}
						class={/* @once */ IconButton({ color: 'muted' })}
					>
						<CheckAllIcon />
					</button>

					<button
						title="Column settings"
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsIcon class="place-self-center" />
					</button>
				</PaneHeader>

				<PaneBody>
					<Switch>
						<Match when={read.isPending || notifications.isRefetching}>
							<div class="grid h-13 shrink-0 place-items-center border-b border-divider">
								<CircularProgress />
							</div>
						</Match>

						<Match when={!notifications.isLoading && isNotificationsStale(notifications.data, latest.data)}>
							<button onClick={refetchNotifications} class={loadNewBtn}>
								Show new notifications
							</button>
						</Match>
					</Switch>

					<div>
						<For
							each={(() => {
								const mask = pane.mask;

								return notifications.data?.pages
									.flatMap((page) => page.slices)
									.filter((slice) => {
										const flag = REASONS[slice.type];
										return flag !== undefined && (flag & mask) !== 0;
									});
							})()}
							fallback={(() => {
								if (!notifications.isLoading) {
									return (
										<div class="border-b border-divider p-4">
											<p class="text-center text-sm text-muted-fg">Nothing here but crickets...</p>
										</div>
									);
								}
							})()}
						>
							{(slice) => {
								return <Notification uid={pane.uid} data={slice} />;
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
								class={loadMoreBtn}
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
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside onClose={() => setIsSettingsOpen(false)}>
					<NotificationsPaneSettings />
					<GenericPaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default NotificationsPane;
