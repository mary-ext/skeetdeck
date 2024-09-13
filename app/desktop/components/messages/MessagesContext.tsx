import { createContext, useContext } from 'solid-js';

import type { At } from '~/api/atp-schema';

import { assert } from '~/utils/misc';

export interface MessagesInitialState {
	uid: At.DID;
	members: At.DID[];
}

export interface MessagesContextState {
	show(state?: MessagesInitialState | null): void;

	unreadCount(): number;
	setUnreadCount(count: number): void;

	onShow(callback: () => void): void;
	getInitialState(): MessagesInitialState | null;
}

export const MessagesContext = createContext<MessagesContextState>();

export const useMessages = (): MessagesContextState => {
	const state = useContext(MessagesContext);
	assert(state !== undefined, `useMessages must be used inside <MessagesContext.Provider>`);

	return state;
};
