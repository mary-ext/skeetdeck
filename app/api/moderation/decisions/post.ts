import { createRoot } from 'solid-js';

import { createLazyMemo } from '~/utils/hooks.ts';

import type { SignalizedPost } from '../../stores/posts.ts';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	finalizeModeration,
} from '../action.ts';
import { PreferenceWarn } from '../enums.ts';
import type { ModerationOpts } from '../types.ts';

const cache = new WeakMap<SignalizedPost, () => ModerationDecision | null>();

const createPostModDecision = (post: SignalizedPost, opts: ModerationOpts) => {
	return createRoot(() => {
		return createLazyMemo((): ModerationDecision | null => {
			const labels = post.labels.value;
			const text = post.record.value.text;

			const authorDid = post.author.did;
			const isMuted = post.author.viewer.muted.value;

			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, opts);
			decideMutedPermanentModeration(accu, isMuted);
			// decideMutedTemporaryModeration(accu, isProfileTemporarilyMuted(uid, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, opts);

			return finalizeModeration(accu);
		});
	});
};

export const getPostModMaker = (post: SignalizedPost, opts: ModerationOpts) => {
	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createPostModDecision(post, opts)));
	}

	return mod;
};
