import { sequal } from '~/utils/dequal';

import { unwrapPostEmbedText } from '~/api/utils/post';

import type { SignalizedPost } from '~/api/stores/posts';

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

type ModerationResult = { d: ModerationDecision | null; c: unknown[] };
const cached = new WeakMap<SignalizedPost, ModerationResult>();

export const getPostModDecision = (post: SignalizedPost, opts: SharedPreferencesObject) => {
	const labels = post.labels.value;

	const author = post.author;
	const viewer = author.viewer;

	const authorDid = author.did;
	const isFollowing = viewer.following.value;
	const isMuted = viewer.muted.value;

	const key: unknown[] = [opts.rev, labels, isFollowing, isMuted];

	let res = cached.get(post);

	if (!res || !sequal(res.c, key)) {
		const { moderation } = opts;

		const accu: ModerationCause[] = [];

		// Text and embeds generally doesn't change, so we're putting it inside.
		const record = post.record.value;
		const text = record.text + unwrapPostEmbedText(record.embed);

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, authorDid, moderation);
		decideMutedKeywordModeration(accu, text, !!isFollowing, PreferenceWarn, moderation);

		cached.set(post, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
