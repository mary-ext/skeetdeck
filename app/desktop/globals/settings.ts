import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults.ts';
import { PreferenceWarn } from '~/api/moderation/enums.ts';
import type { ModerationOpts } from '~/api/moderation/types.ts';
import type { FilterPreferences, LanguagePreferences } from '~/api/types.ts';

import { createReactiveLocalStorage } from '~/utils/storage.ts';

import type { SharedPreferencesObject } from '~/com/components/SharedPreferences.tsx';

import { type DeckConfig, type PaneConfig, PaneSize, SpecificPaneSize } from './panes.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';

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
		const object: PreferencesSchema = {
			$version: 1,
			onboarding: true,
			decks: [],
			ui: {
				theme: 'auto',
				defaultPaneSize: PaneSize.MEDIUM,
			},
			moderation: {
				globals: {
					labels: {
						porn: PreferenceWarn,
						sexual: PreferenceWarn,
						nudity: PreferenceWarn,
						nsfl: PreferenceWarn,
						corpse: PreferenceWarn,
						gore: PreferenceWarn,
						torture: PreferenceWarn,
						'self-harm': PreferenceWarn,
						intolerant: PreferenceWarn,
						'intolerant-race': PreferenceWarn,
						'intolerant-gender': PreferenceWarn,
						'intolerant-sexual-orientation': PreferenceWarn,
						'intolerant-religion': PreferenceWarn,
						'icon-intolerant': PreferenceWarn,
						threat: PreferenceWarn,
						spoiler: PreferenceWarn,
						spam: PreferenceWarn,
						'account-security': PreferenceWarn,
						'net-abuse': PreferenceWarn,
						impersonation: PreferenceWarn,
						scam: PreferenceWarn,
					},
				},
				users: {},
				labelers: {
					[DEFAULT_MODERATION_LABELER]: {
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

		return object;
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

export const addPane = <T extends PaneConfig>(
	deck: DeckConfig,
	partial: Omit<T, 'id' | 'size' | 'title'>,
	index?: number,
) => {
	// @ts-expect-error
	const pane: PaneConfig = {
		...partial,
		id: getCurrentTid(),
		size: SpecificPaneSize.INHERIT,
		title: null,
	};

	if (index !== undefined) {
		deck.panes.splice(index, 0, pane);
	} else {
		deck.panes.push(pane);
	}
};
