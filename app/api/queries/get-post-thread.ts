import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { AppBskyFeedDefs, At } from '../atp-schema';
import { multiagent } from '../globals/agent';

import { type ThreadData, createThreadData } from '../models/threads';
import { getCachedPost } from '../stores/posts';

import _getDid from './_did';

export class BlockedThreadError extends Error {
	constructor(public view: AppBskyFeedDefs.BlockedPost) {
		super();
		this.name = 'BlockedThreadError';
	}
}

export const getPostThreadKey = (uid: At.DID, actor: string, post: string, depth: number, height: number) =>
	['getPostThread', uid, actor, post, depth, height] as const;
export const getPostThread = async (ctx: QC<ReturnType<typeof getPostThreadKey>>) => {
	const [, uid, actor, rkey, depth, height] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent.rpc, actor);

	const uri = `at://${did}/app.bsky.feed.post/${rkey}`;
	const response = await agent.rpc.get('app.bsky.feed.getPostThread', {
		signal: ctx.signal,
		params: {
			uri: uri,
			depth: depth,
			parentHeight: height,
		},
	});

	const data = response.data;

	switch (data.thread.$type) {
		case 'app.bsky.feed.defs#blockedPost':
			throw new BlockedThreadError(data.thread);
		case 'app.bsky.feed.defs#notFoundPost':
			throw new Error(`Post not found`);
		case 'app.bsky.feed.defs#threadViewPost':
			return createThreadData(uid, data.thread, depth, height);
	}
};

export const getInitialPostThread = (key: ReturnType<typeof getPostThreadKey>): ThreadData | undefined => {
	const [, uid, actor, rkey, maxDepth, maxHeight] = key;

	const post = getCachedPost(uid, `at://${actor}/app.bsky.feed.post/${rkey}`);

	if (post) {
		/** This array needs to be reversed at the end */
		const ancestors: ThreadData['ancestors'] = [];

		let curr = post;
		let height = 0;
		while (curr) {
			const record = curr.record.peek();
			const reply = record.reply;

			if (!reply) {
				break;
			}

			if (++height > maxHeight) {
				ancestors.push({ $type: 'overflow', uri: curr.uri });
				break;
			}

			const parentUri = reply.parent.uri;
			const parent = getCachedPost(uid, parentUri);

			if (!parent) {
				break;
			}

			ancestors.push((curr = parent));
		}

		return {
			post: post,

			ancestors: ancestors.reverse(),
			descendants: [],

			maxHeight: maxHeight,
			maxDepth: maxDepth,
		};
	}
};
