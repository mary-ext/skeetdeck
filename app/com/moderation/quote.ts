import { sequal } from '~/utils/dequal';

import type { AppBskyEmbedRecord, AppBskyFeedPost } from '~/api/atp-schema';
import { unwrapPostEmbedText } from '~/api/utils/post';

import {
	type ModerationCause,
	type ModerationDecision,
	PreferenceWarn,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '~/api/moderation';

import { type SharedPreferencesObject } from '../components/SharedPreferences';

type EmbeddedPostRecord = AppBskyEmbedRecord.ViewRecord;
type PostRecord = AppBskyFeedPost.Record;

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<EmbeddedPostRecord, ModerationResult>();

export const getQuoteModDecision = (quote: EmbeddedPostRecord, opts: SharedPreferencesObject) => {
	const key = [opts.rev];

	let res = cached.get(quote);

	if (!res || !sequal(res.c, key)) {
		const { moderation } = opts;

		const labels = quote.labels;
		const text = (quote.value as PostRecord).text + unwrapPostEmbedText(quote.embeds?.[0]);

		const author = quote.author;
		const viewer = author.viewer;

		const authorDid = author.did;
		const isFollowing = !!viewer?.following;
		const isMuted = !!viewer?.muted;

		const accu: ModerationCause[] = [];

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, authorDid, moderation);
		decideMutedKeywordModeration(accu, text, isFollowing, PreferenceWarn, moderation);

		cached.set(quote, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
