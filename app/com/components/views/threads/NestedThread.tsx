import { For, type JSX } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import { LineType, type ThreadData, type ThreadItem } from '~/api/models/threads';

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
							{/* @once */ renderLines(x)}
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
			<div class="mb-2 mt-1 flex h-5 items-center gap-2 text-sm text-muted-fg">
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

const renderLines = (x: ThreadItem) => {
	const nodes: JSX.Element = [];
	const lines = x.lines;

	for (let idx = 0, len = lines.length; idx < len; idx++) {
		const line = lines[idx];

		const drawVertical = line === LineType.VERTICAL || line === LineType.VERTICAL_RIGHT;
		const drawRight = line === LineType.UP_RIGHT || line === LineType.VERTICAL_RIGHT;

		nodes.push(
			<div class="relative w-5 shrink-0">
				{drawRight && (
					<div class="absolute right-[4px] top-0 h-[18px] w-[9px] rounded-bl-[8px] border-b-2 border-l-2 border-muted"></div>
				)}
				{drawVertical && <div class="absolute bottom-0 left-[8px] top-0 border-l-2 border-muted"></div>}
			</div>,
		);
	}

	return nodes;
};
