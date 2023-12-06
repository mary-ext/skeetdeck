import type { SignalizedList } from '~/api/stores/lists.ts';

import { LINK_PROFILE, useLinking } from '~/com/components/Link.tsx';

import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

import ListMembersList from '~/com/components/lists/ListMembersList.tsx';

export interface ListMembersPaneDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const ListMembersPaneDialog = (props: ListMembersPaneDialogProps) => {
	const linking = useLinking();

	const list = props.list;

	return (
		<PaneDialog>
			<PaneDialogHeader title="List members" subtitle={list.name.value} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ListMembersList
					list={list}
					onClick={(profile) => {
						linking.navigate({ type: LINK_PROFILE, actor: profile.did });
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default ListMembersPaneDialog;
