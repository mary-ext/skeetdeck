import { createContext, useContext } from 'solid-js';

import type { DeckConfig } from '../../globals/panes';

export interface DeckContextObject {
	readonly sym: symbol;
	deck: DeckConfig;
}

export const DeckContext = createContext<DeckContextObject>();

/*#__NO_SIDE_EFFECTS__*/
export const useDeckContext = (): DeckContextObject => {
	return useContext(DeckContext) as DeckContextObject;
};

export const dndPaneId = Symbol();

export interface DndPaneItem {
	[dndPaneId]: true;
	deck: string;
	pane: string;
	index: number;
}
