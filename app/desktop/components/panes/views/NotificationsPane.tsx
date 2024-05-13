import { createEffect, createSignal, lazy, type JSX } from 'solid-js';

import {
	createInfiniteQuery,
	createMutation,
	createQuery,
	useQueryClient,
	type InfiniteData,
} from '@mary/solid-query';

import { updateNotificationsSeen } from '~/api/mutations/update-notifications-seen';
import {
	REASONS,
	getNotifications,
	getNotificationsKey,
	getNotificationsLatest,
	getNotificationsLatestKey,
	type NotificationsLatestResult,
	type NotificationsPage,
} from '~/api/queries/get-notifications';
import { resetInfiniteData } from '~/api/utils/query';

import type { NotificationsPaneConfig } from '../../../globals/panes';

import List from '~/com/components/List';
import Notification from '~/com/components/items/Notification';
import CheckAllIcon from '~/com/icons/baseline-check-all';
import SettingsOutlinedIcon from '~/com/icons/outline-settings';
import { IconButton } from '~/com/primitives/icon-button';

import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import { usePaneContext } from '../PaneContext';

const GenericPaneSettings = lazy(() => import('../settings/GenericPaneSettings'));
const NotificationsPaneSettings = lazy(() => import('../settings/NotificationsPaneSettings'));

const isNotificationsStale = (
	listingData: InfiniteData<NotificationsPage> | undefined,
	latestData: NotificationsLatestResult | undefined,
) => {
	return listingData && latestData?.cid ? latestData.cid !== listingData.pages[0].cid : false;
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
			staleTime: 30_000,
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
		<Pane
			title="Notifications"
			actions={
				<>
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
						<SettingsOutlinedIcon />
					</button>
				</>
			}
		>
			<PaneBody>
				<List
					data={(() => {
						const mask = pane.mask;

						return notifications.data?.pages
							.flatMap((page) => page.slices)
							.filter((slice) => {
								const flag = REASONS[slice.type];
								return flag !== undefined && (flag & mask) === 0;
							});
					})()}
					error={notifications.error}
					render={(slice) => {
						return <Notification uid={pane.uid} data={slice} />;
					}}
					fallback={
						<div class="border-b border-divider p-4">
							<p class="text-center text-sm text-muted-fg">Nothing here but crickets...</p>
						</div>
					}
					manualScroll={pane.mask !== 0}
					hasNewData={isNotificationsStale(notifications.data, latest.data)}
					hasNextPage={notifications.hasNextPage}
					isFetchingNextPage={notifications.isFetchingNextPage || notifications.isLoading}
					isRefreshing={notifications.isRefetching}
					onEndReached={() => notifications.fetchNextPage()}
					onRefresh={() => {
						resetInfiniteData(queryClient, getNotificationsKey(pane.uid));
						notifications.refetch();
					}}
				/>
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
