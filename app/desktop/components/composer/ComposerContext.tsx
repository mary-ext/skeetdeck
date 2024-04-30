import { createContext, useContext } from 'solid-js';

import type { ComposerState } from './utils/state';

export interface ComposerContextState {
	// Public API
	show(cb?: (state: ComposerState) => void): void;
	replace(state: ComposerState): void;
	state(): ComposerState | undefined;

	// Methods for components that displays the composer
	_key(): any;
	_onDisplay(cb: (next: boolean) => void): void;

	// Methods for the composer itself
	_mount(state: ComposerState): ComposerState;
	_hide(): void;
	_reset(): void;
}

export const ComposerContext = createContext<ComposerContextState>();

export const useComposer = () => {
	return useContext(ComposerContext)!;
};
