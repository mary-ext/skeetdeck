import type { Agent } from '@externdefs/bluesky-client/agent';

import type { At } from '../atp-schema';
import { isDid } from '../utils/misc';

const _getDid = async (agent: Agent, actor: string, signal?: AbortSignal) => {
	let did: At.DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
			signal: signal,
			params: { handle: actor },
		});

		did = response.data.did;
	}

	return did;
};

export default _getDid;
