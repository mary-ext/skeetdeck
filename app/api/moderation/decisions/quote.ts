// @todo: move this to ~/com as it's now making use of SharedPreferences

import { dequal } from '~/utils/dequal.ts';

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

const cache = new WeakMap<EmbeddedPostRecord, WeakRef<() => ModerationDecision | null>>();

const createQuoteModDecision = (quote: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	const { moderation, filters } = opts;

	let curr: unknown[];
	let result: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = quote.labels;
		const text = (quote.value as PostRecord).text;

		const authorDid = quote.author.did;
		const isMuted = quote.author.viewer?.muted;

		const cacheKey = [moderation, filters];

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

export const getQuoteModMaker = (post: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	let ref = cache.get(post);
	let mod = ref?.deref();

	if (!mod) {
		cache.set(post, new WeakRef((mod = createQuoteModDecision(post, opts))));
	}

	return mod;
};
