import type { JSX } from 'solid-js';

import type { UnionOf } from '~/api/atp-schema.ts';
import { renderListPurpose } from '~/api/display.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_LIST, Link } from '../Link.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type EmbeddedList = UnionOf<'app.bsky.graph.defs#listView'>;

export interface EmbedListProps {
	list: EmbeddedList;
}

const embedListInteractive = Interactive({ variant: 'muted', class: `w-full rounded-md` });

export const EmbedListContent = (props: EmbedListProps) => {
	return (() => {
		const list = props.list;
		const creator = list.creator;

		const purpose = renderListPurpose(list.purpose);

		return (
			<div class="flex gap-3 rounded-md border border-divider p-3 text-sm">
				<img
					src={/* @once */ list.avatar || DefaultListAvatar}
					class="mt-0.5 h-9 w-9 rounded-md object-cover"
				/>

				<div>
					<p class="font-bold">{/* @once */ list.name}</p>
					<p class="text-muted-fg">{/* @once */ `${purpose} by @${creator.handle}`}</p>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedList = (props: EmbedListProps) => {
	return (() => {
		const list = props.list;
		const creator = list.creator;

		return (
			<Link
				to={{ type: LINK_LIST, actor: creator.did, rkey: getRecordId(list.uri) }}
				class={embedListInteractive}
			>
				{/* @once */ EmbedListContent(props)}
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default EmbedList;
