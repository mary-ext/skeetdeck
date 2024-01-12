// @todo: move this to ~/com as it's now making use of SharedPreferences

import { sequal } from '~/utils/dequal.ts';

import type { SignalizedPost } from '../../stores/posts.ts';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '../action.ts';
import { PreferenceWarn } from '../enums.ts';

import { type SharedPreferencesObject, isProfileTempMuted } from '~/com/components/SharedPreferences.tsx';

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<SignalizedPost, ModerationResult>();

export const getPostModDecision = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	const labels = post.labels.value;
	const text = post.record.value.text;

	const author = post.author;
	const viewer = author.viewer;

	const authorDid = author.did;
	const isFollowing = viewer.following.value;
	const isMuted = viewer.muted.value;

	const key: unknown[] = [labels, text, isFollowing, isMuted, opts.rev];

	let res = cached.get(post);

	if (!res || !sequal(res.c, key)) {
		const { moderation, filters } = opts;

		const accu: ModerationCause[] = [];

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceWarn, moderation);

		cached.set(post, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
