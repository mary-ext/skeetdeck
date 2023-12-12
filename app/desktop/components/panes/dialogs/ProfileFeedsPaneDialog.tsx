import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import FeedList from '~/com/components/lists/FeedList.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfileFeedsPaneDialogProps {
	/** Expected to be static */
	actor: DID;
}

const ProfileFeedsPaneDialog = (props: ProfileFeedsPaneDialogProps) => {
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
				title={`Feeds`}
				subtitle={(() => {
					const $subject = profile.data;

					if ($subject) {
						return `@${$subject.handle.value}`;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<FeedList uid={pane.uid} actor={actor} />
			</div>
		</PaneDialog>
	);
};

export default ProfileFeedsPaneDialog;
