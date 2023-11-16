import { Match, Switch, createSignal } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import { getSuggestedFollows, getSuggestedFollowsKey } from '~/api/queries/get-suggested-follows.ts';
import { searchProfiles, searchProfilesKey } from '~/api/queries/search-profiles.ts';

import { PaneType, ProfilePaneTab, type ProfilePaneConfig } from '~/desktop/globals/panes.ts';

import { DialogBody } from '~/com/primitives/dialog.ts';

import SearchInput from '~/com/components/inputs/SearchInput.tsx';

import type { ProfileItemProps } from '~/com/components/items/ProfileItem.tsx';
import ProfileList from '~/com/components/lists/ProfileList.tsx';

import type { PaneCreatorProps } from './types.ts';

const ProfilePaneCreator = (props: PaneCreatorProps) => {
	const [search, setSearch] = createSignal('');

	const handleItemClick: ProfileItemProps['onClick'] = (profile, alt) => {
		if (alt) {
			return;
		}

		props.onAdd<ProfilePaneConfig>({
			type: PaneType.PROFILE,
			profile: {
				did: profile.did,
				handle: profile.handle.value,
			},
			tab: ProfilePaneTab.POSTS,
			tabVisible: true,
		});
	};

	return (
		<div class={/* @once */ DialogBody({ padded: false, scrollable: true })}>
			<div class="flex gap-4 p-4">
				<SearchInput
					onKeyDown={(ev) => {
						if (ev.key === 'Enter') {
							setSearch(ev.currentTarget.value.trim());
						}
					}}
				/>
			</div>

			<Switch>
				<Match when={search()}>
					{(_value) => {
						const profiles = createInfiniteQuery(() => ({
							queryKey: searchProfilesKey(props.uid, search()),
							queryFn: searchProfiles,
							initialPageParam: undefined,
							getNextPageParam: (last) => last.cursor,
						}));

						return (
							<>
								<p class="-mt-1 px-4 pb-2 text-sm text-muted-fg">
									Searching for "<span class="whitespace-pre-wrap break-words">{search()}</span>"
								</p>

								<ProfileList
									uid={props.uid}
									profiles={profiles.data?.pages.flatMap((page) => page.profiles)}
									fetching={profiles.isFetching}
									error={profiles.error}
									hasMore={profiles.hasNextPage}
									onRetry={() => {
										if (profiles.isRefetchError || profiles.isLoadingError) {
											profiles.refetch();
										} else {
											profiles.fetchNextPage();
										}
									}}
									onLoadMore={() => profiles.fetchNextPage()}
									onItemClick={handleItemClick}
								/>
							</>
						);
					}}
				</Match>

				<Match when>
					{(_value) => {
						const profiles = createInfiniteQuery(() => ({
							queryKey: getSuggestedFollowsKey(props.uid),
							queryFn: getSuggestedFollows,
							initialPageParam: undefined,
							getNextPageParam: (last) => last.cursor,
						}));

						return (
							<ProfileList
								uid={props.uid}
								profiles={profiles.data?.pages.flatMap((page) => page.profiles)}
								fetching={profiles.isFetching}
								error={profiles.error}
								hasMore={profiles.hasNextPage}
								onRetry={() => {
									if (profiles.isRefetchError || profiles.isLoadingError) {
										profiles.refetch();
									} else {
										profiles.fetchNextPage();
									}
								}}
								onLoadMore={() => profiles.fetchNextPage()}
								onItemClick={handleItemClick}
							/>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
};

export default ProfilePaneCreator;
