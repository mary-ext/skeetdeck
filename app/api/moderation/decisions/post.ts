// @todo: move this to ~/com as it's now making use of SharedPreferences

import { dequal } from '~/utils/dequal.ts';

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

const cache = new WeakMap<SignalizedPost, WeakRef<() => ModerationDecision | null>>();

const createPostModDecision = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	const { moderation, filters } = opts;

	let curr: unknown[];
	let result: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = post.labels.value;
		const text = post.record.value.text;

		const authorDid = post.author.did;
		const isMuted = post.author.viewer.muted.value;

		const cacheKey = [labels, text, isMuted, moderation, filters];

		if (!dequal(curr, cacheKey)) {
			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, moderation);
			decideMutedPermanentModeration(accu, isMuted);
			decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, moderation);

			curr = cacheKey;
			result = finalizeModeration(accu);
		}

		return result;
	};
};

export const getPostModMaker = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	let ref = cache.get(post);
	let mod = ref?.deref();

	if (!mod) {
		cache.set(post, new WeakRef((mod = createPostModDecision(post, opts))));
	}

	return mod;
};
