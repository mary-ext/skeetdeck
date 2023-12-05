import { createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

export const enum ViewType {
	// Root
	ACCOUNTS,
	APPEARANCE,
	LANGAUGE,
	CONTENT_FILTERS,
	KEYWORD_FILTERS,
	USER_FILTERS,

	// Language
	ADDITIONAL_LANGUAGE,

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
	| { type: ViewType.LABEL_CONFIG; kind: 'user' | 'labeler'; did: DID }
	// Language
	| { type: ViewType.ADDITIONAL_LANGUAGE };

export interface RouterState {
	readonly current: View;
	move: (next: View) => void;
}

export const RouterContext = createContext<RouterState>();

export const useViewRouter = () => {
	return useContext(RouterContext)!;
};
