// @todo: move this to ~/com as it's now making use of SharedPreferences

import { sequal } from '~/utils/dequal.ts';

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

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<EmbeddedPostRecord, ModerationResult>();

export const getQuoteModDecision = (quote: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	const key = [quote, opts.rev];

	let res = cached.get(quote);

	if (!res || !sequal(res.c, key)) {
		const { moderation, filters } = opts;

		const labels = quote.labels;
		const text = (quote.value as PostRecord).text;

		const authorDid = quote.author.did;
		const isMuted = quote.author.viewer?.muted;

		const accu: ModerationCause[] = [];

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
		decideMutedKeywordModeration(accu, text, PreferenceWarn, moderation);

		cached.set(quote, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
