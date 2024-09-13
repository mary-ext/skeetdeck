import {
	type ModerationCause,
	type ModerationOptions,
	TargetProfile,
	decideLabelModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
} from '..';
import type { AppBskyActorDefs } from '../../atp-schema';

type ProfileView =
	| AppBskyActorDefs.ProfileView
	| AppBskyActorDefs.ProfileViewBasic
	| AppBskyActorDefs.ProfileViewDetailed;

export const decideBasicProfile = (view: ProfileView, opts: ModerationOptions) => {
	const accu: ModerationCause[] = [];
	const did = view.did;

	decideLabelModeration(accu, TargetProfile, view.labels, did, opts);
	decideMutedPermanentModeration(accu, !!view.viewer?.muted);
	decideMutedTemporaryModeration(accu, did, opts);

	return accu;
};
