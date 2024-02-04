import { sequal } from '~/utils/dequal.ts';

import type { Records, UnionOf } from '~/api/atp-schema.ts';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '~/api/moderation/action.ts';
import { PreferenceWarn } from '~/api/moderation/enums.ts';

import { type SharedPreferencesObject, isProfileTempMuted } from '../components/SharedPreferences.tsx';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<EmbeddedPostRecord, ModerationResult>();

export const getQuoteModDecision = (quote: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	const key = [opts.rev];

	let res = cached.get(quote);

	if (!res || !sequal(res.c, key)) {
		const { moderation, filters } = opts;

		const labels = quote.labels;
		const text = (quote.value as PostRecord).text;

		const author = quote.author;
		const viewer = author.viewer;

		const authorDid = author.did;
		const isFollowing = !!viewer?.following;
		const isMuted = !!viewer?.muted;

		const accu: ModerationCause[] = [];

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceWarn, moderation);

		cached.set(quote, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
