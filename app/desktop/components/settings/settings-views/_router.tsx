import { createContext, useContext } from 'solid-js';

import type { At } from '~/api/atp-schema';

// Root
export const VIEW_ABOUT = 0;
export const VIEW_ACCOUNTS = 1;
export const VIEW_INTERFACE = 2;
export const VIEW_CONTENT = 3;
export const VIEW_MODERATION = 4;
export const VIEW_KEYWORD_FILTERS = 5;

// Account moderation
export const VIEW_ACCOUNT_MODERATION = 7;
// export const VIEW_ACCOUNT_BLOCKS = 8;
// export const VIEW_ACCOUNT_MUTES = 9;
// export const VIEW_ACCOUNT_MODERATION_LISTS = 10;

// Keyword filters
export const VIEW_KEYWORD_FILTER_FORM = 11;

// Content filters
export const VIEW_HIDDEN_REPOSTERS = 12;
export const VIEW_LABELER_CONFIG = 13;
export const VIEW_TEMPORARY_MUTES = 14;

// Languages
export const VIEW_ADDITIONAL_LANGUAGE = 15;
export const VIEW_EXCLUDED_TRANSLATION = 16;

export type ViewType =
	| typeof VIEW_ABOUT
	// | typeof VIEW_ACCOUNT_BLOCKS
	| typeof VIEW_ACCOUNT_MODERATION
	// | typeof VIEW_ACCOUNT_MODERATION_LISTS
	// | typeof VIEW_ACCOUNT_MUTES
	| typeof VIEW_ACCOUNTS
	| typeof VIEW_ADDITIONAL_LANGUAGE
	| typeof VIEW_CONTENT
	| typeof VIEW_EXCLUDED_TRANSLATION
	| typeof VIEW_HIDDEN_REPOSTERS
	| typeof VIEW_INTERFACE
	| typeof VIEW_KEYWORD_FILTER_FORM
	| typeof VIEW_KEYWORD_FILTERS
	| typeof VIEW_LABELER_CONFIG
	| typeof VIEW_MODERATION
	| typeof VIEW_TEMPORARY_MUTES;

export type View =
	// Root
	| { type: typeof VIEW_ABOUT }
	| { type: typeof VIEW_ACCOUNTS }
	| { type: typeof VIEW_INTERFACE }
	| { type: typeof VIEW_CONTENT }
	| { type: typeof VIEW_MODERATION }
	| { type: typeof VIEW_KEYWORD_FILTERS }
	// Account moderation
	// | { type: typeof VIEW_ACCOUNT_BLOCKS; did: At.DID }
	// | { type: typeof VIEW_ACCOUNT_MODERATION_LISTS; did: At.DID }
	| { type: typeof VIEW_ACCOUNT_MODERATION; did: At.DID }
	// | { type: typeof VIEW_ACCOUNT_MUTES; did: At.DID }
	// Content filters
	| { type: typeof VIEW_HIDDEN_REPOSTERS }
	| { type: typeof VIEW_LABELER_CONFIG; did: At.DID }
	| { type: typeof VIEW_TEMPORARY_MUTES }
	// Keyword filter form
	| { type: typeof VIEW_KEYWORD_FILTER_FORM; id: string | undefined }
	// Language
	| { type: typeof VIEW_ADDITIONAL_LANGUAGE }
	| { type: typeof VIEW_EXCLUDED_TRANSLATION };

export type ViewParams<T extends ViewType, V = View> = V extends { type: T } ? Omit<V, 'type'> : never;

export interface RouterState {
	readonly current: View;
	move: (next: View) => void;
}

export const RouterContext = createContext<RouterState>();

export const useViewRouter = () => {
	return useContext(RouterContext)!;
};
