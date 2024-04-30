import { unwrap } from 'solid-js/store';

import type { At } from '~/api/atp-schema';
import { systemLanguages } from '~/api/globals/platform';

import { type PreliminaryRichText, getRtLength, parseRt } from '~/api/richtext/composer';

import type { ComposedImage } from '~/utils/image';

import type { PreferencesSchema } from '~/desktop/globals/settings';

export interface GateStateEveryone {
	type: 'e';
}

export interface GateStateMentionedOnly {
	type: 'm';
}

export interface GateStateFollowedOnly {
	type: 'f';
}

export interface GateStateCustom {
	type: 'c';
	mentions: boolean;
	follows: boolean;
	lists: At.Uri[];
}

export type GateState = GateStateEveryone | GateStateMentionedOnly | GateStateFollowedOnly | GateStateCustom;

export interface ParsedPost {
	t: string;
	r: PreliminaryRichText;
}

export interface PostState {
	text: string;
	external: string | undefined;
	record: At.Uri | undefined;
	images: ComposedImage[];
	tags: string[];
	labels: string[];
	languages: string[];

	_parsed: ParsedPost | null;
}

export interface ComposerState {
	/** Which account we're posting from */
	author: At.DID | undefined;
	/** What it's replying to */
	reply: string | undefined;
	/** Posts to send, up to a max of 9 posts */
	posts: PostState[];
	/** Interaction gating set for the thread */
	gate: GateState;
}

export const getComposerLanguage = (preferences: PreferencesSchema) => {
	const prefs = preferences.language;
	const lang = prefs.defaultPostLanguage;

	if (lang === 'none') {
		return [];
	}
	if (lang === 'system') {
		return [systemLanguages[0]];
	}

	return [lang];
};

export const createPostState = (preferences: PreferencesSchema): PostState => {
	return {
		text: '',
		external: undefined,
		record: undefined,
		images: [],
		tags: [],
		labels: [],
		languages: getComposerLanguage(preferences),

		_parsed: null,
	};
};

export const createComposerState = (preferences: PreferencesSchema): ComposerState => {
	return {
		author: undefined,
		reply: undefined,
		gate: { type: preferences.ui.defaultReplyGate },
		posts: [createPostState(preferences)],
	};
};

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
