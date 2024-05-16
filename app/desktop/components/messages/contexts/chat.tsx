import { createContext, useContext } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';

import type { At } from '~/api/atp-schema';

import { assert } from '~/utils/misc';

import type { Channel } from '~/desktop/lib/messages/channel';
import type { ChatFirehose } from '~/desktop/lib/messages/firehose';
import type { LRU } from '~/desktop/lib/messages/lru';

import type { View } from './router';

export interface ChatRouterState {
	readonly current: View;
	readonly canGoBack: boolean;
	back(): void;
	to(next: View): void;
	replace(next: View): void;
}

export interface ChatPaneState {
	did: At.DID;
	rpc: BskyXRPC;
	firehose: ChatFirehose;
	channels: LRU<string, Channel>;

	router: ChatRouterState;

	close(): void;
	changeAccount(next: At.DID): void;
}

export const ChatPaneContext = createContext<ChatPaneState>();

export const useChatPane = (): ChatPaneState => {
	const state = useContext(ChatPaneContext);
	assert(state !== undefined, `useChatPane should be used within <ChatPaneContext.Provider>`);

	return state;
};
