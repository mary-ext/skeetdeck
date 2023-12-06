import { createMemo } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';

import {
	getInitialProfileFollows,
	getProfileFollows,
	getProfileFollowsKey,
} from '~/api/queries/get-profile-follows.ts';

import ProfileList from '~/com/components/lists/ProfileList.tsx';
import { LINK_PROFILE, useLinking } from '~/com/components/Link.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfileFollowsPaneDialogProps {
	/** Expected to be static */
	actor: DID;
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
					profiles={follows.data?.pages.flatMap((page) => page.profiles)}
					fetching={follows.isFetching}
					error={follows.error}
					hasMore={follows.hasNextPage}
					onRetry={() => {
						if (follows.isRefetchError || follows.isLoadingError) {
							follows.refetch();
						} else {
							follows.fetchNextPage();
						}
					}}
					onLoadMore={() => follows.fetchNextPage()}
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
