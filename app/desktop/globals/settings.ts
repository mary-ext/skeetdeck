import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults.ts';
import { PreferenceWarn } from '~/api/moderation/enums.ts';
import type { ModerationOpts } from '~/api/moderation/types.ts';
import type { FilterPreferences, LanguagePreferences } from '~/api/types.ts';

import { createReactiveLocalStorage } from '~/utils/storage.ts';

import type { SharedPreferencesObject } from '~/com/components/SharedPreferences.tsx';

import { type DeckConfig, PaneSize } from './panes.ts';

export interface PreferencesSchema {
	$version: 1;
	/** Onboarding mode */
	onboarding: boolean;
	/** Deck configuration */
	decks: DeckConfig[];
	/** UI configuration */
	ui: {
		/** Application theme */
		theme: 'auto' | 'dark' | 'light';
		/** Default pane size */
		defaultPaneSize: PaneSize;
	};
	/** Content moderation */
	moderation: Omit<ModerationOpts, '_filtersCache'>;
	/** Filter configuration */
	filters: FilterPreferences;
	/** Language configuration */
	language: LanguagePreferences;
}

const PREF_KEY = 'rantai_prefs';

export const preferences = createReactiveLocalStorage<PreferencesSchema>(PREF_KEY, (version, prev) => {
	if (version === 0) {
		return {
			$version: 1,
			onboarding: true,
			decks: [],
			ui: {
				theme: 'auto',
				defaultPaneSize: PaneSize.MEDIUM,
			},
			moderation: {
				globals: {
					groups: {
						sexual: PreferenceWarn,
						violence: PreferenceWarn,
						intolerance: PreferenceWarn,
						rude: PreferenceWarn,
						spam: PreferenceWarn,
						misinfo: PreferenceWarn,
					},
					labels: {},
				},
				users: {},
				labelers: {
					[DEFAULT_MODERATION_LABELER]: {
						groups: {},
						labels: {},
					},
				},
				keywords: [],
			},
			filters: {
				hideReposts: [],
				tempMutes: {},
			},
			language: {
				languages: [],
				useSystemLanguages: true,
				allowUnspecified: true,
				defaultPostLanguage: 'system',
			},
		};
	}

	return prev;
});

export const createSharedPreferencesObject = (): SharedPreferencesObject => {
	return {
		// ModerationOpts contains internal state properties, we don't want them
		// to be reflected back into persisted storage.
		moderation: {
			...preferences.moderation,
		},
		filters: preferences.filters,
		language: preferences.language,
	};
};
