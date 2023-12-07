import { createRoot } from 'solid-js';

import { createLazyMemo } from '~/utils/hooks.ts';

import type { Records, UnionOf } from '../../atp-schema.ts';

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

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

const cache = new WeakMap<EmbeddedPostRecord, () => ModerationDecision | null>();

const createQuoteModDecision = (quote: EmbeddedPostRecord, opts: ModerationOpts) => {
	return createRoot(() => {
		return createLazyMemo((): ModerationDecision | null => {
			const labels = quote.labels;
			const text = (quote.value as PostRecord).text;

			const authorDid = quote.author.did;
			const isMuted = quote.author.viewer?.muted;

			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, opts);
			decideMutedPermanentModeration(accu, isMuted);
			// decideMutedTemporaryModeration(accu, isProfileTemporarilyMuted(uid, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, opts);

			return finalizeModeration(accu);
		});
	});
};

export const getQuoteModMaker = (post: EmbeddedPostRecord, opts: ModerationOpts) => {
	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createQuoteModDecision(post, opts)));
	}

	return mod;
};
