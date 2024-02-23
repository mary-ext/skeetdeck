import type { AppBskyActorDefs } from '~/api/atp-schema';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	finalizeModeration,
} from '~/api/moderation/action';

import { sequal } from '~/utils/dequal';

import type { SharedPreferencesObject } from '../components/SharedPreferences';

type ProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<ProfileView, ModerationResult>();

export const getBasicProfileModDecision = (profile: ProfileView, opts: SharedPreferencesObject) => {
	const key = [opts.rev];

	let res = cached.get(profile);
	if (!res || !sequal(res.c, key)) {
		const { moderation } = opts;

		const accu: ModerationCause[] = [];

		decideLabelModeration(accu, profile.labels, profile.did, moderation);

		cached.set(profile, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
