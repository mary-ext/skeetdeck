import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import ListList from '~/com/components/lists/ListList.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfileListsPaneDialogProps {
	/** Expected to be static */
	actor: DID;
}

const ProfileListsPaneDialog = (props: ProfileListsPaneDialogProps) => {
	const { actor } = props;

	const { pane } = usePaneContext();

	const profile = createQuery(() => {
		// @todo: shouldn't be necessary to put initialData for this one I think?
		return {
			queryKey: getProfileKey(pane.uid, actor),
			queryFn: getProfile,
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={`Lists`}
				subtitle={(() => {
					const $subject = profile.data;

					if ($subject) {
						return `@${$subject.handle.value}`;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ListList uid={pane.uid} actor={actor} />
			</div>
		</PaneDialog>
	);
};

export default ProfileListsPaneDialog;
