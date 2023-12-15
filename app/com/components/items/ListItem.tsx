import type { JSX } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';
import { renderListPurposeLabel } from '~/api/display.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_LIST, Link } from '../Link.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

export interface ListItemProps {
	list: RefOf<'app.bsky.graph.defs#listView'>;
}

const listItemInteractive = Interactive({ variant: 'muted', class: 'w-full' });

const ListItemContent = (props: ListItemProps) => {
	// nothing is interactive here, and this isn't something that changes often,
	// so let's put it under one single render effect.
	return (() => {
		const list = props.list;
		const purpose = renderListPurposeLabel(list.purpose);

		return (
			<div class="flex gap-3 px-4 py-3 text-left">
				<img src={/* @once */ list.avatar || DefaultListAvatar} class="h-12 w-12 shrink-0 rounded-md" />

				<div class="flex min-w-0 grow flex-col gap-1">
					<div class="my-auto min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{/* @once */ list.name}</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							{/* @once */ `${purpose} by @${list.creator.handle}`}
						</p>
					</div>

					<div class="line-clamp-3 break-words text-sm empty:hidden">{/* @once */ list.description}</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const ListItem = (props: ListItemProps) => {
	// we don't want the user to suddenly lose focus on this link
	const list = () => props.list;

	return (
		<Link
			to={{ type: LINK_LIST, actor: list().creator.did, rkey: getRecordId(list().uri) }}
			class={listItemInteractive}
		>
			{/* @once */ ListItemContent(props)}
		</Link>
	);
};

export default ListItem;
