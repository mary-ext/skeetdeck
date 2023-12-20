// @todo: move this to ~/com as it's now making use of SharedPreferences

import type { SignalizedPost } from '../../stores/posts.ts';

import {
	type ModerationCause,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '../action.ts';
import { PreferenceWarn } from '../enums.ts';

import { isProfileTempMuted, type SharedPreferencesObject } from '~/com/components/SharedPreferences.tsx';

export const getPostModDecision = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	const { moderation, filters } = opts;

	const labels = post.labels.value;
	const text = post.record.value.text;

	const authorDid = post.author.did;
	const isMuted = post.author.viewer.muted.value;

	const accu: ModerationCause[] = [];

	decideLabelModeration(accu, labels, authorDid, moderation);
	decideMutedPermanentModeration(accu, isMuted);
	decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
	decideMutedKeywordModeration(accu, text, PreferenceWarn, moderation);

	return finalizeModeration(accu);
};
