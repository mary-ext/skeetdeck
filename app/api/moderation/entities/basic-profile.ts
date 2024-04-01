import { sequal } from '~/utils/dequal';

import type { AppBskyActorDefs } from '../../atp-schema';

import {
	type ModerationCause,
	type ModerationOptions,
	TargetProfile,
	decideLabelModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
} from '..';
import { cache } from './_shared';

type ProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

export const decideBasicProfile = (view: ProfileView, opts: ModerationOptions) => {
	const key: unknown[] = [opts];

	let res = cache.get(view);
	if (!res || !sequal(res.c, key)) {
		cache.set(view, (res = { r: decideBasicProfileUncached(view, opts), c: key }));
	}

	return res.r;
};

export const decideBasicProfileUncached = (view: ProfileView, opts: ModerationOptions) => {
	const accu: ModerationCause[] = [];
	const did = view.did;

	decideLabelModeration(accu, TargetProfile, view.labels, did, opts);
	decideMutedPermanentModeration(accu, !!view.viewer?.muted);
	decideMutedTemporaryModeration(accu, did, opts);

	return accu;
};
