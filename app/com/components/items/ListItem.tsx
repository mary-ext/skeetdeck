import type { JSX } from 'solid-js';

import { renderListPurpose } from '~/api/display';
import { getRecordId } from '~/api/utils/misc';

import type { SignalizedList } from '~/api/stores/lists';

import { Interactive } from '../../primitives/interactive';

import { LINK_LIST, Link } from '../Link';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

export interface ListItemProps {
	list: SignalizedList;
}

const listItemInteractive = Interactive({ variant: 'muted', class: 'w-full' });

const ListItemContent = (props: ListItemProps) => {
	return (() => {
		const list = props.list;

		return (
			<div class="flex gap-3 px-4 py-3">
				<img src={list.avatar.value || DefaultListAvatar} class="h-12 w-12 shrink-0 rounded-md" />

				<div class="flex min-w-0 grow flex-col gap-1">
					<div class="my-auto min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{list.name.value}</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							{`${renderListPurpose(list.purpose.value)} by @${list.creator.handle.value}`}
						</p>
					</div>

					<div class="line-clamp-3 break-words text-sm empty:hidden">{list.description.value}</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const ListItem = (props: ListItemProps) => {
	return (() => {
		const list = props.list;

		return (
			<Link
				to={{ type: LINK_LIST, actor: list.creator.did, rkey: getRecordId(list.uri) }}
				class={listItemInteractive}
			>
				{/* @once */ ListItemContent(props)}
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default ListItem;
