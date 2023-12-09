import { Stack } from '~/utils/stack.ts';

import type { DID, RefOf, UnionOf } from '../atp-schema.ts';

import { type SignalizedPost, mergePost } from '../stores/posts.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type Thread = RefOf<'app.bsky.feed.defs#threadViewPost'>;

type BlockedPost = UnionOf<'app.bsky.feed.defs#blockedPost'>;
type NotFoundPost = UnionOf<'app.bsky.feed.defs#notFoundPost'>;

const TypePost = 'app.bsky.feed.defs#threadViewPost';
const TypeBlocked = 'app.bsky.feed.defs#blockedPost';
const TypeNotFound = 'app.bsky.feed.defs#notFoundPost';

const TypeSortOrder = {
	[TypeNotFound]: 0,
	[TypeBlocked]: 1,
	[TypePost]: 2,
};

const enum PostSortOrder {
	MUTED = 0,
	NORMAL = 1,
	FOLLOWING = 2,
	YOU = 3,
	SAME_AUTHOR = 4,
}

const calculatePostScore = (uid: DID, child: Post, parent: Post) => {
	if (child.author.viewer!.muted) {
		return PostSortOrder.MUTED;
	}

	if (parent.author.did === child.author.did) {
		return PostSortOrder.SAME_AUTHOR;
	}

	if (child.author.did === uid) {
		return PostSortOrder.YOU;
	}

	if (child.author.viewer!.following) {
		return PostSortOrder.FOLLOWING;
	}

	return PostSortOrder.NORMAL;
};

export interface ThreadSlice {
	items: [...items: SignalizedPost[], last: SignalizedPost | NotFoundPost | BlockedPost];
}

export interface ThreadPage {
	post: SignalizedPost;
	ancestors: [first: SignalizedPost | NotFoundPost | BlockedPost, ...items: SignalizedPost[]];
	descendants: ThreadSlice[];

	depth: number;
	height: number;
}

type ThreadStackNode = [thread: Thread, slice: ThreadSlice | undefined];

export const createThreadPage = (uid: DID, data: Thread, depth: number, height: number): ThreadPage => {
	const ancestors: (SignalizedPost | NotFoundPost | BlockedPost)[] = [];
	const descendants: ThreadSlice[] = [];

	const stack = new Stack<ThreadStackNode>();
	const key = Date.now();

	let parent = data.parent;
	let node: ThreadStackNode | undefined;

	stack.push([data, undefined]);

	while (parent) {
		if (parent.$type !== TypePost) {
			ancestors.push(parent);
			break;
		}

		ancestors.push(mergePost(uid, parent.post, key));
		parent = parent.parent;
	}

	while ((node = stack.pop())) {
		const thread = node[0];
		const slice = node[1];

		if (!thread.replies) {
			continue;
		}

		const post = thread.post;
		const scores: Record<string, number> = {};

		// const replies = thread.replies;
		const replies = thread.replies.slice().sort((a, b) => {
			const aType = a.$type;
			const bType = b.$type;

			if (aType === TypePost && bType === TypePost) {
				const aPost = a.post;
				const bPost = b.post;

				const aScore = (scores[aPost.cid] ??= calculatePostScore(uid, aPost, post));
				const bScore = (scores[bPost.cid] ??= calculatePostScore(uid, bPost, post));

				return bScore - aScore;
			}

			return TypeSortOrder[bType] - TypeSortOrder[aType];
		});

		if (!slice) {
			// we're in the root thread
			for (let idx = 0, len = replies.length; idx < len; idx++) {
				const reply = replies[idx];
				const type = reply.$type;

				if (type === TypePost) {
					const next: ThreadSlice = { items: [mergePost(uid, reply.post, key)] };

					stack.push([reply, next]);
					descendants.push(next);
				} else if (type !== TypeBlocked || reply.author.viewer?.blocking) {
					descendants.push({ items: [reply] });
				}
			}
		} else if (replies.length > 0) {
			const reply = replies[0];
			const type = reply.$type;

			if (type === TypePost) {
				const post = mergePost(uid, reply.post, key);

				stack.push([reply, slice]);
				slice.items.push(post);
			} else if (type !== TypeBlocked || reply.author.viewer?.blocking) {
				slice.items.push(reply);
			}
		}
	}

	return {
		post: mergePost(uid, data.post, key),
		ancestors: ancestors.reverse() as any,
		descendants: descendants,

		depth: depth,
		height: height,
	};
};
