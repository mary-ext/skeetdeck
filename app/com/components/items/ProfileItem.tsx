import { type JSX } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';

import ProfileFollowButton from '../ProfileFollowButton.tsx';

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
			<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
				<img src={profile().avatar.value || DefaultAvatar} class="h-full w-full" />
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="flex items-center justify-between gap-3">
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
					return <div class="line-clamp-3 break-words text-sm">{description}</div>;
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
