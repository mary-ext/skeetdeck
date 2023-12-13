import { EQUALS_DEQUAL } from '~/utils/dequal.ts';
import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, Records, RefOf } from '../atp-schema.ts';

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

export class SignalizedPost {
	readonly uid: DID;
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
		readonly like: Signal<NonNullable<Post['viewer']>['like']>;
		readonly repost: Signal<NonNullable<Post['viewer']>['repost']>;
		readonly replyDisabled: Signal<NonNullable<Post['viewer']>['replyDisabled']>;
	};

	$truncated?: boolean;

	constructor(uid: DID, post: Post, key?: number) {
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
		};
	}
}

export const createPostId = (uid: DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedPost = (uid: DID, uri: string) => {
	const id = createPostId(uid, uri);
	const ref = posts[id];

	return ref?.deref();
};

export const removeCachedPost = (uid: DID, uri: string) => {
	const id = createPostId(uid, uri);

	const ref = posts[id];
	const val = ref?.deref();

	if (val) {
		gc.unregister(val);
		delete posts[id];
	}
};

export const mergePost = (uid: DID, post: Post, key?: number) => {
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
	}

	return val;
};
