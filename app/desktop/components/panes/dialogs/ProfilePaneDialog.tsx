import { Match, Show, Switch } from 'solid-js';

import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import button from '~/com/primitives/button.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { Link, LinkingType } from '~/com/components/Link.tsx';

import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

export interface ProfilePaneDialogProps {
	/** Expected to be static */
	actor: DID;
}

const ProfilePaneDialog = (props: ProfilePaneDialogProps) => {
	const { actor } = props;

	const { pane } = usePaneContext();

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
						return `${$profile.postsCount.value} posts`;
					}

					return;
				})()}
			/>

			<Switch>
				<Match when={profile.data} keyed>
					{(data) => {
						return (
							<>
								<Show when={data.banner.value} keyed fallback={<div class="aspect-banner bg-muted-fg"></div>}>
									{(banner) => (
										<button onClick={() => {}} class="group aspect-banner bg-background">
											<img src={banner} class="h-full w-full object-cover group-hover:opacity-75" />
										</button>
									)}
								</Show>

								<div class="z-10 flex flex-col gap-3 p-4">
									<div class="flex gap-2">
										<Show
											when={data.avatar.value}
											keyed
											fallback={
												<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline"></div>
											}
										>
											{(avatar) => (
												<button
													onClick={() => {}}
													class="group -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-background outline-2 outline-background outline focus-visible:outline-primary"
												>
													<img src={avatar} class="h-full w-full group-hover:opacity-75" />
												</button>
											)}
										</Show>

										<div class="grow" />

										<Show when={data.did !== pane.uid}>
											<button
												title="Actions"
												onClick={() => {}}
												class={/* @once */ button({ variant: 'outline' })}
											>
												<MoreHorizIcon class="-mx-1.5 text-base" />
											</button>

											<Show when={!data.viewer.blocking.value && !data.viewer.blockedBy.value}>
												{(_value) => {
													const isFollowing = () => data.viewer.following.value;

													return (
														<button
															class={/* @once */ button({ variant: isFollowing() ? 'outline' : 'primary' })}
														>
															{isFollowing() ? 'Unfollow' : 'Follow'}
														</button>
													);
												}}
											</Show>
										</Show>
									</div>

									<div>
										<p dir="auto" class="break-words text-xl font-bold">
											{data.displayName.value || data.handle.value}
										</p>
										<p class="flex items-center text-sm text-muted-fg">
											<button onClick={() => {}} class="hover:underline">
												<span class="line-clamp-1 break-all text-left">@{data.handle.value}</span>
											</button>

											<Show when={data.viewer.followedBy.value}>
												<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
													Follows you
												</span>
											</Show>
										</p>
									</div>

									<div class="whitespace-pre-wrap break-words text-sm empty:hidden">
										{data.description.value}
									</div>

									<div class="flex flex-wrap gap-4 text-sm">
										<Link to={{ type: LinkingType.PROFILE_FOLLOWS, actor: actor }} class="hover:underline">
											<span class="font-bold">{data.followsCount.value}</span>{' '}
											<span class="text-muted-fg">Follows</span>
										</Link>

										<Link to={{ type: LinkingType.PROFILE_FOLLOWERS, actor: actor }} class="hover:underline">
											<span class="font-bold">{data.followersCount.value}</span>{' '}
											<span class="text-muted-fg">Followers</span>
										</Link>
									</div>

									<Switch>
										<Match when={data.viewer.blockingByList.value}>
											{(list) => (
												<div class="text-sm text-muted-fg">
													<p>
														This user is blocked by{' '}
														<Link
															to={{
																type: LinkingType.PROFILE_LIST,
																actor: getRepoId(list().uri) as DID,
																rkey: getRecordId(list().uri),
															}}
															class="text-accent hover:underline"
														>
															{list().name}
														</Link>
													</p>
												</div>
											)}
										</Match>

										<Match when={data.viewer.mutedByList.value}>
											{(list) => (
												<div class="text-sm text-muted-fg">
													<p>
														This user is muted by{' '}
														<Link
															to={{
																type: LinkingType.PROFILE_LIST,
																actor: getRepoId(list().uri) as DID,
																rkey: getRecordId(list().uri),
															}}
															class="text-accent hover:underline"
														>
															{list().name}
														</Link>
													</p>
												</div>
											)}
										</Match>

										<Match when={data.viewer.muted.value}>
											<div class="text-sm text-muted-fg">
												<p>
													You've muted posts from this user.{' '}
													<button onClick={() => {}} class="text-accent hover:underline">
														Unmute
													</button>
												</p>
											</div>
										</Match>
									</Switch>
								</div>
							</>
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
