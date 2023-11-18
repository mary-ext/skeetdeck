import { EQUALS_DEQUAL } from '~/utils/dequal.ts';
import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, Records, RefOf } from '../atp-schema.ts';
import { markRaw } from '../utils/misc.ts';

import { type SignalizedProfile, mergeProfile } from './profiles.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type PostRecord = Records['app.bsky.feed.post'];

export const posts: Record<string, WeakRef<SignalizedPost>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = posts[id];

	if (!ref || !ref.deref()) {
		delete posts[id];
	}
});

/** @see BskyPost */
export interface SignalizedPost {
	_key?: number;
	uri: Post['uri'];
	cid: Signal<Post['cid']>;
	author: SignalizedProfile;
	record: Signal<PostRecord>;
	embed: Signal<Post['embed']>;
	replyCount: Signal<NonNullable<Post['replyCount']>>;
	repostCount: Signal<NonNullable<Post['repostCount']>>;
	likeCount: Signal<NonNullable<Post['likeCount']>>;
	labels: Signal<Post['labels']>;
	viewer: {
		like: Signal<NonNullable<Post['viewer']>['like']>;
		repost: Signal<NonNullable<Post['viewer']>['repost']>;
	};

	$truncated?: boolean;
	$moderation?: unknown;
}

const createSignalizedPost = (uid: DID, post: Post, key?: number): SignalizedPost => {
	return markRaw({
		_key: key,
		uri: post.uri,
		cid: signal(post.cid),
		author: mergeProfile(uid, post.author, key),
		record: signal(post.record as PostRecord),
		embed: signal(post.embed, EQUALS_DEQUAL),
		replyCount: signal(post.replyCount ?? 0),
		repostCount: signal(post.repostCount ?? 0),
		likeCount: signal(post.likeCount ?? 0),
		labels: signal(post.labels, EQUALS_DEQUAL),
		viewer: {
			like: signal(post.viewer?.like),
			repost: signal(post.viewer?.repost),
		},
	});
};

export const createPostId = (uid: DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedPost = (uid: DID, uri: string) => {
	const id = createPostId(uid, uri);
	const ref = posts[id];

	return ref && ref.deref();
};

export const mergePost = (uid: DID, post: Post, key?: number) => {
	let id = createPostId(uid, post.uri);

	let ref: WeakRef<SignalizedPost> | undefined = posts[id];
	let val: SignalizedPost;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedPost(uid, post, key);
		posts[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = post.cid;
		mergeProfile(uid, post.author, key);

		// val.record.value = post.record as PostRecord;
		val.embed.value = post.embed;
		val.replyCount.value = post.replyCount ?? 0;
		val.repostCount.value = post.repostCount ?? 0;
		val.likeCount.value = post.likeCount ?? 0;
		val.labels.value = post.labels;

		val.viewer.like.value = post.viewer?.like;
		val.viewer.repost.value = post.viewer?.repost;
	}

	return val;
};
