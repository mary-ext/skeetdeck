import { createContext, useContext } from 'solid-js';

import type { BskyXRPC } from '@mary/bluesky-client';

import type { At } from '~/api/atp-schema';

import { assert } from '~/utils/misc';

import type { ChatFirehose } from '~/desktop/lib/messages/firehose';

export interface MultichatState {
	did: At.DID;
	rpc: BskyXRPC;
	firehose: ChatFirehose;
}

export const MultichatContext = createContext<MultichatState>();

export const useMultichat = (): MultichatState => {
	const state = useContext(MultichatContext);
	assert(state !== undefined, `useMultichat must be used under <MultichatRenderer>`);

	return state;
};
