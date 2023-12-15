import type { RefOf } from '~/api/atp-schema.ts';

import { LINK_PROFILE, useLinking } from '~/com/components/Link.tsx';

import ListMembersList from '~/com/components/lists/ListMembersList.tsx';

import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';
import { usePaneContext } from '../PaneContext.tsx';

export interface ListMembersPaneDialogProps {
	// Expected to be static
	list: RefOf<'app.bsky.graph.defs#listView'>;
}

const ListMembersPaneDialog = (props: ListMembersPaneDialogProps) => {
	const { pane } = usePaneContext();
	const linking = useLinking();

	const list = props.list;

	return (
		<PaneDialog>
			<PaneDialogHeader title="List members" subtitle={/* @once */ list.name} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ListMembersList
					uid={pane.uid}
					uri={/* @once */ list.uri}
					onClick={(profile) => {
						linking.navigate({ type: LINK_PROFILE, actor: profile.did });
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default ListMembersPaneDialog;
