import { sequal } from '~/utils/dequal';

import type { AppBskyEmbedImages, AppBskyFeedDefs } from '~/api/atp-schema';
import { unwrapPostEmbedText } from '~/api/utils/post';

import type { SignalizedPost } from '~/api/stores/posts';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '~/api/moderation/action';
import { PreferenceWarn } from '~/api/moderation/enums';

import { type SharedPreferencesObject, isProfileTempMuted } from '../components/SharedPreferences';

type Post = AppBskyFeedDefs.PostView;

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
		const { moderation, filters } = opts;

		const accu: ModerationCause[] = [];

		// Text and embeds generally doesn't change, so we're putting it inside.
		const record = post.record.value;
		const text = record.text + unwrapPostEmbedText(record.embed);

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
		decideMutedKeywordModeration(accu, text, !!isFollowing, PreferenceWarn, moderation);

		cached.set(post, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};
