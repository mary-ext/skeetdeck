import { XRPCError } from '@atcute/client';
import type { AppBskyLabelerDefs, At } from '@atcute/client/lexicons';
import type { QueryFunctionContext as QC } from '@mary/solid-query';

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
		throw new XRPCError(400, { kind: 'NotFound', description: `Service not found: ${did}` });
	}

	return interpretServiceDefinition(result);
};
