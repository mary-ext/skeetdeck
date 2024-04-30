import { type JSX, createSignal } from 'solid-js';
import { createMutable } from 'solid-js/store';

import { preferences } from '~/desktop/globals/settings';

import { type ComposerContextState, createComposerState, ComposerContext } from './ComposerContext';

export interface ComposerContextProviderProps {
	children: JSX.Element;
}

export const ComposerContextProvider = (props: ComposerContextProviderProps) => {
	const [open, setOpen] = createSignal(false);
	const [state, setState] = createSignal(createMutable(createComposerState(preferences)));

	const context: ComposerContextState = {
		get open() {
			return open();
		},
		set open(next) {
			setOpen(next);
		},
		get state() {
			return state();
		},
		set state(next) {
			setState(createMutable(next));
		},
	};

	return <ComposerContext.Provider value={context}>{props.children}</ComposerContext.Provider>;
};

export default ComposerContextProvider;
