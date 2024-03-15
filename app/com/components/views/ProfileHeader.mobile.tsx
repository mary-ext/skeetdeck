import { createMemo, lazy } from 'solid-js';

import type { At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import { CauseLabel, getLocalizedLabel, isProfileTempMuted } from '~/api/moderation';

import { formatCompact } from '~/utils/intl/number';
import { formatAbsDateTime } from '~/utils/intl/time';
import { clsx } from '~/utils/misc';

import { openModal } from '~/com/globals/modals';

import { getProfileModDecision } from '~/com/moderation/profile';

import { LINK_LIST, LINK_PROFILE_FOLLOWERS, LINK_PROFILE_FOLLOWS, Link } from '../Link';
import { useSharedPreferences } from '../SharedPreferences';

import InfoOutlinedIcon from '../../icons/outline-info';
import PersonAddIcon from '../../icons/baseline-person-add';
import ReportProblemOutlinedIcon from '../../icons/outline-report-problem';
import ShareIcon from '../../icons/baseline-share';
import VisibilityOutlinedIcon from '../../icons/outline-visibility';

import { BoxedIconButton } from '../../primitives/boxed-icon-button';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import ProfileFollowButton from '../ProfileFollowButton';
import ProfileHandleAction from './profiles/ProfileHandleAction';

import type { ProfileHeaderProps } from './ProfileHeader';

const ImageViewerDialog = lazy(() => import('../dialogs/ImageViewerDialog'));
const MuteConfirmDialog = lazy(() => import('../dialogs/MuteConfirmDialog'));
const SilenceConfirmDialog = lazy(() => import('../dialogs/SilenceConfirmDialog'));

const ProfileHeader = (props: ProfileHeaderProps) => {
	const { moderation } = useSharedPreferences();

	const profile = props.profile;

	const did = profile.did;
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

			<div class="z-10 flex flex-col gap-4 px-4 py-3">
				<div class="flex gap-4">
					{(() => {
						const avatar = profile.avatar.value;

						if (avatar) {
							return (
								<button
									onClick={() => {
										openModal(() => <ImageViewerDialog images={[{ fullsize: avatar }]} />);
									}}
									class="group -mt-8 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-background outline-2 outline-background outline focus-visible:outline-primary"
								>
									<img
										src={avatar}
										class={clsx([`h-full w-full group-hover:opacity-75`, verdict()?.m && `blur`])}
									/>
								</button>
							);
						}

						return (
							<div class="-mt-8 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline">
								<img src={DefaultAvatar} class="h-full w-full" />
							</div>
						);
					})()}

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
						</p>
					</div>
				</div>

				<div class="whitespace-pre-wrap break-words text-sm empty:hidden">{profile.description.value}</div>

				<div class="flex flex-wrap gap-4 text-sm">
					<Link to={{ type: LINK_PROFILE_FOLLOWS, actor: did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile.followsCount.value)}</span>{' '}
						<span class="text-muted-fg">Follows</span>
					</Link>

					<Link to={{ type: LINK_PROFILE_FOLLOWERS, actor: did }} class="hover:underline">
						<span class="font-bold">{formatCompact(profile.followersCount.value)}</span>{' '}
						<span class="text-muted-fg">Followers</span>
					</Link>
				</div>

				{(() => {
					const isTemporarilyMuted = isProfileTempMuted(moderation, did);
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
												<MuteConfirmDialog uid={/* @once */ profile.uid} did={/* @once */ did} />
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

				{(() => {
					const $verdict = verdict();

					if (!$verdict) {
						return null;
					}

					const source = $verdict.s;
					if (source.t !== CauseLabel) {
						return null;
					}

					const alert = $verdict.a;
					const Icon = alert
						? ReportProblemOutlinedIcon
						: $verdict.i
							? InfoOutlinedIcon
							: VisibilityOutlinedIcon;

					return (
						<div class="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-md border border-divider p-3 text-left">
							<Icon class={`shrink-0 text-lg ` + (alert ? `text-red-500` : `text-muted-fg`)} />
							<span class="grow text-sm">{/* @once */ getLocalizedLabel(source.d).n}</span>
						</div>
					);
				})()}

				<div class="flex gap-3">
					<ProfileFollowButton profile={profile} grow />

					<a href={`/${did}/connect`} title={`Suggest users to follow`} class={/* @once */ BoxedIconButton()}>
						<PersonAddIcon />
					</a>

					<button title={`Share profile`} class={/* @once */ BoxedIconButton()}>
						<ShareIcon />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProfileHeader;
