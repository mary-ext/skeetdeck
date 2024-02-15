import type { RefOf } from '~/api/atp-schema';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	finalizeModeration,
} from '~/api/moderation/action';

import { sequal } from '~/utils/dequal';

import type { SharedPreferencesObject } from '../components/SharedPreferences';

type BasicProfile = RefOf<'app.bsky.actor.defs#profileViewBasic'>;

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<BasicProfile, ModerationResult>();

export const getBasicProfileModDecision = (profile: BasicProfile, opts: SharedPreferencesObject) => {
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
