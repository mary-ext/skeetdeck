import { createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

export const enum ViewType {
	// Root
	ACCOUNTS,
	APPEARANCE,
	LANGAUGE,
	CONTENT_FILTERS,
	KEYWORD_FILTERS,

	// Language
	ADDITIONAL_LANGUAGE,

	// Keyword filters
	KEYWORD_FILTER_FORM,

	// Content filters
	SUBSCRIBED_LABELERS,
	LABEL_CONFIG,
}

export type View =
	// Root
	| { type: ViewType.ACCOUNTS }
	| { type: ViewType.APPEARANCE }
	| { type: ViewType.LANGAUGE }
	| { type: ViewType.CONTENT_FILTERS }
	| { type: ViewType.KEYWORD_FILTERS }
	// Content filters
	| { type: ViewType.SUBSCRIBED_LABELERS }
	| { type: ViewType.LABEL_CONFIG; kind: 'global' }
	| { type: ViewType.LABEL_CONFIG; kind: 'labeler'; did: DID }
	// Keyword filter form
	| { type: ViewType.KEYWORD_FILTER_FORM; id: string | undefined }
	// Language
	| { type: ViewType.ADDITIONAL_LANGUAGE };

export type ViewParams<T extends ViewType, V = View> = V extends { type: T } ? Omit<V, 'type'> : never;

export interface RouterState {
	readonly current: View;
	move: (next: View) => void;
}

export const RouterContext = createContext<RouterState>();

export const useViewRouter = () => {
	return useContext(RouterContext)!;
};
