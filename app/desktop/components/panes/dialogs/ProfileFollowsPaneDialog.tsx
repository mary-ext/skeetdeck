import { createMemo } from 'solid-js';

import { createInfiniteQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';
import {
	getInitialProfileFollows,
	getProfileFollows,
	getProfileFollowsKey,
} from '~/api/queries/get-profile-follows';

import { getModerationOptions } from '~/com/globals/shared';

import { LINK_PROFILE, useLinking } from '~/com/components/Link';
import { ProfileFollowAccessory } from '~/com/components/items/ProfileItem';
import ProfileList from '~/com/components/lists/ProfileList';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface ProfileFollowsPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
}

const ProfileFollowsPaneDialog = (props: ProfileFollowsPaneDialogProps) => {
	const { actor } = props;

	const linking = useLinking();
	const { pane } = usePaneContext();

	const follows = createInfiniteQuery(() => {
		const key = getProfileFollowsKey(pane.uid, actor);

		return {
			queryKey: key,
			queryFn: getProfileFollows,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData: () => getInitialProfileFollows(key),
			meta: {
				moderation: getModerationOptions(),
			},
		};
	});

	const subject = createMemo(() => {
		return follows.data?.pages[0].subject;
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={`Follows`}
				subtitle={(() => {
					const $subject = subject();

					if ($subject) {
						return `@${$subject.handle.value}`;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ProfileList
					query={follows}
					asideAccessory={ProfileFollowAccessory}
					onItemClick={(profile, alt) => {
						if (alt) {
							return;
						}

						linking.navigate({ type: LINK_PROFILE, actor: profile.did });
					}}
				/>
			</div>
		</PaneDialog>
	);
};

export default ProfileFollowsPaneDialog;
