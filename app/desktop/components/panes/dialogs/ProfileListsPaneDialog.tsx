import { createInfiniteQuery, createQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists';

import List from '~/com/components/List';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import ListItem from '~/com/components/items/ListItem';

import { usePaneContext } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

export interface ProfileListsPaneDialogProps {
	/** Expected to be static */
	actor: At.DID;
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

	const lists = createInfiniteQuery(() => {
		return {
			queryKey: getProfileListsKey(pane.uid, props.actor),
			queryFn: getProfileLists,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
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
				<List
					data={lists.data?.pages.flatMap((page) => page.feeds)}
					error={lists.error}
					render={(list) => {
						return (
							<VirtualContainer estimateHeight={96}>
								<ListItem list={list} />
							</VirtualContainer>
						);
					}}
					hasNextPage={lists.hasNextPage}
					isFetchingNextPage={lists.isFetching}
					onEndReached={() => lists.fetchNextPage()}
				/>
			</div>
		</PaneDialog>
	);
};

export default ProfileListsPaneDialog;
