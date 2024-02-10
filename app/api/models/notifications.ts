import type { Records, RefOf } from '../atp-schema';

import { getCollectionId } from '../utils/misc';

type Notification = RefOf<'app.bsky.notification.listNotifications#notification'>;

type FollowRecord = Records['app.bsky.graph.follow'];
type LikeRecord = Records['app.bsky.feed.like'];
type PostRecord = Records['app.bsky.feed.post'];
type RepostRecord = Records['app.bsky.feed.repost'];

export type FollowNotification = Notification & { reason: 'follow'; record: FollowRecord };
export type LikeNotification = Notification & { reason: 'like'; record: LikeRecord };
export type MentionNotification = Notification & { reason: 'mention'; record: PostRecord };
export type QuoteNotification = Notification & { reason: 'quote'; record: PostRecord };
export type ReplyNotification = Notification & { reason: 'reply'; record: PostRecord };
export type RepostNotification = Notification & { reason: 'repost'; record: RepostRecord };

export interface FollowNotificationSlice {
	type: 'follow';
	read: boolean;
	date: number;
	items: FollowNotification[];
}

export interface LikeNotificationSlice {
	type: 'like';
	read: boolean;
	key: string;
	date: number;
	items: LikeNotification[];
}

export interface MentionNotificationSlice {
	type: 'mention';
	read: boolean;
	date: number;
	item: MentionNotification;
}

export interface QuoteNotificationSlice {
	type: 'quote';
	read: boolean;
	date: number;
	item: QuoteNotification;
}

export interface ReplyNotificationSlice {
	type: 'reply';
	read: boolean;
	date: number;
	item: ReplyNotification;
}

export interface RepostNotificationSlice {
	type: 'repost';
	read: boolean;
	key: string;
	date: number;
	items: RepostNotification[];
}

export type NotificationSlice =
	| FollowNotificationSlice
	| LikeNotificationSlice
	| MentionNotificationSlice
	| QuoteNotificationSlice
	| ReplyNotificationSlice
	| RepostNotificationSlice;

// 6 hours
const MAX_MERGE_TIME = 6 * 60 * 60 * 1_000;

export const createNotificationSlices = (notifications: Notification[]) => {
	const len = notifications.length;

	const slices: NotificationSlice[] = [];
	let slen = 0;

	loop: for (let i = len - 1; i >= 0; i--) {
		const item = notifications[i];
		const reason = item.reason;

		const date = new Date(item.indexedAt).getTime();

		if (reason === 'follow') {
			const _item = item as FollowNotification;

			for (let j = 0; j < slen; j++) {
				const slice = slices[j] as FollowNotificationSlice;

				if (slice.type !== reason) {
					continue;
				}

				if (date - slice.date <= MAX_MERGE_TIME) {
					slice.items.unshift(_item);

					if (!item.isRead) {
						slice.read = false;
					}

					if (j !== 0) {
						slices.splice(j, 1);
						slices.unshift(slice);
					}

					continue loop;
				}
			}

			slen++;

			slices.unshift({
				// @ts-expect-error
				type: reason,
				read: item.isRead,
				date: date,
				// @ts-expect-error
				items: [item],
			});
		} else if (reason === 'like' || reason === 'repost') {
			const key = item.reasonSubject!;
			const collection = getCollectionId(key);

			// skip if they're not related to posts.
			if (collection !== 'app.bsky.feed.post') {
				continue;
			}

			for (let j = 0; j < slen; j++) {
				const slice = slices[j] as LikeNotificationSlice | RepostNotificationSlice;

				if (slice.type !== reason || slice.key !== key) {
					continue;
				}

				if (date - slice.date <= MAX_MERGE_TIME) {
					// @ts-expect-error this won't mix up, as we already filter by type
					slice.items.unshift(item);

					if (!item.isRead) {
						slice.read = false;
					}

					if (j !== 0) {
						slices.splice(j, 1);
						slices.unshift(slice);
					}

					continue loop;
				}
			}

			slen++;

			slices.unshift({
				// @ts-expect-error
				type: reason,
				read: item.isRead,
				key: key,
				date: date,
				// @ts-expect-error
				items: [item],
			});
		} else if (reason === 'reply' || reason === 'quote' || reason === 'mention') {
			slen++;

			slices.unshift({
				// @ts-expect-error
				type: reason,
				read: item.isRead,
				date: date,
				// @ts-expect-error
				item: item,
			});
		}
	}

	return slices;
};
