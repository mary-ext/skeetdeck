import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import { type Signal, signal } from '~/utils/signals.ts';

import type { DID, Records } from '../atp-schema.ts';
import { createBatchedFetch } from '../utils/batch-fetch.ts';
import { multiagent } from '../globals/agent.ts';

type ListItem = Records['app.bsky.graph.listitem'];

type Query = [uid: DID, actor: DID, list: string];
type Key = `${DID}|${string}`;

export interface ProfileExistsResult {
	actor: DID;
	list: string;
	exists: Signal<string | undefined>;
}

export const fetchIsProfileInList = createBatchedFetch<Query, Key, ProfileExistsResult>({
	limit: 100,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => `${query[1]}|${query[2]}`,
	idFromData: (data) => `${data.actor}|${data.list}`,
	fetch: async (queries) => {
		const uid = queries[0][0];

		const agent = await multiagent.connect(uid);

		const remaining = new Map<Key, Query>();
		const results: ProfileExistsResult[] = [];

		let cursor: string | undefined;

		for (let idx = 0, len = queries.length; idx < len; idx++) {
			const query = queries[idx];
			remaining.set(`${query[1]}|${query[2]}`, query);
		}

		while (remaining.size > 0) {
			const limit = 100;

			const response = await agent.rpc.get('com.atproto.repo.listRecords', {
				params: {
					repo: uid,
					collection: 'app.bsky.graph.listitem',
					limit: limit,
					cursor: cursor,
				},
			});

			const data = response.data;
			const records = data.records;

			for (let idx = 0, len = records.length; idx < len; idx++) {
				const record = records[idx];
				const value = record.value as ListItem;

				const key: Key = `${value.subject}|${value.list}`;
				const match = remaining.get(key);

				if (match) {
					results.push({ actor: match[1], list: match[2], exists: signal<string | undefined>(record.uri) });
					remaining.delete(key);
				}
			}

			cursor = data.cursor;

			if (!cursor) {
				break;
			}
		}

		for (const query of remaining.values()) {
			results.push({ actor: query[1], list: query[2], exists: signal<string | undefined>(undefined) });
		}

		return results;
	},
});

export const getProfileInListKey = (uid: DID, actor: DID, listUrl: string) => {
	return ['getProfileInList', uid, actor, listUrl] as const;
};
export const getProfileInList = async (ctx: QC<ReturnType<typeof getProfileInListKey>>) => {
	const [, uid, actor, listUrl] = ctx.queryKey;

	const match = await fetchIsProfileInList([uid, actor, listUrl]);

	return match;
};
