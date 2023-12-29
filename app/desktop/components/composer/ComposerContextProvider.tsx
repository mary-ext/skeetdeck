import { type JSX, createSignal } from 'solid-js';
import { createMutable } from 'solid-js/store';

import { multiagent } from '~/api/globals/agent.ts';

import { preferences } from '~/desktop/globals/settings.ts';
import { createDerivedSignal } from '~/utils/hooks.ts';

import { type ComposerContextState, createComposerState, ComposerContext } from './ComposerContext.tsx';

export interface ComposerContextProviderProps {
	children: JSX.Element;
}

export const ComposerContextProvider = (props: ComposerContextProviderProps) => {
	const [open, setOpen] = createSignal(false);
	const [author, setAuthor] = createDerivedSignal(() => multiagent.active!);
	const [state, setState] = createSignal(createMutable(createComposerState(preferences)));

	const context: ComposerContextState = {
		get open() {
			return open();
		},
		set open(next) {
			setOpen(next);
		},
		get author() {
			return author();
		},
		set author(next) {
			setAuthor(next);
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
