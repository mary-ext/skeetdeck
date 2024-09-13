import type { At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { multiagent } from '../globals/agent';
import { type NotificationSlice, createNotificationSlices } from '../models/notifications';
import { wrapInfiniteQuery } from '../utils/query';

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

export interface NotificationsPage {
	cursor: string | undefined;
	slices: NotificationSlice[];
	date: string | undefined;
	cid: string | undefined;
}

export const getNotificationsKey = (uid: At.DID, limit: number = 30) => {
	return ['getNotifications', uid, limit] as const;
};
export const getNotifications = wrapInfiniteQuery(
	async (ctx: QC<ReturnType<typeof getNotificationsKey>, string | undefined>) => {
		const [, uid, limit] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.notification.listNotifications', {
			signal: ctx.signal,
			params: {
				cursor: ctx.pageParam,
				limit: limit,
			},
		});

		const data = response.data;
		const notifications = data.notifications;

		const first = notifications.length > 0 ? notifications[0] : undefined;

		const page: NotificationsPage = {
			cursor: data.cursor,
			slices: createNotificationSlices(notifications),
			cid: first?.cid,
			date: first?.indexedAt,
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
