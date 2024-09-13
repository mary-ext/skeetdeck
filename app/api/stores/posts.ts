import { EQUALS_DEQUAL } from '~/utils/dequal';
import { type Signal, signal } from '~/utils/signals';

import type { AppBskyFeedDefs, AppBskyFeedPost, At } from '../atp-schema';

import { type SignalizedProfile, mergeProfile } from './profiles';

type Post = AppBskyFeedDefs.PostView;
type PostRecord = AppBskyFeedPost.Record;
type PostViewer = AppBskyFeedDefs.ViewerState;

export const posts: Record<string, WeakRef<SignalizedPost>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = posts[id];

	if (!ref || !ref.deref()) {
		delete posts[id];
	}
});

export class SignalizedPost {
	readonly uid: At.DID;
	_key?: number;

	readonly uri: Post['uri'];
	readonly cid: Signal<Post['cid']>;
	readonly author: SignalizedProfile;
	readonly record: Signal<PostRecord>;
	readonly embed: Signal<Post['embed']>;
	readonly replyCount: Signal<NonNullable<Post['replyCount']>>;
	readonly repostCount: Signal<NonNullable<Post['repostCount']>>;
	readonly likeCount: Signal<NonNullable<Post['likeCount']>>;
	readonly labels: Signal<Post['labels']>;

	readonly threadgate: Signal<Post['threadgate']>;
	readonly viewer: {
		readonly like: Signal<PostViewer['like']>;
		readonly repost: Signal<PostViewer['repost']>;
		readonly replyDisabled: Signal<PostViewer['replyDisabled']>;
		readonly threadMuted: Signal<PostViewer['threadMuted']>;
	};

	$truncated?: boolean;

	constructor(uid: At.DID, post: Post, key?: number) {
		this.uid = uid;
		this._key = key;

		this.uri = post.uri;
		this.cid = signal(post.cid);
		this.author = mergeProfile(uid, post.author, key);
		this.record = signal(post.record as PostRecord, EQUALS_DEQUAL);
		this.embed = signal(post.embed, EQUALS_DEQUAL);
		this.replyCount = signal(post.replyCount ?? 0);
		this.repostCount = signal(post.repostCount ?? 0);
		this.likeCount = signal(post.likeCount ?? 0);
		this.labels = signal(post.labels, EQUALS_DEQUAL);

		this.threadgate = signal(post.threadgate, EQUALS_DEQUAL);
		this.viewer = {
			like: signal(post.viewer?.like),
			repost: signal(post.viewer?.repost),
			replyDisabled: signal(post.viewer?.replyDisabled),
			threadMuted: signal(post.viewer?.threadMuted),
		};
	}
}

export const createPostId = (uid: At.DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedPost = (uid: At.DID, uri: string) => {
	const id = createPostId(uid, uri);
	const ref = posts[id];

	return ref?.deref();
};

export const removeCachedPost = (uid: At.DID, uri: string) => {
	const id = createPostId(uid, uri);

	const ref = posts[id];
	const val = ref?.deref();

	if (val) {
		gc.unregister(val);
		delete posts[id];
	}
};

export const mergePost = (uid: At.DID, post: Post, key?: number) => {
	let id = createPostId(uid, post.uri);

	let ref: WeakRef<SignalizedPost> | undefined = posts[id];
	let val: SignalizedPost;

	if (!ref || !(val = ref.deref()!)) {
		val = new SignalizedPost(uid, post, key);
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

		val.threadgate.value = post.threadgate;
		val.viewer.like.value = post.viewer?.like;
		val.viewer.repost.value = post.viewer?.repost;
		val.viewer.replyDisabled.value = post.viewer?.replyDisabled;
		val.viewer.threadMuted.value = post.viewer?.threadMuted;
	}

	return val;
};
