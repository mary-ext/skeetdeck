import { sequal } from '~/utils/dequal.ts';

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
	let prev: unknown[] = [];
	let decision: ModerationDecision | null;

	return (): ModerationDecision | null => {
		const labels = quote.labels;
		const text = (quote.value as PostRecord).text;

		const authorDid = quote.author.did;
		const isMuted = quote.author.viewer?.muted;

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

export const getQuoteModMaker = (post: EmbeddedPostRecord, opts: ModerationOpts) => {
	let mod = cache.get(post);

	if (!mod) {
		cache.set(post, (mod = createQuoteModDecision(post, opts)));
	}

	return mod;
};
