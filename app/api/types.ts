import type { DID } from './atp-schema.ts';

export interface FilterPreferences {
	/** Hide reposts by these users from the timeline */
	hideReposts: DID[];
	/** Temporarily hide posts by these users from the timeline */
	tempMutes: { [user: DID]: number | undefined };
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
