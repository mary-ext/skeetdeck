import type { DID, RefOf, UnionOf } from '../atp-schema.ts';

import { mergePost, type SignalizedPost } from '../stores/posts.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type Thread = RefOf<'app.bsky.feed.defs#threadViewPost'>;

type UnwrapArray<T> = T extends (infer V)[] ? V : never;
type ThreadReply = UnwrapArray<Thread['replies']>;

export interface SignalizedThread {
	$type: 'thread';
	post: SignalizedPost;
	parent:
		| SignalizedThread
		| UnionOf<'app.bsky.feed.defs#notFoundPost'>
		| UnionOf<'app.bsky.feed.defs#blockedPost'>
		| undefined;
	replies: (SignalizedThread | UnionOf<'app.bsky.feed.defs#blockedPost'>)[] | undefined;
}

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

	return (a: ThreadReply, b: ThreadReply) => {
		const aType = a.$type;
		const bType = b.$type;

		if (a.$type === TypeThreadView && bType === TypeThreadView) {
			const aPost = a.post;
			const bPost = b.post;

			const aScore = (scores[aPost.cid] ??= calculatePostScore(uid, aPost, parent));
			const bScore = (scores[bPost.cid] ??= calculatePostScore(uid, bPost, parent));

			return bScore - aScore;
		}

		return TypeSortOrder[bType] - TypeSortOrder[aType];
	};
};

export const createSignalizedThread = (uid: DID, thread: Thread): SignalizedThread => {
	const { post, parent, replies } = thread;

	let p: SignalizedThread['parent'];
	let r: SignalizedThread['replies'];

	// - #blockedPost should only be used if the user is blocking said author,
	//   otherwise it should be replaced with #notFoundPost (or filtered out)
	// - Sorting is completely done here at the moment.

	if (parent) {
		const type = parent.$type;

		if (type === TypeThreadView) {
			p = createSignalizedThread(uid, parent);
		} else if (type === TypeBlocked) {
			p = parent.author.viewer!.blocking
				? parent
				: { $type: 'app.bsky.feed.defs#notFoundPost', uri: parent.uri, notFound: true };
		} else {
			p = parent;
		}
	}

	if (replies) {
		replies.sort(collateReplies(uid, post));

		for (let i = 0, il = replies.length; i < il; i++) {
			const reply = replies[i];
			const type = reply.$type;

			let child: UnwrapArray<SignalizedThread['replies']> | undefined;

			if (type === TypeThreadView) {
				child = createSignalizedThread(uid, reply);
			} else if (type === TypeBlocked && reply.author.viewer!.blocking) {
				child = reply;
			}

			if (child) {
				if (r) {
					r.push(child);
				} else {
					r = [child];
				}
			}
		}
	}

	return {
		$type: 'thread',
		post: mergePost(uid, post),
		parent: p,
		replies: r,
	};
};

export const createPlaceholderThread = (
	post: SignalizedPost,
	parent: SignalizedThread | undefined,
): SignalizedThread => {
	return {
		$type: 'thread',
		parent: parent,
		post: post,
		replies: undefined,
	};
};
