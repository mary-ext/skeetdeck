import { Match, Switch, createSignal } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { formatCompact } from '~/utils/intl/number.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import ProfileHeader from '~/com/components/views/ProfileHeader.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';

import TableColumnRightAddIcon from '~/com/icons/baseline-table-column-right-add.tsx';

import { type ProfilePaneConfig, PANE_TYPE_PROFILE, ProfilePaneTab } from '../../../globals/panes.ts';
import { addPane } from '../../../globals/settings.ts';

import { usePaneContext, usePaneModalState } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfilePaneDialogProps {
	/** Expected to be static */
	actor: DID;
}

const enum ProfileTab {
	POSTS,
	POSTS_WITH_REPLIES,
	MEDIA,
	LIKES,
}

const ProfilePaneDialog = (props: ProfilePaneDialogProps) => {
	const { actor } = props;

	const { deck, pane, index } = usePaneContext();
	const modal = usePaneModalState();

	const profile = createQuery(() => {
		const key = getProfileKey(pane.uid, actor);

		return {
			queryKey: key,
			queryFn: getProfile,
			initialDataUpdatedAt: 0,
			initialData: () => getInitialProfile(key),
		};
	});

	return (
		<PaneDialog>
			<PaneDialogHeader
				title={(() => {
					const $profile = profile.data;

					if ($profile) {
						return $profile.displayName.value || `@${$profile.handle.value}`;
					}

					return `Profile`;
				})()}
				subtitle={(() => {
					const $profile = profile.data;

					if ($profile) {
						return `${formatCompact($profile.postsCount.value)} posts`;
					}

					return;
				})()}
			>
				{profile.data && (
					<>
						<button
							title="Add as column"
							onClick={() => {
								const data = profile.data!;

								addPane<ProfilePaneConfig>(
									deck,
									{
										type: PANE_TYPE_PROFILE,
										uid: pane.uid,
										profile: {
											did: data.did,
											handle: data.handle.value,
										},
										tab: ProfilePaneTab.POSTS,
										tabVisible: true,
									},
									index() + 1,
								);

								modal.close();
							}}
							class={/* @once */ IconButton({ edge: 'right' })}
						>
							<TableColumnRightAddIcon />
						</button>
					</>
				)}
			</PaneDialogHeader>

			<Switch>
				<Match when={profile.data} keyed>
					{(data) => {
						const [tab, setTab] = createSignal(ProfileTab.POSTS);

						return (
							<div class="flex min-h-0 grow flex-col overflow-y-auto">
								<VirtualContainer class="shrink-0">
									<ProfileHeader profile={data} />
								</VirtualContainer>

								{(() => {
									if (data.viewer.blockedBy.value) {
										return (
											<div class="grid grow place-items-center">
												<div class="max-w-sm p-4 py-24">
													<h1 class="mb-1 text-xl font-bold">You are blocked</h1>
													<p class="text-sm text-muted-fg">
														You can't view any of the posts if you are blocked.
													</p>
												</div>
											</div>
										);
									}

									if (data.viewer.blocking.value) {
										return (
											<div class="grid grow place-items-center">
												<div class="max-w-sm p-4 py-24">
													<h1 class="mb-1 text-xl font-bold">@{data.handle.value} is blocked</h1>
													<p class="text-sm text-muted-fg">
														You can't view any of the posts if you've blocked them.
													</p>
												</div>
											</div>
										);
									}

									return (
										<TabbedPanel selected={tab()} onChange={setTab}>
											<TabbedPanelView label="Posts" value={ProfileTab.POSTS}>
												<TimelineList
													uid={pane.uid}
													params={{ type: 'profile', actor: actor, tab: 'posts' }}
												/>
											</TabbedPanelView>
											<TabbedPanelView label="Replies" value={ProfileTab.POSTS_WITH_REPLIES}>
												<TimelineList
													uid={pane.uid}
													params={{ type: 'profile', actor: actor, tab: 'replies' }}
												/>
											</TabbedPanelView>
											<TabbedPanelView label="Media" value={ProfileTab.MEDIA}>
												<TimelineList
													uid={pane.uid}
													params={{ type: 'profile', actor: actor, tab: 'media' }}
												/>
											</TabbedPanelView>
											<TabbedPanelView label="Likes" value={ProfileTab.LIKES} hidden={pane.uid !== data.did}>
												<TimelineList
													uid={pane.uid}
													params={{ type: 'profile', actor: actor, tab: 'likes' }}
												/>
											</TabbedPanelView>
										</TabbedPanel>
									);
								})()}
							</div>
						);
					}}
				</Match>

				<Match when={profile.isLoading}>
					<div class="grid h-13 place-items-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</PaneDialog>
	);
};

export default ProfilePaneDialog;
