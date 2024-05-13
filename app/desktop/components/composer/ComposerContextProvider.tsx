import { batch, createSignal, untrack, type JSX } from 'solid-js';
import { createMutable } from 'solid-js/store';

import type { At } from '~/api/atp-schema';

import { ComposerContext, type ComposerContextState } from './ComposerContext';
import type { ComposerState } from './utils/state';

export interface ComposerContextProviderProps {
	children: JSX.Element;
}

export const ComposerContextProvider = (props: ComposerContextProviderProps) => {
	const [key, setKey] = createSignal(0);
	const [state, setState] = createSignal<ComposerState>();

	let _deferred = Promise.withResolvers<ComposerState>();

	let _override: ComposerState | undefined;
	let _uid: At.DID | undefined;

	let _onShow: ((next: boolean) => void) | undefined;

	const context: ComposerContextState = {
		show(cb) {
			_onShow?.(true);

			if (cb) {
				_deferred.promise.then((res) => batch(() => cb(res)));
			}
		},
		replace(state) {
			_override = state;

			_deferred = Promise.withResolvers();

			batch(() => {
				setKey(key() + 1);
				_onShow?.(true);
			});
		},
		state: state,

		_key: key,
		_onDisplay(cb) {
			_onShow = cb;
		},

		_mount(state) {
			if (_override) {
				state = _override;
				_override = undefined;
			}

			if (_uid) {
				state.author = _uid;
				_uid = undefined;
			}

			state = createMutable(state);

			setState(state);
			_deferred.resolve(state);
			return state;
		},
		_reset() {
			_deferred = Promise.withResolvers();
			_uid = untrack(state)?.author;
			setKey(key() + 1);
		},
		_hide() {
			_onShow?.(false);
		},
	};

	return <ComposerContext.Provider value={context}>{props.children}</ComposerContext.Provider>;
};

export default ComposerContextProvider;
