import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID, Records } from '../atp-schema';
import { multiagent } from '../globals/agent';

const PAGE_LIMIT = 1_000;
const PAGE_SIZE = 100;

// Memberships is expensive to query, because we have to crawl through the
// user's entire listitem collection.
export const listMembershipsOptions = {
	staleTime: 1_000 * 60 * 5, // 5 minutes
	gcTime: 1_000 * 60 * 10, // 10 minutes
};

export interface ListMembership {
	actor: DID;
	itemUri: string;
	listUri: string;
}

export const getListMembershipsKey = (uid: DID) => {
	return ['getListMemberships', uid] as const;
};
export const getListMemberships = async (ctx: QC<ReturnType<typeof getListMembershipsKey>>) => {
	const [, uid] = ctx.queryKey;
	const signal = ctx.signal;

	const agent = await multiagent.connect(uid);
	const memberships: ListMembership[] = [];

	let cursor: string | undefined;
	for (let i = 0; i < PAGE_LIMIT; i++) {
		const response = await agent.rpc.get('com.atproto.repo.listRecords', {
			signal: signal,
			params: {
				repo: uid,
				collection: 'app.bsky.graph.listitem',
				limit: PAGE_SIZE,
				cursor: cursor,
			},
		});

		const data = response.data;
		const items = data.records;

		for (let j = 0, jl = items.length; j < jl; j++) {
			const item = items[j];
			const record = item.value as Records['app.bsky.graph.listitem'];

			memberships.push({ actor: record.subject, listUri: record.list, itemUri: item.uri });
		}

		cursor = data.cursor;

		// Should be safe to break if the response returns less than what we requested,
		// `listRecords` shouldn't be doing any filtering.
		if (!cursor || items.length < PAGE_SIZE) {
			break;
		}
	}

	return memberships;
};

export const findMembership = (memberships: ListMembership[], listUri: string, actor: DID): number | null => {
	for (let i = 0, il = memberships.length; i < il; i++) {
		const membership = memberships[i];

		if (membership.actor === actor && membership.listUri === listUri) {
			return i;
		}
	}

	return null;
};
