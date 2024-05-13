import { XRPCError } from '@mary/bluesky-client/xrpc';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

import type { AppBskyLabelerDefs, At } from '../atp-schema';
import { publicAppView } from '../globals/agent';
import { interpretServiceDefinition } from '../moderation/service';

export const getLabelerInfoKey = (did: At.DID) => {
	return ['/getLabelerInfo', did] as const;
};
export const getLabelerInfo = async (ctx: QC<ReturnType<typeof getLabelerInfoKey>>) => {
	const [, did] = ctx.queryKey;

	const response = await publicAppView.get('app.bsky.labeler.getServices', {
		signal: ctx.signal,
		params: {
			dids: [did],
			detailed: true,
		},
	});

	const result = response.data.views[0] as AppBskyLabelerDefs.LabelerViewDetailed;

	if (!result) {
		throw new XRPCError(400, { kind: 'NotFound', message: `Service not found: ${did}` });
	}

	return interpretServiceDefinition(result);
};
