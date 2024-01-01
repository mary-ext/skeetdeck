import { For, createMemo } from 'solid-js';

import { Key } from '@solid-primitives/keyed';

import type { DID, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import type { SignalizedThread } from '~/api/models/threads.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { Link, LINK_POST } from '../../Link.tsx';
import { VirtualContainer } from '../../VirtualContainer.tsx';

import EmbedRecordNotFound from '../../embeds/EmbedRecordNotFound.tsx';
import Post from '../../items/Post.tsx';

export interface FlattenedThreadProps {
	replies: SignalizedThread['replies'];
	/** Expected to be static */
	maxDepth: number;
}

const FlattenedThread = (props: FlattenedThreadProps) => {
	const maxDepth = props.maxDepth;

	return (
		<Key each={props.replies} by={(v) => (v.$type === 'thread' ? v.post : v.$type)}>
			{(children) => {
				const slice = createMemo(() => {
					const array: Array<SignalizedPost | UnionOf<'app.bsky.feed.defs#blockedPost'>> = [];

					let overflowing = false;
					let depth = 0;
					let curr: SignalizedThread | UnionOf<'app.bsky.feed.defs#blockedPost'> | undefined = children();

					while (curr) {
						if (++depth > maxDepth) {
							overflowing = true;
							break;
						}

						if (curr.$type !== 'thread') {
							array.push(curr);
							break;
						}

						array.push(curr.post);
						curr = curr.replies?.[0];
					}

					return {
						overflowing: overflowing,
						items: array,
					};
				});

				return (
					<>
						<For each={slice().items}>
							{(item, idx) => {
								if ('$type' in item) {
									if (item.$type === 'app.bsky.feed.defs#blockedPost') {
										<div class="border-b border-divider p-3">
											<EmbedRecordNotFound />
										</div>;
									}

									return null;
								}

								return (
									<VirtualContainer estimateHeight={98.8}>
										<Post
											post={item}
											interactive
											prev
											next={(() => {
												const $slice = slice();
												return $slice.overflowing || idx() !== $slice.items.length - 1;
											})()}
										/>
									</VirtualContainer>
								);
							}}
						</For>

						{slice().overflowing && (
							<Link
								to={(() => {
									const items = slice().items;
									const len = items.length;

									return {
										type: LINK_POST,
										actor: getRepoId(items[len - 1].uri) as DID,
										rkey: getRecordId(items[len - 1].uri),
									};
								})()}
								class="flex h-10 w-full items-center gap-3 border-b border-divider px-4 hover:bg-secondary/10"
							>
								<div class="flex h-full w-10 justify-center">
									<div class="mb-3 border-l-2 border-dashed border-divider" />
								</div>
								<span class="text-sm text-accent">Continue thread</span>
							</Link>
						)}
					</>
				);
			}}
		</Key>
	);
};

export default FlattenedThread;
