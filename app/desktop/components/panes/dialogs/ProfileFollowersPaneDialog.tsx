import { createMemo } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import {
	getInitialProfileFollowers,
	getProfileFollowers,
	getProfileFollowersKey,
} from '~/api/queries/get-profile-followers.ts';

import ProfileList from '~/com/components/lists/ProfileList.tsx';
import { LINK_PROFILE, useLinking } from '~/com/components/Link.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfileFollowersPaneDialogProps {
	/** Expected to be static */
	actor: DID;
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
