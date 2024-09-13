import {
	type ModerationCause,
	type ModerationOptions,
	PreferenceWarn,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
} from '..';
import type { AppBskyEmbedRecord, AppBskyFeedPost } from '../../atp-schema';
import { unwrapPostEmbedText } from '../../utils/post';

import { decideBasicProfile } from './basic-profile';

export const decideQuote = (quote: AppBskyEmbedRecord.ViewRecord, opts: ModerationOptions) => {
	const accu: ModerationCause[] = decideBasicProfile(quote.author, opts);

	const author = quote.author;

	const record = quote.value as AppBskyFeedPost.Record;
	const text = record.text + unwrapPostEmbedText(quote.embeds?.[0]);

	decideLabelModeration(accu, TargetContent, quote.labels, author.did, opts);
	decideMutedKeywordModeration(accu, text, !!author.viewer?.following, PreferenceWarn, opts);

	return accu;
};
