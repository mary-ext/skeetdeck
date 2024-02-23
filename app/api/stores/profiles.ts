import { EQUALS_DEQUAL } from '~/utils/dequal';
import { type Signal, signal } from '~/utils/signals';

import type { AppBskyActorDefs, At } from '../atp-schema';

type Profile = AppBskyActorDefs.ProfileView;
type ProfileBasic = AppBskyActorDefs.ProfileViewBasic;
type ProfileDetailed = AppBskyActorDefs.ProfileViewDetailed;

export const profiles: Record<string, WeakRef<SignalizedProfile>> = {};

const gc = new FinalizationRegistry<string>((id) => {
	const ref = profiles[id];

	if (!ref || !ref.deref()) {
		delete profiles[id];
	}
});

export class SignalizedProfile {
	readonly uid: At.DID;
	_key?: number;

	readonly did: ProfileDetailed['did'];
	readonly handle: Signal<ProfileDetailed['handle']>;
	readonly displayName: Signal<ProfileDetailed['displayName']>;
	readonly description: Signal<ProfileDetailed['description']>;
	readonly avatar: Signal<ProfileDetailed['avatar']>;
	readonly banner: Signal<ProfileDetailed['banner']>;
	readonly followersCount: Signal<NonNullable<ProfileDetailed['followersCount']>>;
	readonly followsCount: Signal<NonNullable<ProfileDetailed['followsCount']>>;
	readonly postsCount: Signal<NonNullable<ProfileDetailed['postsCount']>>;
	readonly labels: Signal<NonNullable<ProfileDetailed['labels']>>;

	readonly viewer: {
		readonly muted: Signal<NonNullable<ProfileDetailed['viewer']>['muted']>;
		// @todo: perhaps change this to reference SignalizedList?
		readonly mutedByList: Signal<NonNullable<ProfileDetailed['viewer']>['mutedByList']>;
		readonly blockedBy: Signal<NonNullable<ProfileDetailed['viewer']>['blockedBy']>;
		readonly blocking: Signal<NonNullable<ProfileDetailed['viewer']>['blocking']>;
		// @todo: perhaps change this to reference SignalizedList?
		readonly blockingByList: Signal<NonNullable<ProfileDetailed['viewer']>['blockingByList']>;
		readonly following: Signal<NonNullable<ProfileDetailed['viewer']>['following']>;
		readonly followedBy: Signal<NonNullable<ProfileDetailed['viewer']>['followedBy']>;
	};

	constructor(uid: At.DID, profile: Profile | ProfileBasic | ProfileDetailed, key?: number) {
		const isProfile = 'description' in profile;
		const isDetailed = 'postsCount' in profile;

		this.uid = uid;
		this._key = key;

		this.did = profile.did;
		this.handle = signal(profile.handle);
		this.displayName = signal(profile.displayName);
		this.description = signal(isProfile ? profile.description : '');
		this.avatar = signal(profile.avatar);
		this.banner = signal(isDetailed ? profile.banner : '');
		this.followersCount = signal((isDetailed && profile.followersCount) || 0);
		this.followsCount = signal((isDetailed && profile.followsCount) || 0);
		this.postsCount = signal((isDetailed && profile.postsCount) || 0);
		this.labels = signal(profile.labels || [], EQUALS_DEQUAL);

		this.viewer = {
			muted: signal(profile.viewer?.muted),
			mutedByList: signal(profile.viewer?.mutedByList),
			blockedBy: signal(profile.viewer?.blockedBy),
			blocking: signal(profile.viewer?.blocking),
			blockingByList: signal(profile.viewer?.blockingByList),
			following: signal(profile.viewer?.following),
			followedBy: signal(profile.viewer?.followedBy),
		};
	}
}

export const createProfileId = (uid: At.DID, actor: At.DID) => {
	return uid + '|' + actor;
};

export const getCachedProfile = (uid: At.DID, actor: At.DID) => {
	const id = createProfileId(uid, actor);
	const ref = profiles[id];

	return ref && ref.deref();
};

export const mergeProfile = (
	uid: At.DID,
	profile: Profile | ProfileBasic | ProfileDetailed,
	key?: number,
) => {
	let id = createProfileId(uid, profile.did);

	let ref: WeakRef<SignalizedProfile> | undefined = profiles[id];
	let val: SignalizedProfile;

	if (!ref || !(val = ref.deref()!)) {
		val = new SignalizedProfile(uid, profile, key);
		profiles[id] = new WeakRef(val);

		gc.register(val, id);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = profile.displayName;
		val.avatar.value = profile.avatar;
		val.labels.value = profile.labels || [];

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
