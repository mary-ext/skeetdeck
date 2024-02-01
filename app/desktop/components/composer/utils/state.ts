import { unwrap } from 'solid-js/store';

import { type PreliminaryRichText, getRtLength, parseRt } from '~/api/richtext/composer.ts';

import type { ComposerState, PostState } from '../ComposerContext.tsx';

export const getPostRt = (post: PostState): PreliminaryRichText => {
	const unwrapped = unwrap(post);

	const text = post.text;
	const existing = unwrapped._parsed;

	if (existing === null || existing.t !== text) {
		return (unwrapped._parsed = { t: text, r: parseRt(text) }).r;
	}

	return existing.r;
};

export const isStateFilled = (state: ComposerState) => {
	const posts = state.posts;

	for (let i = 0, il = posts.length; i < il; i++) {
		const draft = posts[i];

		if (draft.images.length > 0 || getRtLength(getPostRt(draft)) > 0) {
			return true;
		}
	}

	return false;
};
