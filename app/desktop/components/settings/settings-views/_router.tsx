import { createContext, useContext } from 'solid-js';

export const enum ViewType {
	ACCOUNTS,
	APPEARANCE,
	LANGAUGE,
	CONTENT_FILTERS,
	KEYWORD_FILTERS,
	USER_FILTERS,
}

export type View =
	| { type: ViewType.ACCOUNTS }
	| { type: ViewType.APPEARANCE }
	| { type: ViewType.LANGAUGE }
	| { type: ViewType.CONTENT_FILTERS }
	| { type: ViewType.KEYWORD_FILTERS }
	| { type: ViewType.USER_FILTERS };

export interface RouterState {
	readonly current: View;
	navigate: (next: View) => void;
}

export const RouterContext = createContext<RouterState>();

export const useViewRouter = () => {
	return useContext(RouterContext)!;
};
