import { type JSX, createSignal } from 'solid-js';

import { multiagent } from '~/api/globals/agent.ts';

import { createDerivedSignal } from '~/utils/hooks.ts';

import { ComposerContext, type ComposerContextState } from './ComposerContext.tsx';

export interface ComposerContextProviderProps {
	children: JSX.Element;
}

const ComposerContextProvider = (props: ComposerContextProviderProps) => {
	const [open, setOpen] = createSignal<boolean>(false);
	const [reset, setReset] = createSignal<number>(0);

	const [authorDid, setAuthorDid] = createDerivedSignal(() => multiagent.active!);

	const [replyUri, setReplyUri] = createSignal<string>();
	const [quoteUri, setQuoteUri] = createSignal<string>();

	const context: ComposerContextState = {
		get open() {
			return open();
		},
		set open(next: boolean) {
			setOpen(next);
		},

		get reset() {
			return reset();
		},
		set reset(next) {
			setReset(next);
		},

		get authorDid() {
			return authorDid();
		},
		set authorDid(next) {
			setAuthorDid(next);
		},

		get replyUri() {
			return replyUri();
		},
		set replyUri(next) {
			setReplyUri(next);
		},

		get recordUri() {
			return quoteUri();
		},
		set recordUri(next) {
			setQuoteUri(next);
		},
	};

	return <ComposerContext.Provider value={context} children={props.children} />;
};

export default ComposerContextProvider;
