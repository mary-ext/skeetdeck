import type { XRPC } from '@atcute/client';
import type { At } from '@atcute/client/lexicons';

import { isDid } from '../utils/misc';

const _getDid = async (rpc: XRPC, actor: string, signal?: AbortSignal) => {
	let did: At.DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const response = await rpc.get('com.atproto.identity.resolveHandle', {
			signal: signal,
			params: { handle: actor },
		});

		did = response.data.did;
	}

	return did;
};

export default _getDid;
