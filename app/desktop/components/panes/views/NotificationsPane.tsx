import { For, Match, Switch, createEffect, createSignal } from 'solid-js';

import {
	type InfiniteData,
	createInfiniteQuery,
	createQuery,
	useQueryClient,
	createMutation,
} from '@pkg/solid-query';

import { updateNotificationsSeen } from '~/api/mutations/update-notifications-seen.ts';
import {
	type NotificationsLatestResult,
	type NotificationsPage,
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

import CheckAllIcon from '~/com/icons/baseline-check-all.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';

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
			queryKey: getNotificationsKey(pane.uid, pane.mask),
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
					return 30_000;
				}

				return false;
			},
		};
	});

	const refetchNotifications = () => {
		const $notifications = notifications.data;

		if ($notifications && $notifications.pages.length > 1) {
			queryClient.setQueryData<InfiniteData<unknown>>(getNotificationsKey(pane.uid), (data) => {
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
						disabled={read.isPending || notifications.isFetching || !notifications.data?.pages[0].date}
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

						<Match when={isNotificationsStale(notifications.data, latest.data)}>
							<button
								onClick={refetchNotifications}
								class="grid h-13 shrink-0 place-items-center border-b border-divider text-sm text-accent hover:bg-hinted"
							>
								Show new notifications
							</button>
						</Match>
					</Switch>

					<div>
						<For each={notifications.data?.pages.flatMap((page) => page.slices)}>
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
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside onClose={() => setIsSettingsOpen(false)}>
					<GenericPaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default NotificationsPane;
