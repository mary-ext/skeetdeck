import { createContext, useContext } from 'solid-js';

import type { At } from '~/api/atp-schema';

import { assert } from '~/utils/misc';

export interface ChatPaneState {
	getActive(): At.DID | undefined;
	setActive(next: At.DID | undefined): void;
	close(): void;
}

export const ChatPaneContext = createContext<ChatPaneState>();

export const useChatPane = (): ChatPaneState => {
	const state = useContext(ChatPaneContext);
	assert(state !== undefined, `useChatPane used incorrectly`);

	return state;
};
