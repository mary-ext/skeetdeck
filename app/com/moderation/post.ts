import { sequal } from '~/utils/dequal.ts';

import type { RefOf } from '~/api/atp-schema.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';

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

type Post = RefOf<'app.bsky.feed.defs#postView'>;

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

		// Text and image alt generally doesn't change, so we're putting it inside.
		const text = post.record.value.text + unwrapImageAlt(post.embed.value);

		decideLabelModeration(accu, labels, authorDid, moderation);
		decideMutedPermanentModeration(accu, isMuted);
		decideMutedTemporaryModeration(accu, isProfileTempMuted(filters, authorDid));
		decideMutedKeywordModeration(accu, text, !!isFollowing, PreferenceWarn, moderation);

		cached.set(post, (res = { d: finalizeModeration(accu), c: key }));
	}

	return res.d;
};

// Include image alt text as part of the text filters...
const unwrapImageAlt = (embed: Post['embed']): string => {
	let str = '';
	let images: RefOf<'app.bsky.embed.images#viewImage'>[] | undefined;

	if (embed) {
		if (embed.$type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if (
			embed.$type === 'app.bsky.embed.recordWithMedia#view' &&
			embed.media.$type === 'app.bsky.embed.images#view'
		) {
			images = embed.media.images;
		}
	}

	if (images) {
		for (let i = 0, il = images.length; i < il; i++) {
			str += ' ' + images[i].alt;
		}
	}

	return str;
};
