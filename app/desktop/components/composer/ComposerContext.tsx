import { createContext, useContext } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { systemLanguages } from '~/api/globals/platform';

import type { PreliminaryRichText } from '~/api/richtext/composer';

import type { PreferencesSchema } from '~/desktop/globals/settings';

import type { ComposedImage } from '~/utils/image';

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
	/** What it's replying to */
	reply: string | undefined;
	/** Posts to send, up to a max of 9 posts */
	posts: PostState[];
	/** Interaction gating set for the thread */
	gate: GateState;
}

export interface ComposerContextState {
	open: boolean;
	/** Which user are we using to send these posts */
	author: At.DID;
	/** Keyed state object, reassigning should reset the entire composer */
	state: ComposerState;
}

export const ComposerContext = createContext<ComposerContextState>();

export const useComposer = () => {
	return useContext(ComposerContext)!;
};

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
		reply: undefined,
		gate: { type: preferences.ui.defaultReplyGate },
		posts: [createPostState(preferences)],
	};
};
