import type { JSX } from 'solid-js';

import type { DeckConfig } from '../../globals/panes';
import { DeckContext, type DeckContextObject } from './DeckContext';

export interface DeckContextProviderProps {
	/** Expected to be static */
	deck: DeckConfig;
	children: JSX.Element;
}

export const DeckContextProvider = (props: DeckContextProviderProps) => {
	const symbol = Symbol();

	const deckContext: DeckContextObject = {
		sym: symbol,
		deck: props.deck,
	};

	return <DeckContext.Provider value={deckContext}>{props.children}</DeckContext.Provider>;
};
