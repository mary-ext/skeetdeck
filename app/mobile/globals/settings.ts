import type { At } from '~/api/atp-schema';
import type { FilterPreferences, LanguagePreferences, TranslationPreferences } from '~/api/types';

import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults';

import { PreferenceWarn } from '~/api/moderation/enums';
import type { ModerationOpts } from '~/api/moderation/types';

import { createReactiveLocalStorage } from '~/utils/storage';

import type { SharedPreferencesObject } from '~/com/components/SharedPreferences';

export interface PreferencesSchema {
	$version: 1;
	/** Used for cache-busting moderation filters */
	rev: number;
	/** UI configuration */
	ui: {
		/** Application theme */
		theme: 'auto' | 'dark' | 'light';
	};
	/** Feed preferences */
	feeds: {
		/** Home feed preferences */
		home: {
			replies: 'follows' | boolean;
			reposts: boolean;
			quotes: boolean;
		};
		/** Saved feeds */
		saved: { uri: At.Uri; name: string; pinned: boolean }[];
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

const PREF_KEY = 'langit_prefs';

export const preferences = createReactiveLocalStorage<PreferencesSchema>(PREF_KEY, (version, prev) => {
	if (version === 0) {
		const object: PreferencesSchema = {
			$version: 1,
			rev: 0,
			ui: {
				theme: 'auto',
			},
			feeds: {
				home: {
					replies: 'follows',
					reposts: true,
					quotes: true,
				},
				saved: [
					{
						uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
						name: 'Discover',
						pinned: true,
					},
				],
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
