import { sequal } from '~/utils/dequal.ts';

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
	let prev: unknown[] = [];
	let decision: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = post.labels.value;
		const text = post.record.value.text;

		const authorDid = post.author.did;
		const isMuted = post.author.viewer.muted.value;

		const next = [labels, text, isMuted];

		if (!sequal(prev, next)) {
			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, opts);
			decideMutedPermanentModeration(accu, isMuted);
			// decideMutedTemporaryModeration(accu, isProfileTemporarilyMuted(uid, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, opts);

			prev = next;
			decision = finalizeModeration(accu);
		}

		return decision;
	};
};

export const getPostModMaker = (post: SignalizedPost, opts: ModerationOpts) => {
	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createPostModDecision(post, opts)));
	}

	return mod;
};
