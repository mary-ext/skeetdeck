import { createContext, useContext } from 'solid-js';

import type { AtUri, DID } from '~/api/atp-schema.ts';
import { systemLanguages } from '~/api/globals/platform.ts';

import { type PreliminaryRichText, textToPrelimRt } from '~/api/richtext/composer.ts';

import type { PreferencesSchema } from '~/desktop/globals/settings.ts';

import type { ComposedImage } from '~/utils/image.ts';

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
	lists: AtUri[];
}

export type GateState = GateStateEveryone | GateStateMentionedOnly | GateStateFollowedOnly | GateStateCustom;

export interface PostState {
	text: string;
	rt: PreliminaryRichText;
	external: string | undefined;
	record: AtUri | undefined;
	images: ComposedImage[];
	tags: string[];
	labels: string[];
	languages: string[];
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
	author: DID;
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
	let cached: string;
	let rt: PreliminaryRichText;

	return {
		text: '',
		get rt() {
			const next = this.text;

			if (cached !== (cached = next)) {
				rt = textToPrelimRt(next);
			}

			return rt;
		},
		external: undefined,
		record: undefined,
		images: [],
		tags: [],
		labels: [],
		languages: getComposerLanguage(preferences),
	};
};

export const createComposerState = (preferences: PreferencesSchema): ComposerState => {
	return {
		reply: undefined,
		gate: { type: 'e' },
		posts: [createPostState(preferences)],
	};
};
