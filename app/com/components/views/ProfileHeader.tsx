import { Match, Show, Switch } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import button from '~/com/primitives/button.ts';

import { Link, LinkingType } from '~/com/components/Link.tsx';

import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

export interface ProfileHeaderProps {
	uid: DID;
	profile: SignalizedProfile;
}

const ProfileHeader = (props: ProfileHeaderProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	return (
		<div class="flex flex-col">
			<Show when={profile().banner.value} keyed fallback={<div class="aspect-banner bg-muted-fg"></div>}>
				{(banner) => (
					<button onClick={() => {}} class="group aspect-banner bg-background">
						<img src={banner} class="h-full w-full object-cover group-hover:opacity-75" />
					</button>
				)}
			</Show>

			<div class="z-10 flex flex-col gap-3 p-4">
				<div class="flex gap-2">
					<Show
						when={profile().avatar.value}
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

					<Show when={profile().did !== uid()}>
						<button title="Actions" onClick={() => {}} class={/* @once */ button({ variant: 'outline' })}>
							<MoreHorizIcon class="-mx-1.5 text-base" />
						</button>

						<Show when={!profile().viewer.blocking.value && !profile().viewer.blockedBy.value}>
							{(_value) => {
								const isFollowing = () => profile().viewer.following.value;

								return (
									<button class={/* @once */ button({ variant: isFollowing() ? 'outline' : 'primary' })}>
										{isFollowing() ? 'Unfollow' : 'Follow'}
									</button>
								);
							}}
						</Show>
					</Show>
				</div>

				<div>
					<p dir="auto" class="break-words text-xl font-bold">
						{profile().displayName.value || profile().handle.value}
					</p>
					<p class="flex items-center text-sm text-muted-fg">
						<button onClick={() => {}} class="hover:underline">
							<span class="line-clamp-1 break-all text-left">@{profile().handle.value}</span>
						</button>

						<Show when={profile().viewer.followedBy.value}>
							<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
								Follows you
							</span>
						</Show>
					</p>
				</div>

				<div class="whitespace-pre-wrap break-words text-sm empty:hidden">{profile().description.value}</div>

				<div class="flex flex-wrap gap-4 text-sm">
					<Link to={{ type: LinkingType.PROFILE_FOLLOWS, actor: profile().did }} class="hover:underline">
						<span class="font-bold">{profile().followsCount.value}</span>{' '}
						<span class="text-muted-fg">Follows</span>
					</Link>

					<Link to={{ type: LinkingType.PROFILE_FOLLOWERS, actor: profile().did }} class="hover:underline">
						<span class="font-bold">{profile().followersCount.value}</span>{' '}
						<span class="text-muted-fg">Followers</span>
					</Link>
				</div>

				<Switch>
					<Match when={profile().viewer.blockingByList.value}>
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

					<Match when={profile().viewer.mutedByList.value}>
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

					<Match when={profile().viewer.muted.value}>
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
		</div>
	);
};

export default ProfileHeader;
