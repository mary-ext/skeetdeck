// This context holds the preferences that common components will use.

import { createContext, useContext } from 'solid-js';

import type { ModerationOpts } from '~/api/moderation/types.ts';
import type { FilterPreferences, LanguagePreferences } from '~/api/types.ts';

export interface SharedPreferencesObject {
	moderation: ModerationOpts;
	filters: FilterPreferences;
	language: LanguagePreferences;
}

export const SharedPreferences = createContext<SharedPreferencesObject>();

export const useSharedPreferences = () => {
	return useContext(SharedPreferences)!;
};
