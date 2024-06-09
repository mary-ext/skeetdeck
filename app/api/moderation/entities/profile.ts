import type { SignalizedProfile } from '../../stores/profiles';

import {
	TargetAccount,
	TargetProfile,
	decideLabelModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	type ModerationCause,
	type ModerationOptions,
} from '..';

export const moderateProfile = (profile: SignalizedProfile, opts: ModerationOptions) => {
	const viewer = profile.viewer;

	const labels = profile.labels.value;
	const isMuted = viewer.muted.value;

	const accu: ModerationCause[] = [];
	const did = profile.did;

	const profileLabels = labels.filter((label) => label.uri.endsWith('/app.bsky.actor.profile/self'));
	const accountLabels = labels.filter((label) => !label.uri.endsWith('/app.bsky.actor.profile/self'));

	decideLabelModeration(accu, TargetProfile, profileLabels, did, opts);
	decideLabelModeration(accu, TargetAccount, accountLabels, did, opts);
	decideMutedPermanentModeration(accu, isMuted);
	decideMutedTemporaryModeration(accu, did, opts);

	return accu;
};
