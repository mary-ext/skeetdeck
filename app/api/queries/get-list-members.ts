import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID, Records } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';
import { getRepoId } from '../utils/misc.ts';

import { type SignalizedProfile, mergeProfile } from '../stores/profiles.ts';

import { fetchProfileBatched } from './get-profile.ts';

export interface RawListItem {
	uri: string;
	subject: DID;
}

export interface ListMember {
	profile: SignalizedProfile;
}
export interface SelfListMember {
	uri: string;
	subject: DID;
	profile: SignalizedProfile | undefined;
}

export interface ListMembersPageCursor {
	key: string | null;
	remaining: RawListItem[];
}

export interface ListMembersPage {
	cursor: ListMembersPageCursor | undefined;
	members: Array<ListMember | SelfListMember>;
}

export const getListMembersKey = (uid: DID, uri: string, limit = 25) => {
	return ['getListMembers', uid, uri, limit] as const;
};
export const getListMembers = async (
	ctx: QC<ReturnType<typeof getListMembersKey>, ListMembersPageCursor | undefined>,
) => {
	const [, uid, uri, limit] = ctx.queryKey;
	const param = ctx.pageParam;

	const agent = await multiagent.connect(uid);
	const actor = getRepoId(uri);

	if (actor !== uid) {
		const response = await agent.rpc.get('app.bsky.graph.getList', {
			signal: ctx.signal,
			params: {
				list: uri,
				limit: limit,
				cursor: param?.key || undefined,
			},
		});

		const data = response.data;
		const cursor = data.cursor;
		const profiles = data.items.map((item): ListMember => ({ profile: mergeProfile(uid, item.subject) }));

		const page: ListMembersPage = {
			cursor: cursor ? { key: cursor, remaining: [] } : undefined,
			members: profiles,
		};

		return page;
	} else {
		let attempts = 0;
		let cursor: string | undefined | null;
		let listItems: RawListItem[] = [];

		if (param) {
			cursor = param.key;
			listItems = param.remaining;
		}

		// We don't have enough list item records to fulfill this request...
		while (cursor !== null && listItems.length < limit) {
			const response = await agent.rpc.get('com.atproto.repo.listRecords', {
				params: {
					repo: actor,
					collection: 'app.bsky.graph.listitem',
					limit: 100,
					cursor: cursor || undefined,
				},
			});

			const data = response.data;
			const records = data.records;

			const items: RawListItem[] = [];

			for (let idx = 0, len = records.length; idx < len; idx++) {
				const record = records[idx];
				const value = record.value as Records['app.bsky.graph.listitem'];

				if (value.list !== uri) {
					continue;
				}

				items.push({ uri: record.uri, subject: value.subject });
			}

			listItems = listItems.concat(items);
			cursor = data.cursor || null;

			// Give up after 5 attempts
			if (++attempts >= 5) {
				break;
			}
		}

		const fetches = listItems.slice(0, limit);
		const remaining = listItems.slice(limit);

		const promises: Promise<SelfListMember>[] = [];

		for (let idx = 0, len = fetches.length; idx < len; idx++) {
			const { uri, subject } = fetches[idx];
			const request = fetchProfileBatched([uid, subject]);

			promises.push(
				request.then(
					(value) => ({ uri: uri, subject: subject, profile: mergeProfile(uid, value) }),
					(_err) => ({ uri: uri, subject: subject, profile: undefined }),
				),
			);
		}

		const members = await Promise.all(promises);

		const page: ListMembersPage = {
			cursor: cursor || remaining.length > 0 ? { key: cursor || null, remaining: remaining } : undefined,
			members: members,
		};

		return page;
	}
};
