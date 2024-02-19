import type { DID, RefOf, UnionOf } from '../atp-schema';

import { mergePost, SignalizedPost } from '../stores/posts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type Thread = UnionOf<'app.bsky.feed.defs#threadViewPost'>;

type NotFoundPost = UnionOf<'app.bsky.feed.defs#notFoundPost'>;
type BlockedPost = UnionOf<'app.bsky.feed.defs#blockedPost'>;

type UnwrapArray<T> = T extends (infer V)[] ? V : never;
type ThreadReply = UnwrapArray<Thread['replies']>;

const TypeThreadView = 'app.bsky.feed.defs#threadViewPost';
const TypeBlocked = 'app.bsky.feed.defs#blockedPost';
const TypeNotFound = 'app.bsky.feed.defs#notFoundPost';

const TypeSortOrder = {
	[TypeNotFound]: 0,
	[TypeBlocked]: 1,
	[TypeThreadView]: 2,
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
	} else if (parent.author.did === child.author.did) {
		return PostSortOrder.SAME_AUTHOR;
	} else if (child.author.did === uid) {
		return PostSortOrder.YOU;
	} else if (child.author.viewer!.following) {
		return PostSortOrder.FOLLOWING;
	} else {
		return PostSortOrder.NORMAL;
	}
};

const collateReplies = (uid: DID, parent: Post) => {
	const scores: Record<string, number> = {};
	const dates: Record<string, number> = {};

	return (a: ThreadReply, b: ThreadReply) => {
		const aType = a.$type;
		const bType = b.$type;

		if (a.$type === TypeThreadView && bType === TypeThreadView) {
			const aPost = a.post;
			const bPost = b.post;

			const aScore = (scores[aPost.cid] ??= calculatePostScore(uid, aPost, parent));
			const bScore = (scores[bPost.cid] ??= calculatePostScore(uid, bPost, parent));

			if (aScore === bScore) {
				const aDate = aPost.indexedAt;
				const bDate = bPost.indexedAt;

				const aTime = (dates[aDate] ??= new Date(aDate).getTime());
				const bTime = (dates[bDate] ??= new Date(bDate).getTime());

				return bTime - aTime;
			}

			return bScore - aScore;
		}

		return TypeSortOrder[bType] - TypeSortOrder[aType];
	};
};

const filterReplies = (x: UnwrapArray<Thread['replies']>): x is Thread | BlockedPost => {
	return x.$type === TypeThreadView || (x.$type === TypeBlocked && !!x.author.viewer!.blocking);
};

export interface BaseThreadItem {
	parentUri: string;
	depth: number;
	// hasNextSibling: boolean;
}

export interface PostThreadItem extends BaseThreadItem {
	type: 'post';
	item: SignalizedPost;
	isEnd: boolean;
}

export interface BlockedThreadItem extends BaseThreadItem {
	type: 'block';
	item: BlockedPost;
}

export interface OverflowThreadItem extends BaseThreadItem {
	type: 'overflow';
}

export type ThreadItem = PostThreadItem | BlockedThreadItem | OverflowThreadItem;

export interface AncestorOverflowItem {
	$type: 'overflow';
	uri: string;
}

export interface ThreadData {
	post: SignalizedPost;
	ancestors: (SignalizedPost | NotFoundPost | BlockedPost | AncestorOverflowItem)[];
	descendants: ThreadItem[];
	maxHeight: number;
	maxDepth: number;
}

export const createThreadData = (uid: DID, data: Thread, maxDepth: number, maxHeight: number): ThreadData => {
	/** This needs to be reversed! */
	const ancestors: ThreadData['ancestors'] = [];
	let descendants: ThreadData['descendants'];

	// Walk upwards to get the ancestors
	{
		let parent = data.parent;
		let height = 0;
		while (parent) {
			if (++height > maxHeight) {
				break;
			}

			if (parent.$type !== TypeThreadView) {
				ancestors.push(parent);
				break;
			}

			ancestors.push(mergePost(uid, parent.post));
			parent = parent.parent;
		}

		if (height >= maxHeight) {
			const last = ancestors[height - 1];

			if (last instanceof SignalizedPost && last.record.value.reply) {
				ancestors.push({ $type: 'overflow', uri: last.uri });
			}
		}
	}

	// Walk downwards to get the flattened descendants
	{
		const walk = (parent: Post, replies: Thread['replies'] | undefined, depth: number): ThreadItem[] => {
			if (depth >= maxDepth) {
				if (parent.replyCount && parent.replyCount > 0) {
					return [
						{
							type: 'overflow',
							parentUri: parent.uri,
							depth: depth,
							// hasNextSibling: false,
						},
					];
				}

				return [];
			}

			if (replies) {
				const array: ThreadItem[] = [];
				const items = replies.filter(filterReplies).sort(collateReplies(uid, parent));

				for (let i = 0, il = items.length; i < il; i++) {
					const reply = items[i];
					const type = reply.$type;

					if (type === TypeThreadView) {
						const post = reply.post;
						const children = walk(post, reply.replies, depth + 1);

						array.push({
							type: 'post',
							item: mergePost(uid, post),
							parentUri: parent.uri,
							depth: depth,
							// hasNextSibling: i !== il - 1,
							isEnd: children.length === 0,
						});

						push(array, children);
					} else if (type === TypeBlocked) {
						array.push({
							type: 'block',
							item: reply,
							parentUri: parent.uri,
							depth: depth,
							// hasNextSibling: i !== il - 1,
						});
					}
				}

				return array;
			}

			return [];
		};

		descendants = walk(data.post, data.replies, 0);
	}

	return {
		post: mergePost(uid, data.post),

		ancestors: ancestors.reverse(),
		descendants: descendants,

		maxHeight: maxHeight,
		maxDepth: maxDepth,
	};
};

const push = <T>(target: T[], source: T[]) => {
	for (let i = 0, il = source.length; i < il; i++) {
		const item = source[i];
		target.push(item);
	}
};
