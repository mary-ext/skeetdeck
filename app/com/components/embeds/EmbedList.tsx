import type { JSX } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';
import { renderListPurposeLabel } from '~/api/display.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_LIST, Link } from '../Link.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type ListView = RefOf<'app.bsky.graph.defs#listView'>;
type ListViewBasic = RefOf<'app.bsky.graph.defs#listViewBasic'>;

export interface EmbedListProps {
	list: ListView;
}

export interface EmbedListContentProps {
	list: ListView | ListViewBasic;
}

const embedListInteractive = Interactive({ variant: 'muted', class: 'w-full' });

export const EmbedListContent = (props: EmbedListContentProps) => {
	// nothing is interactive here, and this isn't something that changes often,
	// so let's put it under one single render effect.
	return (() => {
		const list = props.list;

		const purpose = renderListPurposeLabel(list.purpose);

		return (
			<div class="flex flex-col gap-2 rounded-md border border-divider p-3 text-left text-sm">
				<div class="flex gap-3">
					<img
						src={/* @once */ list.avatar || DefaultListAvatar}
						class="mt-0.5 h-9 w-9 rounded-md object-cover"
					/>

					<div>
						<p class="font-bold">{/* @once */ list.name}</p>
						<p class="text-muted-fg">
							{/* @once */ purpose + ('creator' in list ? ` by ${list.creator.handle}` : ``)}
						</p>
					</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedList = (props: EmbedListProps) => {
	// we don't want the user to suddenly lose focus on this link
	const list = () => props.list;

	return (
		<Link
			to={{ type: LINK_LIST, actor: list().creator.did, rkey: getRecordId(list().uri) }}
			class={embedListInteractive}
		>
			{/* @once */ EmbedListContent(props)}
		</Link>
	);
};

export default EmbedList;
