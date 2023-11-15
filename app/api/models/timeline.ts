import type { DID, RefOf } from '../atp-schema.ts';

import { type SignalizedPost, mergePost } from '../stores/posts.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type TimelineItem = RefOf<'app.bsky.feed.defs#feedViewPost'>;
type ReplyRef = RefOf<'app.bsky.feed.defs#replyRef'>;

// EnsuredTimelineItem
export interface EnsuredReplyRef {
	root: Post;
	parent: Post;
}

export const ensureReplyRef = (reply: ReplyRef | undefined): EnsuredReplyRef | undefined => {
	if (reply) {
		const root = reply.root;
		const parent = reply.parent;

		if (root.$type === 'app.bsky.feed.defs#postView' && parent.$type === 'app.bsky.feed.defs#postView') {
			return { root, parent };
		}
	}
};

export interface EnsuredTimelineItem {
	post: Post;
	reply?: EnsuredReplyRef;
	reason: TimelineItem['reason'];
}

export const ensureTimelineItem = (item: TimelineItem): EnsuredTimelineItem => {
	return {
		post: item.post,
		reply: ensureReplyRef(item.reply),
		reason: item.reason,
	};
};

// SignalizedTimelineItem
export interface SignalizedTimelineItem {
	post: SignalizedPost;
	reply?: {
		root: SignalizedPost;
		parent: SignalizedPost;
	};
	reason: TimelineItem['reason'];
}

export const mergeSignalizedTimelineItem = (
	uid: DID,
	item: EnsuredTimelineItem,
	key?: number,
): SignalizedTimelineItem => {
	const reply = item.reply;

	return {
		post: mergePost(uid, item.post, key),
		reply: reply && {
			root: mergePost(uid, reply.root, key),
			parent: mergePost(uid, reply.parent, key),
		},
		reason: item.reason,
	};
};

// TimelineSlice
export interface TimelineSlice {
	items: SignalizedTimelineItem[];
}

export type SliceFilter = (slice: TimelineSlice) => boolean | TimelineSlice[];
export type PostFilter = (item: EnsuredTimelineItem) => boolean;

const isNextInThread = (slice: TimelineSlice, item: EnsuredTimelineItem) => {
	const items = slice.items;
	const last = items[items.length - 1];

	const reply = item.reply;

	return !!reply && last.post.cid.peek() == reply.parent.cid;
};

const isFirstInThread = (slice: TimelineSlice, item: EnsuredTimelineItem) => {
	const items = slice.items;
	const first = items[0];

	const reply = first.reply;

	return !!reply && reply.parent.cid.peek() === item.post.cid;
};

const isArray = Array.isArray;

export const createTimelineSlices = (
	uid: DID,
	arr: TimelineItem[],
	filterSlice?: SliceFilter,
	filterPost?: PostFilter,
): TimelineSlice[] => {
	const key = Date.now();

	let slices: TimelineSlice[] = [];
	let jlen = 0;

	// arrange the posts into connected slices
	loop: for (let i = arr.length - 1; i >= 0; i--) {
		const item = ensureTimelineItem(arr[i]);

		if (filterPost && !filterPost(item)) {
			continue;
		}

		// find a slice that matches,
		const signalized = mergeSignalizedTimelineItem(uid, item, key);

		// if we find a matching slice and it's currently not in front, then bump
		// it to the front. this is so that new reply don't get buried away because
		// there's multiple posts separating it and the parent post.
		for (let j = 0; j < jlen; j++) {
			const slice = slices[j];

			if (isFirstInThread(slice, item)) {
				slice.items.unshift(signalized);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			} else if (isNextInThread(slice, item)) {
				slice.items.push(signalized);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			}
		}

		slices.unshift({ items: [signalized] });
		jlen++;
	}

	if (filterSlice && jlen > 0) {
		const unfiltered = slices;
		slices = [];

		for (let j = 0; j < jlen; j++) {
			const slice = unfiltered[j];
			const result = filterSlice(slice);

			if (result) {
				if (isArray(result)) {
					for (let k = 0, klen = result.length; k < klen; k++) {
						const slice = result[k];
						slices.push(slice);
					}
				} else {
					slices.push(slice);
				}
			}
		}
	}

	return slices;
};

export const createUnjoinedSlices = (
	uid: DID,
	arr: TimelineItem[],
	filterPost?: PostFilter,
): TimelineSlice[] => {
	const key = Date.now();
	const slices: TimelineSlice[] = [];

	for (let idx = 0, len = arr.length; idx < len; idx++) {
		const item = ensureTimelineItem(arr[idx]);

		if (filterPost && !filterPost(item)) {
			continue;
		}

		const signalized = mergeSignalizedTimelineItem(uid, item, key);

		slices.push({ items: [signalized] });
	}

	return slices;
};

// export interface PostUiItem {
// 	uid: DID;
// 	post: SignalizedPost;
// 	parent?: SignalizedPost;
// 	reason?: SignalizedTimelineItem['reason'];
// 	prev?: boolean;
// 	next?: boolean;
// }
