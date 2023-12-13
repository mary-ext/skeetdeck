// @todo: move this to ~/com as it's now making use of SharedPreferences

import { createRoot } from 'solid-js';

import { createLazyMemo } from '~/utils/hooks.ts';

import type { Records, UnionOf } from '../../atp-schema.ts';

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

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

const cache = new WeakMap<EmbeddedPostRecord, () => ModerationDecision | null>();

const createQuoteModDecision = (quote: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	const { moderation, filters } = opts;

	return createRoot(() => {
		return createLazyMemo((): ModerationDecision | null => {
			const labels = quote.labels;
			const text = (quote.value as PostRecord).text;

			const authorDid = quote.author.did;
			const isMuted = quote.author.viewer?.muted;

			const accu: ModerationCause[] = [];

			decideLabelModeration(accu, labels, authorDid, moderation);
			decideMutedPermanentModeration(accu, isMuted);
			decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
			decideMutedKeywordModeration(accu, text, PreferenceWarn, moderation);

			return finalizeModeration(accu);
		});
	});
};

export const getQuoteModMaker = (post: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createQuoteModDecision(post, opts)));
	}

	return mod;
};
