import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, RefOf } from '../atp-schema.ts';
import { markRaw } from '../utils/misc.ts';
import { type SignalizedProfile, mergeProfile } from './profiles.ts';

type Feed = RefOf<'app.bsky.feed.defs#generatorView'>;

export const feeds: Record<string, WeakRef<SignalizedFeed>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = feeds[id];

	if (!ref || !ref.deref()) {
		delete feeds[id];
	}
});

/** @see BskyFeedGenerator */
export interface SignalizedFeed {
	_key?: number;
	uri: string;
	cid: Signal<Feed['cid']>;
	did: Signal<Feed['did']>;
	creator: SignalizedProfile;
	name: Signal<Feed['displayName']>;
	description: Signal<Feed['description']>;
	descriptionFacets: Signal<Feed['descriptionFacets']>;
	avatar: Signal<Feed['avatar']>;
	likeCount: Signal<NonNullable<Feed['likeCount']>>;
	viewer: {
		like: Signal<NonNullable<Feed['viewer']>['like']>;
	};
}

const createSignalizedFeed = (uid: DID, feed: Feed, key?: number): SignalizedFeed => {
	return markRaw({
		_key: key,
		uid: uid,

		uri: feed.uri,
		cid: signal(feed.cid),
		did: signal(feed.did),
		creator: mergeProfile(uid, feed.creator, key),
		name: signal(feed.displayName),
		description: signal(feed.description),
		descriptionFacets: signal(feed.descriptionFacets),
		avatar: signal(feed.avatar),
		likeCount: signal(feed.likeCount ?? 0),
		viewer: {
			like: signal(feed.viewer?.like),
		},
	});
};

export const createFeedId = (uid: DID, uri: string) => {
	return uid + '|' + uri;
};

export const getCachedFeed = (uid: DID, uri: string) => {
	const id = createFeedId(uid, uri);
	const ref = feeds[id];

	return ref && ref.deref();
};

export const mergeFeed = (uid: DID, feed: Feed, key?: number) => {
	let id = createFeedId(uid, feed.uri);

	let ref: WeakRef<SignalizedFeed> | undefined = feeds[id];
	let val: SignalizedFeed;

	if (!ref || !(val = ref.deref()!)) {
		gc.register((val = createSignalizedFeed(uid, feed, key)), id);
		feeds[id] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = feed.cid;
		val.did.value = feed.did;

		val.creator = mergeProfile(uid, feed.creator, key);

		val.name.value = feed.displayName;
		val.description.value = feed.description;
		val.descriptionFacets.value = feed.descriptionFacets;
		val.avatar.value = feed.avatar;

		val.likeCount.value = feed.likeCount ?? 0;

		val.viewer.like.value = feed.viewer?.like;
	}

	return val;
};
