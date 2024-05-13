import { sequal } from '~/utils/dequal';

import type { AppBskyEmbedRecord, AppBskyFeedPost } from '../../atp-schema';
import { unwrapPostEmbedText } from '../../utils/post';

import {
	PreferenceWarn,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
	type ModerationCause,
	type ModerationOptions,
} from '..';
import { cache } from './_shared';

import { decideBasicProfileUncached } from './basic-profile';

export const decideQuote = (quote: AppBskyEmbedRecord.ViewRecord, opts: ModerationOptions) => {
	const key: unknown[] = [opts];

	let res = cache.get(key);
	if (!res || !sequal(res.c, key)) {
		const accu: ModerationCause[] = decideBasicProfileUncached(quote.author, opts);

		const author = quote.author;

		const record = quote.value as AppBskyFeedPost.Record;
		const text = record.text + unwrapPostEmbedText(quote.embeds?.[0]);

		decideLabelModeration(accu, TargetContent, quote.labels, author.did, opts);
		decideMutedKeywordModeration(accu, text, !!author.viewer?.following, PreferenceWarn, opts);

		cache.set(quote, (res = { r: accu, c: key }));
	}

	return res.r;
};
