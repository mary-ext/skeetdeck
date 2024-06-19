import { createSignal } from 'solid-js';

import { multiagent } from '../globals/agent';
import type { SignalizedPost } from '../stores/posts';

// Locally keep track of what threads have been muted/unmuted, we need this
// because it doesn't seem feasible to just mutate the entire thread for this
const [track, trigger] = createSignal(undefined, { equals: false });
const mutedThreads: Record<string, boolean | undefined> = {};

const getThreadUri = (post: SignalizedPost) => {
	return post.record.value.reply?.root.uri ?? post.uri;
};

export const isThreadMuted = (post: SignalizedPost): boolean => {
	const uri = getThreadUri(post);
	const key = `${post.uid}-${uri}`;

	track();
	return mutedThreads[key] ?? post.viewer.threadMuted.value ?? false;
};

export const updateThreadMute = async (post: SignalizedPost, mute: boolean) => {
	const uri = getThreadUri(post);
	const key = `${post.uid}-${uri}`;

	const current = mutedThreads[key] ?? post.viewer.threadMuted.value ?? false;

	if (mute === current) {
		return;
	}

	mutedThreads[key] = mute;
	trigger();

	const agent = await multiagent.connect(post.uid);

	if (mute) {
		await agent.rpc.call('app.bsky.graph.muteThread', {
			data: { root: uri },
		});
	} else {
		await agent.rpc.call('app.bsky.graph.unmuteThread', {
			data: { root: uri },
		});
	}
};
