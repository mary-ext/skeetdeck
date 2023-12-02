import { createContext, useContext } from 'solid-js';

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
}

export type View =
	// Root
	| { type: ViewType.ACCOUNTS }
	| { type: ViewType.APPEARANCE }
	| { type: ViewType.LANGAUGE }
	| { type: ViewType.CONTENT_FILTERS }
	| { type: ViewType.KEYWORD_FILTERS }
	| { type: ViewType.USER_FILTERS }
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
