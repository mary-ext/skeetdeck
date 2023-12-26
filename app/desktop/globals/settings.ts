import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults.ts';
import { PreferenceWarn } from '~/api/moderation/enums.ts';
import type { ModerationOpts } from '~/api/moderation/types.ts';
import type { FilterPreferences, LanguagePreferences, TranslationPreferences } from '~/api/types.ts';

import { getCurrentTid } from '~/api/utils/tid.ts';

import { createReactiveLocalStorage } from '~/utils/storage.ts';

import type { SharedPreferencesObject } from '~/com/components/SharedPreferences.tsx';

import { type DeckConfig, type PaneConfig, PaneSize, SpecificPaneSize } from './panes.ts';

export interface PreferencesSchema {
	$version: 4;
	/** Used for cache-busting moderation filters */
	rev: number;
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
		/** Warn if the media being posted contains no alt text */
	};
	/** Accessibility configuration */
	a11y: {
		warnNoMediaAlt: boolean;
	};
	/** Content moderation */
	moderation: Omit<ModerationOpts, '_filtersCache'>;
	/** Filter configuration */
	filters: FilterPreferences;
	/** Language configuration */
	language: LanguagePreferences;
	/** Translation configuration */
	translation: TranslationPreferences;
}

const PREF_KEY = 'rantai_prefs';

export const preferences = createReactiveLocalStorage<PreferencesSchema>(PREF_KEY, (version, prev) => {
	if (version === 0) {
		const object: PreferencesSchema = {
			$version: 4,
			rev: 0,
			onboarding: true,
			decks: [],
			ui: {
				theme: 'auto',
				defaultPaneSize: PaneSize.MEDIUM,
			},
			a11y: {
				warnNoMediaAlt: true,
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
				// users: {},
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
			translation: {
				to: 'system',
				exclusions: [],
			},
		};

		return object;
	}

	if (version < 2) {
		const _prev = prev as PreferencesSchema;

		_prev.a11y = {
			warnNoMediaAlt: true,
		};
	}

	if (version < 3) {
		const _prev = prev as PreferencesSchema;

		_prev.rev = 0;
	}

	if (version < 4) {
		const _prev = prev as PreferencesSchema;

		_prev.translation = {
			to: 'system',
			exclusions: [],
		};
		// _prev.$version = 4;
	}

	return prev;
});

export const createSharedPreferencesObject = (): SharedPreferencesObject => {
	return {
		get rev() {
			return preferences.rev;
		},
		set rev(next) {
			preferences.rev = next;
		},
		// ModerationOpts contains internal state properties, we don't want them
		// to be reflected back into persisted storage.
		moderation: {
			...preferences.moderation,
		},
		filters: preferences.filters,
		language: preferences.language,
		translation: preferences.translation,
	};
};

export const bustRevisionCache = () => {
	preferences.rev = ~~(Math.random() * 1024);
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
