import { type JSX, createMemo } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { getProfileModDecision } from '~/api/moderation/decisions/profile.ts';

import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';
import { clsx } from '~/utils/misc.ts';

import { useSharedPreferences } from '../SharedPreferences.tsx';

import ProfileFollowButton from '../ProfileFollowButton.tsx';

import ErrorIcon from '../../icons/baseline-error.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

export interface ProfileItemAccessory {
	render: (item: SignalizedProfile) => JSX.Element;
}

export interface ProfileItemProps {
	profile: SignalizedProfile;
	aside?: ProfileItemAccessory;
	footer?: ProfileItemAccessory;
	/** Expected to be static */
	onClick?: (profile: SignalizedProfile, alt: boolean, ev: Event) => void;
}

export const ProfileItem = (props: ProfileItemProps) => {
	const profile = () => props.profile;
	const aside = props.aside;
	const footer = props.footer;

	const onClick = props.onClick;

	const verdict = createMemo(() => {
		const decision = getProfileModDecision(profile(), useSharedPreferences());

		return decision;
	});

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev, INTERACTION_TAGS)) {
			return;
		}

		onClick?.(profile(), isElementAltClicked(ev), ev);
	};

	return (
		<div
			onClick={onClick && handleClick}
			onAuxClick={onClick && handleClick}
			onKeyDown={onClick && handleClick}
			role="button"
			tabindex={0}
			class="flex gap-3 px-4 py-3 hover:bg-secondary/10"
		>
			<div class="relative shrink-0">
				<div class="h-12 w-12 overflow-hidden rounded-full">
					<img
						src={profile().avatar.value || DefaultAvatar}
						class={clsx([`h-full w-full object-cover`, profile().avatar.value && verdict()?.m && `blur`])}
					/>
				</div>
				{(() => {
					const $verdict = verdict();

					if ($verdict) {
						return (
							<div
								class={
									/* @once */
									`absolute right-0 top-8 rounded-full bg-background ` +
									($verdict.a ? `text-red-500` : `text-muted-fg`)
								}
							>
								<ErrorIcon class="text-xl" />
							</div>
						);
					}
				})()}
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="my-auto flex items-center justify-between gap-3">
					<div class="min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
							{profile().displayName.value}
						</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							{'@' + profile().handle.value}
						</p>
					</div>

					<div class="empty:hidden">{aside?.render(profile())}</div>
				</div>

				{(() => {
					const description = profile().description.value;
					return <div class="line-clamp-3 break-words text-sm empty:hidden">{description}</div>;
				})()}

				{footer?.render(profile())}
			</div>
		</div>
	);
};

export default ProfileItem;

export const ProfileFollowAccessory: ProfileItemAccessory = {
	render: (profile) => {
		if (profile.did !== profile.uid) {
			return <ProfileFollowButton profile={profile} />;
		}

		return null;
	},
};
