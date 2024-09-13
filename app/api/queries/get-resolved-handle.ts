import type { At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { multiagent } from '../globals/agent';
import { isDid } from '../utils/misc';

export const getResolvedHandleKey = (uid: At.DID, actor: string) => {
	return ['getResolvedHandle', uid, actor] as const;
};
export const getResolvedHandle = async (ctx: QC<ReturnType<typeof getResolvedHandleKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	if (isDid(actor)) {
		return { did: actor };
	}

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
		signal: ctx.signal,
		params: {
			handle: actor,
		},
	});

	return response.data;
};
