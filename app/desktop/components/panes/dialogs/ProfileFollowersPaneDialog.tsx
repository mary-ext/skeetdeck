import { createMemo } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';

import {
	getInitialProfileFollowers,
	getProfileFollowers,
	getProfileFollowersKey,
} from '~/api/queries/get-profile-followers';

import { getModerationOptions } from '~/com/globals/shared';

import { ProfileFollowAccessory } from '~/com/components/items/ProfileItem';
import ProfileList from '~/com/components/lists/ProfileList';
import { LINK_PROFILE, useLinking } from '~/com/components/Link';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface ProfileFollowersPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
}

const ProfileFollowersPaneDialog = (props: ProfileFollowersPaneDialogProps) => {
	const { actor } = props;

	const linking = useLinking();
	const { pane } = usePaneContext();

	const followers = createInfiniteQuery(() => {
		const key = getProfileFollowersKey(pane.uid, actor);

		return {
			queryKey: key,
			queryFn: getProfileFollowers,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
			placeholderData: () => getInitialProfileFollowers(key),
			meta: {
				moderation: getModerationOptions(),
			},
		};
	});

	const subject = createMemo(() => {
		return followers.data?.pages[0].subject;
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={`Followers`}
				subtitle={(() => {
					const $subject = subject();

					if ($subject) {
						return `@${$subject.handle.value}`;
					}
				})()}
			/>

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
				<ProfileList
					asideAccessory={ProfileFollowAccessory}
					profiles={followers.data?.pages.flatMap((page) => page.profiles)}
					fetching={followers.isFetching}
					error={followers.error}
					hasMore={followers.hasNextPage}
					onRetry={() => followers.fetchNextPage()}
					onLoadMore={() => followers.fetchNextPage()}
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

export default ProfileFollowersPaneDialog;
