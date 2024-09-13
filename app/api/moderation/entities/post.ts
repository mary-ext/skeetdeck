import {
	type ModerationCause,
	type ModerationOptions,
	PreferenceWarn,
	TargetContent,
	decideLabelModeration,
	decideMutedKeywordModeration,
} from '..';
import type { SignalizedPost } from '../../stores/posts';
import { unwrapPostEmbedText } from '../../utils/post';

import { moderateProfile } from './profile';

export const moderatePost = (post: SignalizedPost, opts: ModerationOptions) => {
	const author = post.author;

	const labels = post.labels.value;
	const isFollowing = author.viewer.following.value;

	const accu: ModerationCause[] = [];
	const did = author.did;

	const record = post.record.peek();
	const text = record.text + unwrapPostEmbedText(record.embed);

	decideLabelModeration(accu, TargetContent, labels, did, opts);
	decideMutedKeywordModeration(accu, text, !!isFollowing, PreferenceWarn, opts);

	return accu.concat(moderateProfile(author, opts));
};
