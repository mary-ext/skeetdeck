import { type JSX, For, Match, Switch, createEffect, createSignal } from 'solid-js';

import {
	type InfiniteData,
	createInfiniteQuery,
	createQuery,
	useQueryClient,
	createMutation,
} from '@pkg/solid-query';

import { getQueryErrorInfo, resetInfiniteData } from '~/api/utils/query';

import { updateNotificationsSeen } from '~/api/mutations/update-notifications-seen';
import {
	type NotificationsLatestResult,
	type NotificationsPage,
	REASONS,
	getNotifications,
	getNotificationsKey,
	getNotificationsLatest,
	getNotificationsLatestKey,
} from '~/api/queries/get-notifications';

import type { NotificationsPaneConfig } from '../../../globals/panes';

import Notification from '~/com/components/items/Notification';
import GenericErrorView from '~/com/components/views/GenericErrorView';
import CircularProgress from '~/com/components/CircularProgress';

import { IconButton } from '~/com/primitives/icon-button';
import { loadMoreBtn, loadNewBtn } from '~/com/primitives/interactive';

import CheckAllIcon from '~/com/icons/baseline-check-all';
import SettingsIcon from '~/com/icons/baseline-settings';

import { usePaneContext } from '../PaneContext';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import PaneHeader from '../PaneHeader';

import GenericPaneSettings from '../settings/GenericPaneSettings';
import NotificationsPaneSettings from '../settings/NotificationsPaneSettings';

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

				// AppView v2 changed the unread logic slightly, it's no longer <=seenAt
				// but rather <seenAt, so we'll set the seenAt to +1
				const seen = new Date(date);
				seen.setMilliseconds(seen.getMilliseconds() + 1);

				await updateNotificationsSeen(pane.uid, seen);
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

	return [
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
							<GenericErrorView
								padded
								error={err()}
								onRetry={() => {
									const info = getQueryErrorInfo(err());

									if (
										notifications.isLoadingError ||
										(notifications.isRefetchError && info?.pageParam === undefined)
									) {
										notifications.refetch();
									} else {
										notifications.fetchNextPage();
									}
								}}
							/>
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
		</Pane>,

		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<NotificationsPaneSettings />
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default NotificationsPane;
