import { Show } from 'solid-js';

import type { UnionOf } from '~/api/atp-schema.ts';
import { ListPurposeLabels } from '~/api/display.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Link, LinkingType } from '../Link.tsx';

type EmbeddedList = UnionOf<'app.bsky.graph.defs#listView'>;

export interface EmbedListProps {
	list: EmbeddedList;
}

const EmbedList = (props: EmbedListProps) => {
	const list = () => props.list;

	const purpose = () => {
		const raw = list().purpose;
		return raw in ListPurposeLabels ? ListPurposeLabels[raw] : `Unknown list`;
	};

	return (
		<Link
			to={{ type: LinkingType.PROFILE_LIST, actor: list().creator.did, rkey: getRecordId(list().uri) }}
			class="flex flex-col gap-2 rounded-md border border-divider p-3 text-left text-sm hover:bg-secondary"
		>
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
					{(() => {
						const avatar = list().avatar;

						if (avatar) {
							return <img src={avatar} class="h-full w-full" />;
						}
					})()}
				</div>

				<div>
					<p class="font-bold">{list().name}</p>
					<p class="text-muted-fg">
						{purpose()} by @{list().creator.handle}
					</p>
				</div>
			</div>
		</Link>
	);
};

export default EmbedList;
