import { createContext, useContext } from 'solid-js';
import type { AtUri, DID } from '~/api/atp-schema.ts';

export interface ComposerContextState {
	open: boolean;
	reset: number;
	authorDid: DID;
	replyUri?: AtUri;
	recordUri?: AtUri;
}

export const ComposerContext = createContext<ComposerContextState>();

export const useComposer = () => {
	return useContext(ComposerContext)!;
};
