import { type JSX, batch, createSignal } from 'solid-js';

import { EQUALS_FALSE } from '~/utils/hooks';

import { MessagesContext, type MessagesContextState, type MessagesInitialState } from './MessagesContext';

export interface MessagesContextProviderProps {
	children: JSX.Element;
}

const MessagesContextProvider = (props: MessagesContextProviderProps) => {
	const [initialState, setInitialState] = createSignal<MessagesInitialState | null>(null, EQUALS_FALSE);
	const [unreadCount, setUnreadCount] = createSignal(0);

	let _onShow: (() => void) | undefined;

	const context: MessagesContextState = {
		show(state) {
			batch(() => {
				if (state !== undefined) {
					setInitialState(state);
				}

				_onShow?.();
			});
		},

		unreadCount,
		setUnreadCount,

		onShow(callback) {
			_onShow = callback;
		},
		getInitialState: initialState,
	};

	return <MessagesContext.Provider value={context}>{props.children}</MessagesContext.Provider>;
};

export default MessagesContextProvider;
