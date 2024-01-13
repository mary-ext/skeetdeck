import { type JSX, lazy, createMemo } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import { renderLabelName } from '~/api/display.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { CauseLabel } from '~/api/moderation/action.ts';
import { getProfileModDecision } from '~/api/moderation/decisions/profile.ts';

import { formatCompact } from '~/utils/intl/number.ts';
import { formatAbsDateTime } from '~/utils/intl/time.ts';
import { clsx } from '~/utils/misc.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { Button } from '../../primitives/button.ts';

import {
	LINK_LIST,
	LINK_PROFILE_EDIT,
	LINK_PROFILE_FOLLOWERS,
	LINK_PROFILE_FOLLOWS,
	Link,
} from '../Link.tsx';
import { isProfileTempMuted, useSharedPreferences } from '../SharedPreferences.tsx';

import ErrorIcon from '../../icons/baseline-error.tsx';
import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';
import VisibilityIcon from '../../icons/baseline-visibility.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import ProfileFollowButton from '../ProfileFollowButton.tsx';
import ProfileOverflowAction from './profiles/ProfileOverflowAction.tsx';
import ProfileHandleAction from './profiles/ProfileHandleAction.tsx';

const ImageViewerDialog = lazy(() => import('../dialogs/ImageViewerDialog.tsx'));
const MuteConfirmDialog = lazy(() => import('../dialogs/MuteConfirmDialog.tsx'));

export interface ProfileHeaderProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
	const { filters } = useSharedPreferences();

	const profile = props.profile;
	const viewer = profile.viewer;

	const verdict = createMemo(() => {
		const decision = getProfileModDecision(profile, useSharedPreferences());

		return decision;
	});

	return (
		<div class="flex flex-col">
			{(() => {
				const banner = profile.banner.value;

				if (banner) {
					return (
						<button
							onClick={() => {
								openModal(() => <ImageViewerDialog images={[{ fullsize: banner }]} />);
							}}
							class="group aspect-banner overflow-hidden bg-background"
						>
							<img
								src={banner}
								class={clsx([`h-full w-full object-cover group-hover:opacity-75`, verdict()?.m && `blur`])}
							/>
						</button>
					);
				}

				return <div class="aspect-banner bg-muted-fg"></div>;
			})()}

			<div class="z-10 flex flex-col gap-3 p-4">
				<div class="flex gap-2">
					{(() => {
						const avatar = profile.avatar.value;

						if (avatar) {
							return (
								<button
									onClick={() => {
										openModal(() => <ImageViewerDialog images={[{ fullsize: avatar }]} />);
									}}
									class="group -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-background outline-2 outline-background outline focus-visible:outline-primary"
								>
									<img
										src={avatar}
										class={clsx([`h-full w-full group-hover:opacity-75`, verdict()?.m && `blur`])}
									/>
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

					{
						/* @once */ profile.did !== profile.uid
							? [
									<ProfileOverflowAction profile={profile}>
										<button title="Actions" class={/* @once */ Button({ variant: 'outline' })}>
											<MoreHorizIcon class="-mx-1.5 text-base" />
										</button>
									</ProfileOverflowAction>,
									(() => {
										if (!viewer.blocking.value && !viewer.blockedBy.value) {
											return <ProfileFollowButton profile={profile} />;
										}
									}) as unknown as JSX.Element,
								]
							: [
									<ProfileOverflowAction profile={profile}>
										<button title="Actions" class={/* @once */ Button({ variant: 'outline' })}>
											<MoreHorizIcon class="-mx-1.5 text-base" />
										</button>
									</ProfileOverflowAction>,
									<Link
										to={{ type: LINK_PROFILE_EDIT, profile: profile }}
										class={/* @once */ Button({ variant: 'primary' })}
									>
										Edit profile
									</Link>,
								]
					}
				</div>

				<div>
					<p dir="auto" class="overflow-hidden break-words text-xl font-bold empty:hidden">
						{profile.displayName.value}
					</p>
					<p class="flex min-w-0 items-center text-sm text-muted-fg">
						<ProfileHandleAction profile={profile}>
							<button class="overflow-hidden text-ellipsis whitespace-nowrap text-left hover:underline">
								{'@' + profile.handle.value}
							</button>
						</ProfileHandleAction>

						{(() => {
							if (viewer.followedBy.value) {
								return (
									<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
										Follows you
									</span>
								);
							}
						})()}
					</p>
				</div>

				<div class="whitespace-pre-wrap break-words text-sm empty:hidden">{profile.description.value}</div>

				<div class="flex flex-wrap gap-4 text-sm">
					<Link to={{ type: LINK_PROFILE_FOLLOWS, actor: profile.did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile.followsCount.value)}</span>{' '}
						<span class="text-muted-fg">Follows</span>
					</Link>

					<Link to={{ type: LINK_PROFILE_FOLLOWERS, actor: profile.did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile.followersCount.value)}</span>{' '}
						<span class="text-muted-fg">Followers</span>
					</Link>
				</div>

				{(() => {
					const isTemporarilyMuted = isProfileTempMuted(filters, profile.did);
					if (isTemporarilyMuted !== null) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									You've temporarily muted posts from this user until{' '}
									<span class="font-bold">{formatAbsDateTime(isTemporarilyMuted)}</span>.{' '}
									<button
										onClick={() => {
											openModal(() => <MuteConfirmDialog profile={profile} filters={filters} />);
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
												type: LINK_LIST,
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
												type: LINK_LIST,
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
											openModal(() => <MuteConfirmDialog profile={profile} filters={filters} />);
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

				{(() => {
					const $verdict = verdict();

					if (!$verdict) {
						return null;
					}

					const source = $verdict.s;
					if (source.t !== CauseLabel) {
						return null;
					}

					return (
						<div class="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left">
							{
								/* @once */ $verdict.a ? (
									<ErrorIcon class="shrink-0 text-lg text-red-500" />
								) : (
									<VisibilityIcon class="shrink-0 text-lg text-muted-fg" />
								)
							}
							<span class="grow text-sm">{/* @once */ renderLabelName(source.l.val)}</span>
						</div>
					);
				})()}
			</div>
		</div>
	);
};

export default ProfileHeader;
