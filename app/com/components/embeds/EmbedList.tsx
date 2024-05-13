import type { JSX } from 'solid-js';

import type { AppBskyGraphDefs } from '~/api/atp-schema';
import { renderListPurpose } from '~/api/display';
import { getRecordId } from '~/api/utils/misc';

import { Interactive } from '../../primitives/interactive';
import { LINK_LIST, Link } from '../Link';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type ListView = AppBskyGraphDefs.ListView;
type ListViewBasic = AppBskyGraphDefs.ListViewBasic;

export interface EmbedListProps {
	list: ListView;
}

export interface EmbedListContentProps {
	list: ListView | ListViewBasic;
}

const embedListInteractive = Interactive({ variant: 'muted', class: `w-full rounded-md` });

export const EmbedListContent = (props: EmbedListContentProps) => {
	return (() => {
		const list = props.list;

		const purpose = renderListPurpose(list.purpose);

		return (
			<div class="flex gap-3 rounded-md border border-divider p-3 text-sm">
				<img
					src={/* @once */ list.avatar || DefaultListAvatar}
					class="mt-0.5 h-9 w-9 rounded-md object-cover"
				/>

				<div>
					<p class="font-bold">{/* @once */ list.name}</p>
					<p class="text-muted-fg">{
						/* @once */ `${purpose}${'creator' in list ? ` by ${list.creator.handle}` : ``}`
					}</p>
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
