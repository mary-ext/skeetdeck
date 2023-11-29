import { type JSX, lazy } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import { formatCompact } from '~/utils/intl/number.ts';
import { formatAbsDateTime } from '~/utils/intl/time.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { Button } from '../../primitives/button.ts';

import { Link, LinkingType } from '../Link.tsx';
import { isProfileTempMuted, useSharedPreferences } from '../SharedPreferences.tsx';

import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import ProfileFollowButton from '../ProfileFollowButton.tsx';
import ProfileOverflowAction from './profiles/ProfileOverflowAction.tsx';

const ImageViewerDialog = lazy(() => import('../dialogs/ImageViewerDialog.tsx'));
const MuteConfirmDialog = lazy(() => import('../dialogs/MuteConfirmDialog.tsx'));

export interface ProfileHeaderProps {
	profile: SignalizedProfile;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
	const { filters } = useSharedPreferences();

	const profile = () => props.profile;

	return (
		<div class="flex flex-col">
			{(() => {
				const banner = profile().banner.value;

				if (banner) {
					return (
						<button
							onClick={() => {
								openModal(() => <ImageViewerDialog images={[{ fullsize: banner }]} />);
							}}
							class="group aspect-banner bg-background"
						>
							<img src={banner} class="h-full w-full object-cover group-hover:opacity-75" />
						</button>
					);
				}

				return <div class="aspect-banner bg-muted-fg"></div>;
			})()}

			<div class="z-10 flex flex-col gap-3 p-4">
				<div class="flex gap-2">
					{(() => {
						const avatar = profile().avatar.value;

						if (avatar) {
							return (
								<button
									onClick={() => {
										openModal(() => <ImageViewerDialog images={[{ fullsize: avatar }]} />);
									}}
									class="group -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-background outline-2 outline-background outline focus-visible:outline-primary"
								>
									<img src={avatar} class="h-full w-full group-hover:opacity-75" />
								</button>
							);
						}

						return (
							<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline">
								<img src={DefaultAvatar} class="h-full w-full" />
							</div>
						);
					})()}

					<div class="grow" />

					{(() => {
						const $profile = profile();

						if ($profile.did !== $profile.uid) {
							return [
								<ProfileOverflowAction profile={$profile}>
									<button
										title="Actions"
										onClick={() => {}}
										class={/* @once */ Button({ variant: 'outline' })}
									>
										<MoreHorizIcon class="-mx-1.5 text-base" />
									</button>
								</ProfileOverflowAction>,
								(() => {
									if (!$profile.viewer.blocking.value && !$profile.viewer.blockedBy.value) {
										return <ProfileFollowButton profile={profile()} />;
									}
								}) as unknown as JSX.Element,
							];
						}
					})()}
				</div>

				<div>
					<p dir="auto" class="break-words text-xl font-bold">
						{profile().displayName.value || profile().handle.value}
					</p>
					<p class="flex items-center text-sm text-muted-fg">
						<button onClick={() => {}} class="hover:underline">
							<span class="line-clamp-1 break-all text-left">@{profile().handle.value}</span>
						</button>

						{(() => {
							if (profile().viewer.followedBy.value) {
								return (
									<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
										Follows you
									</span>
								);
							}
						})()}
					</p>
				</div>

				<div class="whitespace-pre-wrap break-words text-sm empty:hidden">{profile().description.value}</div>

				<div class="flex flex-wrap gap-4 text-sm">
					<Link to={{ type: LinkingType.PROFILE_FOLLOWS, actor: profile().did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile().followsCount.value)}</span>{' '}
						<span class="text-muted-fg">Follows</span>
					</Link>

					<Link to={{ type: LinkingType.PROFILE_FOLLOWERS, actor: profile().did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile().followersCount.value)}</span>{' '}
						<span class="text-muted-fg">Followers</span>
					</Link>
				</div>

				{(() => {
					const $profile = profile();
					const viewer = $profile.viewer;

					const isTemporarilyMuted = isProfileTempMuted(filters, $profile.did);
					if (isTemporarilyMuted !== null) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									You've temporarily muted posts from this user until{' '}
									<span class="font-bold">{formatAbsDateTime(isTemporarilyMuted)}</span>.{' '}
									<button
										onClick={() => {
											openModal(() => <MuteConfirmDialog profile={$profile} filters={filters} />);
										}}
										class="text-accent hover:underline"
									>
										Unmute
									</button>
								</p>
							</div>
						);
					}

					const blockingByList = viewer.blockingByList.value;
					if (blockingByList) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									This user is blocked by{' '}
									<Link
										to={
											/* @once */ {
												type: LinkingType.PROFILE_LIST,
												actor: getRepoId(blockingByList.uri) as DID,
												rkey: getRecordId(blockingByList.uri),
											}
										}
										class="text-accent hover:underline"
									>
										{/* @once */ blockingByList.name}
									</Link>
								</p>
							</div>
						);
					}

					const mutedByList = viewer.mutedByList.value;
					if (mutedByList) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									This user is muted by{' '}
									<Link
										to={
											/* @once */ {
												type: LinkingType.PROFILE_LIST,
												actor: getRepoId(mutedByList.uri) as DID,
												rkey: getRecordId(mutedByList.uri),
											}
										}
										class="text-accent hover:underline"
									>
										{/* @once */ mutedByList.name}
									</Link>
								</p>
							</div>
						);
					}

					const muted = viewer.muted.value;
					if (muted) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									You've muted posts from this user.{' '}
									<button
										onClick={() => {
											openModal(() => <MuteConfirmDialog profile={$profile} filters={filters} />);
										}}
										class="text-accent hover:underline"
									>
										Unmute
									</button>
								</p>
							</div>
						);
					}
				})()}
			</div>
		</div>
	);
};

export default ProfileHeader;
