import { createContext, useContext } from 'solid-js';
import { assert } from '~/utils/misc';

export const enum ViewKind {
	CHANNEL_LISTING,
	SETTINGS,

	CHANNEL,
}

export type View =
	| { kind: ViewKind.CHANNEL_LISTING }
	| { kind: ViewKind.CHANNEL; id: string }
	| { kind: ViewKind.SETTINGS };

export type ViewParams<K extends ViewKind, V = View> = V extends { kind: K } ? Omit<V, 'kind'> : never;

export interface ChatRouterState {
	readonly current: View;
	readonly canGoBack: boolean;
	back(): void;
	to(next: View): void;
}

export const ChatRouterContext = createContext<ChatRouterState>();

export const useChatRouter = (): ChatRouterState => {
	const router = useContext(ChatRouterContext);
	assert(router !== undefined, `useChatRouter must be used under <ChatRouter>`);

	return router;
};
