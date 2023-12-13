// @todo: move this to ~/com as it's now making use of SharedPreferences

import { createRoot } from 'solid-js';

import { createLazyMemo } from '~/utils/hooks.ts';

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

import { isProfileTempMuted, type SharedPreferencesObject } from '~/com/components/SharedPreferences.tsx';

const cache = new WeakMap<SignalizedPost, () => ModerationDecision | null>();

const createPostModDecision = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	const { moderation, filters } = opts;

	return createRoot(() => {
		return createLazyMemo((): ModerationDecision | null => {
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
		});
	});
};

export const getPostModMaker = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	if (import.meta.env.VITE_GIT_BRANCH === 'canary') {
		return createPostModDecision(post, opts);
	}

	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createPostModDecision(post, opts)));
	}

	return mod;
};
