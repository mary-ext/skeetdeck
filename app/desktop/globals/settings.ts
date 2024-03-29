import * as TID from '@mary/atproto-tid';

import { DEFAULT_MODERATION_LABELER } from '~/api/globals/defaults';
import type { LanguagePreferences, TranslationPreferences } from '~/api/types';

import type { ModerationOptions } from '~/api/moderation';

import { createReactiveLocalStorage } from '~/utils/storage';

import { type DeckConfig, type PaneConfig, PaneSize, SpecificPaneSize } from './panes';

export interface ModerationPreferences extends Omit<ModerationOptions, '_filtersCache'> {
	updatedAt: number;
}

export interface PreferencesSchema {
	$version: 10;
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
		/** Show grid UI for profile media */
		profileMediaGrid: boolean;
		/** Show thread replies in a threaded view */
		threadedReplies: boolean;
	};
	/** Accessibility configuration */
	a11y: {
		/** Warn if the media being posted contains no alt text */
		warnNoMediaAlt: boolean;
	};
	/** Content moderation */
	moderation: ModerationPreferences;
	/** Language configuration */
	language: LanguagePreferences;
	/** Translation configuration */
	translation: TranslationPreferences;
}

const PREF_KEY = 'rantai_prefs';

export const preferences = createReactiveLocalStorage<PreferencesSchema>(PREF_KEY, (version, prev) => {
	if (version === 0) {
		const object: PreferencesSchema = {
			$version: 10,
			onboarding: true,
			decks: [],
			ui: {
				theme: 'auto',
				defaultPaneSize: PaneSize.MEDIUM,
				profileMediaGrid: true,
				threadedReplies: false,
			},
			a11y: {
				warnNoMediaAlt: true,
			},
			moderation: {
				updatedAt: 0,
				labels: {},
				services: [
					{
						did: DEFAULT_MODERATION_LABELER,
						redact: true,
						profile: { handle: 'moderation.bsky.app' },
						prefs: {},
						vals: [],
						defs: {},
					},
				],
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

	if (version < 10) {
		const _next = prev as PreferencesSchema;

		delete prev.rev;

		_next.moderation = {
			updatedAt: 0,
			labels: {},
			services: [
				{
					did: DEFAULT_MODERATION_LABELER,
					redact: true,
					profile: { handle: 'moderation.bsky.app' },
					prefs: {},
					vals: [],
					defs: {},
				},
			],
			keywords: prev.moderation.keywords,
			hideReposts: prev.filters.hideReposts,
			tempMutes: prev.filters.tempMutes,
		};

		_next.$version = 10;
	}

	return prev;
});

export const addPane = <T extends PaneConfig>(
	deck: DeckConfig,
	partial: Omit<T, 'id' | 'size' | 'title'>,
	index?: number,
) => {
	// @ts-expect-error
	const pane: PaneConfig = {
		...partial,
		id: TID.now(),
		size: SpecificPaneSize.INHERIT,
		title: null,
	};

	if (index !== undefined) {
		deck.panes.splice(index, 0, pane);
	} else {
		deck.panes.push(pane);
	}
};

export const resolvePaneSize = (size: SpecificPaneSize): PaneSize => {
	if (size === SpecificPaneSize.INHERIT) {
		return preferences.ui.defaultPaneSize;
	}

	return size as any as PaneSize;
};
