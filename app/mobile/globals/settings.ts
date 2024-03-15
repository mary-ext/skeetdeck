import type { At } from '~/api/atp-schema';
import type { LanguagePreferences, TranslationPreferences } from '~/api/types';

import type { ModerationOptions } from '~/api/moderation';

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
	moderation: ModerationOptions;
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
				globals: { prefs: {} },
				services: {},
				keywords: [],
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
		language: preferences.language,
		translation: preferences.translation,
	};
};

export const bustRevisionCache = () => {
	preferences.rev = ~~(Math.random() * 1024);
};
