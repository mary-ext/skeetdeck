import type { JSX } from 'solid-js';

import type { UnionOf } from '~/api/atp-schema.ts';
import { ListPurposeLabels } from '~/api/display.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Link, LinkingType } from '../Link.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type EmbeddedList = UnionOf<'app.bsky.graph.defs#listView'>;

export interface EmbedListProps {
	list: EmbeddedList;
}

const EmbedList = (props: EmbedListProps) => {
	return (() => {
		const list = props.list;
		const creator = list.creator;

		const rawPurpose = list.purpose;
		const purpose = rawPurpose in ListPurposeLabels ? ListPurposeLabels[rawPurpose] : `Unknown list`;

		return (
			<Link
				to={{ type: LinkingType.PROFILE_LIST, actor: creator.did, rkey: getRecordId(list.uri) }}
				class="flex flex-col gap-2 rounded-md border border-divider p-3 text-left text-sm hover:bg-secondary/10"
			>
				<div class="flex gap-3">
					<img
						src={/* @once */ list.avatar || DefaultListAvatar}
						class="mt-0.5 h-9 w-9 rounded-md object-cover"
					/>

					<div>
						<p class="font-bold">{/* @once */ list.name}</p>
						<p class="text-muted-fg">{/* @once */ `${purpose} by @${creator.handle}`}</p>
					</div>
				</div>
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default EmbedList;
