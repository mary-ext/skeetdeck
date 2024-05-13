import { signal, type Signal } from '~/utils/signals';

import type { AppBskyFeedDefs, At } from '../atp-schema';
import { mergeProfile, type SignalizedProfile } from './profiles';

type Feed = AppBskyFeedDefs.GeneratorView;

export const feeds: Record<string, WeakRef<SignalizedFeed>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = feeds[id];

	if (!ref || !ref.deref()) {
		delete feeds[id];
	}
});

export class SignalizedFeed {
	readonly uid: At.DID;
	_key?: number;

	readonly uri: string;
	readonly cid: Signal<Feed['cid']>;
	readonly did: Signal<Feed['did']>;
	readonly creator: SignalizedProfile;
	readonly name: Signal<Feed['displayName']>;
	readonly description: Signal<Feed['description']>;
	readonly descriptionFacets: Signal<Feed['descriptionFacets']>;
	readonly avatar: Signal<Feed['avatar']>;
	readonly likeCount: Signal<NonNullable<Feed['likeCount']>>;

	readonly viewer: {
		readonly like: Signal<NonNullable<Feed['viewer']>['like']>;
	};

	constructor(uid: At.DID, feed: Feed, key?: number) {
		this.uid = uid;
		this._key = key;

		this.uri = feed.uri;
		this.cid = signal(feed.cid);
		this.did = signal(feed.did);
		this.creator = mergeProfile(uid, feed.creator, key);
		this.name = signal(feed.displayName);
		this.description = signal(feed.description);
		this.descriptionFacets = signal(feed.descriptionFacets);
		this.avatar = signal(feed.avatar);
		this.likeCount = signal(feed.likeCount ?? 0);

		this.viewer = {
			like: signal(feed.viewer?.like),
		};
	}
}

export const createFeedId = (uid: At.DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedFeed = (uid: At.DID, uri: string) => {
	const id = createFeedId(uid, uri);
	const ref = feeds[id];

	return ref && ref.deref();
};

export const mergeFeed = (uid: At.DID, feed: Feed, key?: number) => {
	let id = createFeedId(uid, feed.uri);

	let ref: WeakRef<SignalizedFeed> | undefined = feeds[id];
	let val: SignalizedFeed;

	if (!ref || !(val = ref.deref()!)) {
		val = new SignalizedFeed(uid, feed, key);
		feeds[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = feed.cid;
		val.did.value = feed.did;

		mergeProfile(uid, feed.creator, key);

		val.name.value = feed.displayName;
		val.description.value = feed.description;
		val.descriptionFacets.value = feed.descriptionFacets;
		val.avatar.value = feed.avatar;

		val.likeCount.value = feed.likeCount ?? 0;

		val.viewer.like.value = feed.viewer?.like;
	}

	return val;
};
