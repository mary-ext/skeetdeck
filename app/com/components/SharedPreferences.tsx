// This context holds the preferences that common components will use.

import { createContext, useContext } from 'solid-js';

import type { LanguagePreferences, TranslationPreferences } from '~/api/types';

import type { ModerationOptions } from '~/api/moderation';

export interface SharedPreferencesObject {
	/** Used as a cache-busting mechanism */
	rev: number;
	moderation: ModerationOptions;
	language: LanguagePreferences;
	translation: TranslationPreferences;
}

export const SharedPreferences = createContext<SharedPreferencesObject>();

/*#__NO_SIDE_EFFECTS__*/
export const useSharedPreferences = () => {
	return useContext(SharedPreferences)!;
};

export const useBustRevCache = () => {
	const prefs = useSharedPreferences();
	return () => {
		prefs.rev = ~~(Math.random() * 1024);
	};
};
