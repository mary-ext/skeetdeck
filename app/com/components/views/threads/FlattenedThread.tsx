import { type Signal, For, createMemo, createSignal } from 'solid-js';

import type { DID, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import type { SignalizedThread } from '~/api/models/threads.ts';
import { SignalizedPost } from '~/api/stores/posts.ts';

import { dequal } from '~/utils/dequal.ts';

import { Link, LINK_POST } from '../../Link.tsx';
import { VirtualContainer } from '../../VirtualContainer.tsx';

import EmbedRecordNotFound from '../../embeds/EmbedRecordNotFound.tsx';
import Post from '../../items/Post.tsx';

export interface FlattenedThreadProps {
	replies: SignalizedThread['replies'];
	/** Expected to be static */
	maxDepth: number;
}

interface OverflowItem {
	$type: 'overflow';
	actor: DID;
	rkey: string;
}

interface TreeInfo {
	next: boolean;
}

const FlattenedThread = (props: FlattenedThreadProps) => {
	const maxDepth = props.maxDepth;

	const wm = new WeakMap<SignalizedPost, Signal<TreeInfo>>();
	const items = createMemo(() => {
		const replies = props.replies;
		let items: Array<SignalizedPost | OverflowItem | UnionOf<'app.bsky.feed.defs#blockedPost'>> = [];

		if (replies) {
			for (let i = 0, il = replies.length; i < il; i++) {
				const root = replies[i];
				const array: Array<SignalizedPost | OverflowItem | UnionOf<'app.bsky.feed.defs#blockedPost'>> = [];

				let overflowing = false;
				let depth = 0;
				let curr: typeof root | undefined = root;

				while (curr) {
					if (++depth > maxDepth) {
						const last = array[array.length - 1] as
							| SignalizedPost
							| UnionOf<'app.bsky.feed.defs#blockedPost'>;

						const uri = last.uri;

						overflowing = true;
						array.push({
							$type: 'overflow',
							actor: getRepoId(uri) as DID,
							rkey: getRecordId(uri),
						});

						break;
					}

					if (curr.$type !== 'thread') {
						array.push(curr);
						break;
					}

					array.push(curr.post);
					curr = curr.replies?.[0];
				}

				for (let j = 0, jl = array.length; j < jl; j++) {
					const item = array[j];

					if (item instanceof SignalizedPost) {
						const signal = wm.get(item);

						const info: TreeInfo = { next: overflowing || j !== jl - 1 };

						if (signal !== undefined) {
							signal[1](info);
						} else {
							wm.set(item, createSignal(info, { equals: dequal }));
						}
					}
				}

				items = items.concat(array);
			}
		}

		return items;
	});

	return (
		<For each={items()}>
			{(item) => {
				if (item instanceof SignalizedPost) {
					const [info] = wm.get(item)!;

					return (
						<VirtualContainer estimateHeight={98.8}>
							<Post post={item} interactive prev next={info().next} />
						</VirtualContainer>
					);
				}

				if (item.$type === 'overflow') {
					const actor = item.actor;
					const rkey = item.rkey;

					return (
						<Link
							to={{ type: LINK_POST, actor: actor, rkey: rkey }}
							class="flex h-10 w-full items-center gap-3 border-b border-divider px-4 hover:bg-secondary/10"
						>
							<div class="flex h-full w-10 justify-center">
								<div class="mb-3 border-l-2 border-dashed border-divider" />
							</div>
							<span class="text-sm text-accent">Continue thread</span>
						</Link>
					);
				}

				if (item.$type === 'app.bsky.feed.defs#blockedPost') {
					return (
						<div class="border-b border-divider p-3">
							<EmbedRecordNotFound />
						</div>
					);
				}

				return null;
			}}
		</For>
	);
};

export default FlattenedThread;
