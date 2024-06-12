import { createMemo, lazy, type JSX } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { getAccountData, isAccountPrivileged } from '~/api/globals/agent';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import type { SignalizedProfile } from '~/api/stores/profiles';

import {
	ContextProfileMedia,
	ContextProfileView,
	getModerationUI,
	isProfileTempMuted,
} from '~/api/moderation';
import { moderateProfile } from '~/api/moderation/entities/profile';

import { formatCompact } from '~/utils/intl/number';
import { formatAbsDateTime } from '~/utils/intl/time';
import { clsx } from '~/utils/misc';

import { openModal } from '../../globals/modals';
import { getModerationOptions } from '../../globals/shared';

import MoreHorizIcon from '../../icons/baseline-more-horiz';
import MailOutlinedIcon from '../../icons/outline-mail';
import { BoxedIconButton } from '../../primitives/boxed-icon-button';
import { Button } from '../../primitives/button';
import {
	Link,
	LINK_LIST,
	LINK_PROFILE_EDIT,
	LINK_PROFILE_FOLLOWERS,
	LINK_PROFILE_FOLLOWS,
	LINK_PROFILE_KNOWN_FOLLOWERS,
	LINK_PROFILE_MESSAGE,
} from '../Link';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import ProfileFollowButton from '../ProfileFollowButton';
import ModerationAlerts from '../moderation/ModerationAlerts';

import ProfileHandleAction from './profiles/ProfileHandleAction';
import ProfileOverflowAction from './profiles/ProfileOverflowAction';

const ImageViewerDialog = lazy(() => import('../dialogs/ImageViewerDialog'));
const MuteConfirmDialog = lazy(() => import('../dialogs/MuteConfirmDialog'));
const SilenceConfirmDialog = lazy(() => import('../dialogs/SilenceConfirmDialog'));

export interface ProfileHeaderProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
	const profile = props.profile;
	const associated = profile.associated;
	const viewer = profile.viewer;

	const knownFollowers = viewer.knownFollowers;

	const causes = createMemo(() => {
		return moderateProfile(profile, getModerationOptions());
	});

	const ui = createMemo(() => {
		return getModerationUI(causes(), ContextProfileView);
	});

	const shouldBlurMedia = createMemo(() => {
		const ui = getModerationUI(causes(), ContextProfileMedia);
		return ui.b.length > 0;
	});

	const canMessage = createMemo((): boolean => {
		if (profile.did === profile.uid || viewer.blocking.value || viewer.blockedBy.value) {
			return false;
		}

		const account = getAccountData(profile.uid)!;
		if (!isAccountPrivileged(account)) {
			return false;
		}

		const allowed = associated.value.chat.allowIncoming;

		if (allowed === 'all') {
			return true;
		} else if (allowed === 'following') {
			return !!viewer.followedBy.value;
		}

		return false;
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
								class={clsx([
									`h-full w-full object-cover group-hover:opacity-75`,
									shouldBlurMedia() && `blur`,
								])}
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
										class={clsx([`h-full w-full group-hover:opacity-75`, shouldBlurMedia() && `blur`])}
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
										<button title="Actions" class={/* @once */ BoxedIconButton()}>
											<MoreHorizIcon />
										</button>
									</ProfileOverflowAction>,
									(() => {
										if (canMessage()) {
											return (
												<Link
													title="Message"
													to={{ type: LINK_PROFILE_MESSAGE, actor: profile.did }}
													class={/* @once */ BoxedIconButton()}
												>
													<MailOutlinedIcon />
												</Link>
											);
										}
									}) as unknown as JSX.Element,
									(() => {
										if (!viewer.blocking.value && !viewer.blockedBy.value) {
											return <ProfileFollowButton profile={profile} />;
										}
									}) as unknown as JSX.Element,
								]
							: [
									<ProfileOverflowAction profile={profile}>
										<button title="Actions" class={/* @once */ BoxedIconButton()}>
											<MoreHorizIcon />
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
					<p class="flex min-w-0 items-start text-sm text-muted-fg">
						<ProfileHandleAction profile={profile}>
							<button class="overflow-hidden text-ellipsis break-words text-left hover:underline">
								{'@' + profile.handle.value}
							</button>
						</ProfileHandleAction>

						{(() => {
							if (viewer.followedBy.value) {
								return (
									<span class="ml-2 mt-0.5 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
										Follows you
									</span>
								);
							}
						})()}
					</p>
				</div>

				<ModerationAlerts ui={ui()} />

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

				{profile.did === profile.uid || knownFollowers.value === undefined ? null : knownFollowers.value ===
				  null ? (
					<div class="text-de text-muted-fg">Not followed by anyone you're following</div>
				) : (
					<div class="flex gap-3">
						<div class="z-0 flex shrink-0">
							{knownFollowers.value.followers.slice(0, 3).map((profile, index) => (
								<div
									class={
										`-mx-0.5 h-5 w-5 overflow-hidden rounded-full border-2 border-background bg-muted-fg` +
										(index !== 0 ? ` -ml-1.5` : ``)
									}
									style={{ 'z-index': 3 - index }}
								>
									<img src={/* @once */ profile.avatar || DefaultAvatar} class="h-full w-full object-cover" />
								</div>
							))}
						</div>

						<Link
							to={{ type: LINK_PROFILE_KNOWN_FOLLOWERS, actor: profile.did }}
							class="text-left text-de text-muted-fg hover:underline"
						>
							{(() => {
								const known = knownFollowers.value;

								const slice = known.followers.slice(0, 2);
								const count = known.count - slice.length;

								let array: string[] = [];

								for (const profile of slice) {
									array.push(profile.displayName || profile.handle);
								}

								if (count > 0) {
									array.push(`${count} others you follow`);
								}

								return `Followed by ` + new Intl.ListFormat('en-US').format(array);
							})()}
						</Link>
					</div>
				)}

				{(() => {
					const isTemporarilyMuted = isProfileTempMuted(getModerationOptions(), profile.did);
					if (isTemporarilyMuted !== null) {
						return (
							<div class="text-sm text-muted-fg">
								<p>
									You've silenced posts from this user until{' '}
									<span class="font-bold">{formatAbsDateTime(isTemporarilyMuted)}</span>.{' '}
									<button
										onClick={() => {
											openModal(() => <SilenceConfirmDialog profile={profile} />);
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
												actor: getRepoId(blockingByList.uri) as At.DID,
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
												actor: getRepoId(mutedByList.uri) as At.DID,
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
											openModal(() => (
												<MuteConfirmDialog uid={/* @once */ profile.uid} did={/* @once */ profile.did} />
											));
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
