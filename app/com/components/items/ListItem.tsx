import type { JSX } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedList } from '~/api/stores/lists.ts';

import { LINK_LIST, Link } from '../Link.tsx';

import DefaultFeedAvatar from '../../assets/default-feed-avatar.svg?url';

export interface ListItemProps {
	list: SignalizedList;
}

const ListItemContent = (props: ListItemProps, interactive?: boolean) => {
	return (() => {
		const list = props.list;

		return (
			<div
				class="flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/10"
				classList={{ [`hover:bg-secondary/10`]: interactive }}
			>
				<div class="flex gap-4">
					<img src={list.avatar.value || DefaultFeedAvatar} class="mt-0.5 h-9 w-9 shrink rounded-md" />

					<div class="min-w-0 grow">
						<p class="overflow-hidden text-ellipsis font-bold">{list.name.value}</p>
						<p class="text-muted-fg">{`by ${list.creator.handle.value}`}</p>
					</div>
				</div>

				<div class="max-w-full whitespace-pre-wrap break-words text-sm empty:hidden">
					{list.description.value}
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const ListItem = (props: ListItemProps) => {
	return (() => {
		const list = props.list;

		return (
			<Link to={{ type: LINK_LIST, actor: list.creator.did, rkey: getRecordId(list.uri) }} class="contents">
				{/* @once */ ListItemContent(props)}
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default ListItem;
