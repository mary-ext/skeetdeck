import { type JSX, For } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import type { ThreadData, ThreadItem } from '~/api/models/threads.ts';

import { LINK_POST, Link } from '../../Link.tsx';
import { VirtualContainer } from '../../VirtualContainer.tsx';

import ArrowLeftIcon from '../../../icons/baseline-arrow-left.tsx';

import PostTreeItem from '../../items/PostTreeItem.tsx';

export interface NestedThreadProps {
	data: ThreadData;
}

const NestedThread = (props: NestedThreadProps) => {
	return (
		<div class="flex flex-col gap-4 px-3 py-4 empty:hidden">
			<For each={props.data.descendants}>
				{(x) => {
					return (
						<VirtualContainer estimateHeight={66} class="flex min-w-0">
							{/* @once */ renderLines(x.depth /* , x.hasNextSibling */)}
							<div class="min-w-0 grow">{/* @once */ renderItem(x)}</div>
						</VirtualContainer>
					);
				}}
			</For>
		</div>
	);
};

export default NestedThread;

const renderItem = (x: ThreadItem) => {
	const type = x.type;

	if (type === 'post') {
		return <PostTreeItem post={/* @once */ x.item} hasChildren={/* @once */ !x.isEnd} />;
	}

	if (type === 'overflow') {
		const uri = x.parentUri;

		const actor = getRepoId(uri) as DID;
		const rkey = getRecordId(uri);

		return (
			<div class="flex h-5 items-center gap-2 text-sm text-muted-fg">
				<div class="grid h-5 w-5 place-items-center rounded-full border-2 border-divider">
					<ArrowLeftIcon class="rotate-180" />
				</div>

				<Link to={{ type: LINK_POST, actor: actor, rkey: rkey }} class="text-accent hover:underline">
					show more
				</Link>
			</div>
		);
	}

	if (type === 'block') {
		const uri = x.item.uri;

		const actor = getRepoId(uri) as DID;
		const rkey = getRecordId(uri);

		return (
			<div class="flex h-5 items-center gap-2 text-sm text-muted-fg">
				<div class="h-5 w-5 rounded-full bg-muted"></div>
				<span>blocked post.</span>
				<Link to={{ type: LINK_POST, actor: actor, rkey: rkey }} class="text-accent hover:underline">
					view
				</Link>
			</div>
		);
	}

	return null;
};

const renderLines = (depth: number /* , hasNextSibling: boolean */) => {
	const nodes: JSX.Element = [];

	for (let i = 0; i < depth /* - 1 */; i++) {
		nodes.push(
			<div class="relative pl-5">
				<div class="absolute -top-4 bottom-0 left-2 border-l-2 border-muted"></div>

				{i === depth - 1 && (
					<div class="absolute right-0.5 top-[-1rem] h-[1.625rem] w-[0.625rem] rounded-bl-[0.5rem] border-b-2 border-l-2 border-muted"></div>
				)}
			</div>,
		);
	}

	// if (depth > 0) {
	// 	nodes.push(
	// 		<div class="relative w-5 shrink-0">
	// 			<div class="absolute right-0.5 top-[-1rem] h-[1.625rem] w-[0.5625rem] rounded-bl-[0.5rem] border-b-2 border-l-2 border-divider"></div>
	// 			{hasNextSibling && <div class="absolute bottom-0 top-0 left-[0.5625rem] border-l-2 border-divider"></div>}
	// 		</div>,
	// 	);
	// }

	return nodes;
};
