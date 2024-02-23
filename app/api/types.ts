import type { At } from './atp-schema';

export interface FilterPreferences {
	/** Hide reposts by these users from the timeline */
	hideReposts: At.DID[];
	/** Temporarily hide posts by these users from the timeline */
	tempMutes: { [user: At.DID]: number | undefined };
}

export interface LanguagePreferences {
	/** Allow posts with these languages */
	languages: string[];
	/** Allow posts that matches the system's preferred languages */
	useSystemLanguages: boolean;
	/** Default language to use when composing a new post */
	defaultPostLanguage: 'none' | 'system' | (string & {});
	/** Show posts that do not explicitly specify a language */
	allowUnspecified: boolean;
}

export interface TranslationPreferences {
	/** Preferred language to translate posts into */
	to: string;
	/** Do not offer the option to translate on these languages */
	exclusions: string[];
}
