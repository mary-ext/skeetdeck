import { sequal } from '~/utils/dequal';

import { unwrapPostEmbedText } from '../../utils/post';

import type { SignalizedPost } from '../../stores/posts';

import {
	PreferenceWarn,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
	type ModerationCause,
	type ModerationOptions,
} from '..';
import { cache } from './_shared';

import { moderateProfile } from './profile';

export const moderatePost = (post: SignalizedPost, opts: ModerationOptions) => {
	const author = post.author;

	const labels = post.labels.value;
	const isFollowing = author.viewer.following.value;

	const key: unknown[] = [opts, labels, isFollowing, post.cid.value];

	let res = cache.get(post);
	if (!res || !sequal(res.c, key)) {
		const accu: ModerationCause[] = [];
		const did = author.did;

		const record = post.record.peek();
		const text = record.text + unwrapPostEmbedText(record.embed);

		decideLabelModeration(accu, TargetContent, labels, did, opts);
		decideMutedKeywordModeration(accu, text, !!isFollowing, PreferenceWarn, opts);

		cache.set(post, (res = { r: accu, c: key }));
	}

	return res.r.concat(moderateProfile(author, opts));
};
