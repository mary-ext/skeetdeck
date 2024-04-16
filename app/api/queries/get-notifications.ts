import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { AppBskyNotificationListNotifications, At } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { wrapInfiniteQuery } from '../utils/query';

import { type NotificationSlice, createNotificationSlices } from '../models/notifications';

type Notification = AppBskyNotificationListNotifications.Notification;

export const FILTER_FOLLOWS = 1 << 0;
export const FILTER_LIKES = 1 << 1;
export const FILTER_MENTIONS = 1 << 2;
export const FILTER_QUOTES = 1 << 3;
export const FILTER_REPLIES = 1 << 4;
export const FILTER_REPOSTS = 1 << 5;
export const FILTER_ALL =
	FILTER_FOLLOWS | FILTER_LIKES | FILTER_MENTIONS | FILTER_QUOTES | FILTER_REPLIES | FILTER_REPOSTS;

export const REASONS: Record<string, number> = {
	follow: FILTER_FOLLOWS,
	like: FILTER_LIKES,
	mention: FILTER_MENTIONS,
	quote: FILTER_QUOTES,
	reply: FILTER_REPLIES,
	repost: FILTER_REPOSTS,
};

// export interface NotificationsPageCursor {
// 	key: string | null | undefined;
// 	remaining: NotificationSlice[];
// }

export interface NotificationsPage {
	cursor: string | null | undefined;
	slices: NotificationSlice[];
	date: string | undefined;
	cid: string | undefined;
}

// 2 is the minimum, 1st attempt will always fail because it's empty.
const MAX_ATTEMPTS = 3;

export const getNotificationsKey = (uid: At.DID, limit: number = 25) => {
	return ['getNotifications', uid, limit] as const;
};
export const getNotifications = wrapInfiniteQuery(
	async (ctx: QC<ReturnType<typeof getNotificationsKey>, string | null | undefined>) => {
		const [, uid, limit] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		let attempts = 0;

		let cursor: string | null | undefined = ctx.pageParam;
		let items: Notification[] = [];

		let slices: NotificationSlice[];
		let cid: string | undefined;
		let date: string | undefined;

		while (true) {
			slices = createNotificationSlices(items);

			// Give up after several attempts, or if we've reached the requested limit
			if (++attempts >= MAX_ATTEMPTS || cursor === null || slices.length > limit) {
				break;
			}

			const response = await agent.rpc.get('app.bsky.notification.listNotifications', {
				signal: ctx.signal,
				params: {
					cursor: cursor,
					limit: limit,
				},
			});

			const data = response.data;
			const notifications = data.notifications;

			cursor = data.cursor || null;
			items = items.concat(notifications);
			cid ||= notifications.length > 0 ? notifications[0].cid : undefined;
			date ||= notifications.length > 0 ? notifications[0].indexedAt : undefined;
		}

		const page: NotificationsPage = {
			cursor: cursor,
			slices: slices,
			cid: cid,
			date: date,
		};

		return page;
	},
);

export interface NotificationsLatestResult {
	cid: string | undefined;
	read: boolean;
}

export const getNotificationsLatestKey = (uid: At.DID) => {
	return ['getNotificationsLatest', uid] as const;
};
export const getNotificationsLatest = async (ctx: QC<ReturnType<typeof getNotificationsLatestKey>>) => {
	const [, uid] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.notification.listNotifications', {
		signal: ctx.signal,
		params: {
			limit: 1,
		},
	});

	const notifications = response.data.notifications;

	if (notifications.length > 0) {
		const notif = notifications[0];

		return { cid: notif.cid, read: notif.isRead };
	}

	return { cid: undefined, read: true };
};
