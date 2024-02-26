import { For } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import type { ThreadData } from '~/api/models/threads';

import { Link, LINK_POST } from '../../Link';
import { VirtualContainer } from '../../VirtualContainer';

import EmbedRecordBlocked from '../../embeds/EmbedRecordBlocked';
import Post from '../../items/Post';

export interface FlattenedThreadProps {
	data: ThreadData;
}

const FlattenedThread = (props: FlattenedThreadProps) => {
	return (
		<For
			each={(() => {
				const descendants = props.data.descendants;

				const seen = new Set<string>();
				const array: ThreadData['descendants'] = [];

				for (let i = 0, il = descendants.length; i < il; i++) {
					const x = descendants[i];
					const parentUri = x.parentUri;

					if (x.depth === 0 || !seen.has(parentUri)) {
						seen.add(parentUri);
						array.push(x);
					} else if (x.type === 'post') {
						seen.add(x.item.uri);
					}
				}

				return array;
			})()}
		>
			{(x) => {
				const type = x.type;

				if (type === 'post') {
					const post = x.item;
					const hasNext = !x.isEnd;

					return (
						<VirtualContainer estimateHeight={98.8}>
							<Post interactive post={post} prev next={hasNext} />
						</VirtualContainer>
					);
				}

				if (type === 'overflow') {
					const uri = x.parentUri;

					const actor = getRepoId(uri) as At.DID;
					const rkey = getRecordId(uri);

					return (
						<Link
							to={{ type: LINK_POST, actor: actor, rkey: rkey }}
							class="flex h-10 w-full items-center gap-3 border-b border-divider px-4 hover:bg-secondary/10"
						>
							<div class="flex h-full w-9 justify-center">
								<div class="mb-3 border-l-2 border-dashed border-divider" />
							</div>
							<span class="text-sm text-accent">Continue thread</span>
						</Link>
					);
				}

				if (type === 'block') {
					const record = x.item;

					return (
						<div class="border-b border-divider p-3">
							<EmbedRecordBlocked record={record} />
						</div>
					);
				}

				return null;
			}}
		</For>
	);
};

export default FlattenedThread;
