import { EQUALS_DEQUAL } from '~/utils/dequal.ts';
import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, RefOf } from '../atp-schema.ts';
import { markRaw } from '../utils/misc.ts';

type Profile = RefOf<'app.bsky.actor.defs#profileView'>;
type ProfileBasic = RefOf<'app.bsky.actor.defs#profileViewBasic'>;
type ProfileDetailed = RefOf<'app.bsky.actor.defs#profileViewDetailed'>;

export const profiles: Record<string, WeakRef<SignalizedProfile>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = profiles[id];

	if (!ref || !ref.deref()) {
		delete profiles[id];
	}
});

/** @see BskyProfile */
export interface SignalizedProfile {
	_key?: number;
	did: ProfileDetailed['did'];
	handle: Signal<ProfileDetailed['handle']>;
	displayName: Signal<ProfileDetailed['displayName']>;
	description: Signal<ProfileDetailed['description']>;
	avatar: Signal<ProfileDetailed['avatar']>;
	banner: Signal<ProfileDetailed['banner']>;
	followersCount: Signal<NonNullable<ProfileDetailed['followersCount']>>;
	followsCount: Signal<NonNullable<ProfileDetailed['followsCount']>>;
	postsCount: Signal<NonNullable<ProfileDetailed['postsCount']>>;
	labels: Signal<ProfileDetailed['labels']>;
	viewer: {
		muted: Signal<NonNullable<ProfileDetailed['viewer']>['muted']>;
		// @todo: perhaps change this to reference SignalizedList?
		mutedByList: Signal<NonNullable<ProfileDetailed['viewer']>['mutedByList']>;
		blockedBy: Signal<NonNullable<ProfileDetailed['viewer']>['blockedBy']>;
		blocking: Signal<NonNullable<ProfileDetailed['viewer']>['blocking']>;
		// @todo: perhaps change this to reference SignalizedList?
		blockingByList: Signal<NonNullable<ProfileDetailed['viewer']>['blockingByList']>;
		following: Signal<NonNullable<ProfileDetailed['viewer']>['following']>;
		followedBy: Signal<NonNullable<ProfileDetailed['viewer']>['followedBy']>;
	};
}

const createSignalizedProfile = (
	_uid: DID,
	profile: Profile | ProfileBasic | ProfileDetailed,
	key?: number,
): SignalizedProfile => {
	const isProfile = 'description' in profile;
	const isDetailed = 'postsCount' in profile;

	return markRaw({
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(profile.displayName),
		description: signal(isProfile ? profile.description : ''),
		avatar: signal(profile.avatar),
		banner: signal(isDetailed ? profile.banner : ''),
		followersCount: signal((isDetailed && profile.followersCount) || 0),
		followsCount: signal((isDetailed && profile.followsCount) || 0),
		postsCount: signal((isDetailed && profile.postsCount) || 0),
		labels: signal(profile.labels, EQUALS_DEQUAL),
		viewer: {
			muted: signal(profile.viewer?.muted),
			mutedByList: signal(profile.viewer?.mutedByList),
			blockedBy: signal(profile.viewer?.blockedBy),
			blocking: signal(profile.viewer?.blocking),
			blockingByList: signal(profile.viewer?.blockingByList),
			following: signal(profile.viewer?.following),
			followedBy: signal(profile.viewer?.followedBy),
		},
	});
};

export const createProfileId = (uid: DID, actor: DID) => {
	return uid + '|' + actor;
};

export const getCachedProfile = (uid: DID, actor: DID) => {
	const id = createProfileId(uid, actor);
	const ref = profiles[id];

	return ref && ref.deref();
};

export const mergeProfile = (uid: DID, profile: Profile | ProfileBasic | ProfileDetailed, key?: number) => {
	let id = createProfileId(uid, profile.did);

	let ref: WeakRef<SignalizedProfile> | undefined = profiles[id];
	let val: SignalizedProfile;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedProfile(uid, profile, key);
		profiles[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = profile.displayName;
		val.avatar.value = profile.avatar;
		val.labels.value = profile.labels;

		val.viewer.muted.value = profile.viewer?.muted;
		val.viewer.mutedByList.value = profile.viewer?.mutedByList;
		val.viewer.blockedBy.value = profile.viewer?.blockedBy;
		val.viewer.blocking.value = profile.viewer?.blocking;
		val.viewer.blockingByList.value = profile.viewer?.blockingByList;
		val.viewer.following.value = profile.viewer?.following;
		val.viewer.followedBy.value = profile.viewer?.followedBy;

		if ('description' in profile) {
			val.description.value = profile.description;
		}

		if ('postsCount' in profile) {
			val.banner.value = profile.banner;
			val.followersCount.value = profile.followersCount ?? 0;
			val.followsCount.value = profile.followsCount ?? 0;
			val.postsCount.value = profile.postsCount ?? 0;
		}
	}

	return val;
};
