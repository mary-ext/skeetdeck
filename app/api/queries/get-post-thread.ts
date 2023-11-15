import type { QueryFunctionContext as QC } from '@pkg/solid-query';

import type { DID, RefOf } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

import { type ThreadPage, createThreadPage } from '../models/thread.ts';
import { type SignalizedPost, getCachedPost } from '../stores/posts.ts';

import _getDid from './_did.ts';

export class BlockedThreadError extends Error {
	constructor(public view: RefOf<'app.bsky.feed.defs#blockedPost'>) {
		super();
		this.name = 'BlockedThreadError';
	}
}

export const getPostThreadKey = (uid: DID, actor: string, post: string, depth: number, height: number) =>
	['getPostThread', uid, actor, post, depth, height] as const;
export const getPostThread = async (ctx: QC<ReturnType<typeof getPostThreadKey>>) => {
	const [, uid, actor, rkey, depth, height] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor);

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
			return createThreadPage(uid, data.thread);
	}
};

export const getInitialPostThread = (key: ReturnType<typeof getPostThreadKey>): ThreadPage | undefined => {
	const [, uid, actor, rkey] = key;

	const post = getCachedPost(uid, `at://${actor}/app.bsky.feed.post/${rkey}`);

	if (post) {
		const ancestors: SignalizedPost[] = [];

		let current = post;
		while (current) {
			const record = current.record.peek();
			const reply = record.reply;

			if (!reply) {
				break;
			}

			const parentUri = reply.parent.uri;
			const parent = getCachedPost(uid, parentUri);

			if (!parent) {
				break;
			}

			ancestors.unshift((current = parent));
		}

		return {
			post: post,
			// @ts-expect-error
			ancestors: ancestors,
			descendants: [],
		};
	}

	return;
};
