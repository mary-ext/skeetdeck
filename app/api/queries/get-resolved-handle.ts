import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import { isDid } from '../utils/misc.ts';

export const getResolvedHandleKey = (uid: DID, actor: string) => {
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
