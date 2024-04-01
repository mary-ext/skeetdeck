// Holds "common" preferences for components and utilities under ~/com folder.
// This should be set up in the main entrypoints.
// It's rather ugly, but alas.

// Previously this was a context, but after a while it didn't seem to be
// necessary, so now it's been turned into a singleton.

import { createSignal } from 'solid-js';

import type { ModerationOptions } from '~/api/moderation';
import type { LanguagePreferences, TranslationPreferences } from '~/api/types';

import { assert } from '~/utils/misc';

// Moderation results are cached for performance reasons, and at the moment it's
// done by having an array of cache key that it would dirty-check.

// It's not ideal, but not much that can be done until Solid.js offers
// lazily-computed memoization. (2.0 thing apparently)

// This holds the listener that gets called whenever we need to bust the cache.
export let bustModeration: () => void;

const [_moderationOptions, setModerationOptions] = createSignal<ModerationOptions>();
const [_languagePreferences, setLanguagePreferences] = createSignal<LanguagePreferences>();
const [_translationPreferences, setTranslationPreferences] = createSignal<TranslationPreferences>();

export const getModerationOptions = (): ModerationOptions => {
	const $moderationOptions = _moderationOptions();
	assert($moderationOptions != null);

	return $moderationOptions;
};

export const getLanguagePreferences = (): LanguagePreferences => {
	const $languagePreferences = _languagePreferences();
	assert($languagePreferences != null);

	return $languagePreferences;
};

export const getTranslationPreferences = (): TranslationPreferences => {
	const $translationPreferences = _translationPreferences();
	assert($translationPreferences != null);

	return $translationPreferences;
};

export const getTimelineQueryMeta = () => {
	return {
		moderation: getModerationOptions(),
		language: getLanguagePreferences(),
	};
};

export const setBustModerationListener = (fn: () => void): void => {
	bustModeration = fn;
};

export { setModerationOptions, setLanguagePreferences, setTranslationPreferences };
