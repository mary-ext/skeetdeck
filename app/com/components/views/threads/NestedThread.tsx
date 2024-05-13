import { For, type JSX } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import type { ThreadData, ThreadItem } from '~/api/models/threads';

import { LINK_POST, Link } from '../../Link';
import { VirtualContainer } from '../../VirtualContainer';

import ArrowLeftIcon from '../../../icons/baseline-arrow-left';

import PostTreeItem from '../../items/PostTreeItem';

export interface NestedThreadProps {
	data: ThreadData;
}

const NestedThread = (props: NestedThreadProps) => {
	return (
		<div class="flex flex-col px-3 py-2 empty:hidden">
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

		const actor = getRepoId(uri) as At.DID;
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

		const actor = getRepoId(uri) as At.DID;
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
					<div class="absolute right-0.5 top-[-8px] h-[26px] w-[10px] rounded-bl-[8px] border-b-2 border-l-2 border-muted"></div>
				)}
			</div>,
		);
	}

	// if (depth > 0) {
	// 	nodes.push(
	// 		<div class="relative w-5 shrink-0">
	// 			<div class="absolute right-0.5 top-[-16px] h-[26px] w-[9px] rounded-bl-[8px] border-b-2 border-l-2 border-divider"></div>
	// 			{hasNextSibling && <div class="absolute bottom-0 top-0 left-[9px] border-l-2 border-divider"></div>}
	// 		</div>,
	// 	);
	// }

	return nodes;
};
