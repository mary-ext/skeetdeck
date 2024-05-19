import { createMemo, type JSX } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles';

import { ContextProfileMedia, getModerationUI } from '~/api/moderation';
import { moderateProfile } from '~/api/moderation/entities/profile';

import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/interaction';
import { clsx } from '~/utils/misc';

import { getModerationOptions } from '../../globals/shared';

import { Interactive } from '../../primitives/interactive';

import ProfileFollowButton from '../ProfileFollowButton';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

export interface ProfileItemAccessory {
	render: (item: SignalizedProfile) => JSX.Element;
}

export interface ProfileItemProps {
	profile: SignalizedProfile;
	aside?: ProfileItemAccessory;
	footer?: ProfileItemAccessory;
	disabled?: boolean;
	small?: boolean;
	/** Expected to be static */
	onClick?: (profile: SignalizedProfile, alt: boolean, ev: Event) => void;
}

const profileItem = Interactive({
	variant: 'muted',
	class: `flex w-full gap-3 px-4 py-3 text-left`,
	userSelect: true,
});

export const ProfileItem = (props: ProfileItemProps) => {
	const profile = () => props.profile;
	const aside = props.aside;
	const footer = props.footer;

	const onClick = props.onClick;

	const shouldBlurAvatar = createMemo(() => {
		const causes = moderateProfile(profile(), getModerationOptions());
		const ui = getModerationUI(causes, ContextProfileMedia);
		return ui.b.length > 0;
	});

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev, INTERACTION_TAGS)) {
			return;
		}

		onClick?.(profile(), isElementAltClicked(ev), ev);
	};

	return (
		<button disabled={props.disabled} onClick={onClick && handleClick} class={profileItem}>
			<div class="relative shrink-0">
				<div class="h-10 w-10 overflow-hidden rounded-full">
					<img
						src={profile().avatar.value || DefaultAvatar}
						class={clsx([
							`h-full w-full object-cover`,
							profile().avatar.value && shouldBlurAvatar() && `blur`,
						])}
					/>
				</div>
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
					if (props.small) {
						return;
					}

					const description = profile().description.value;
					return <div class="line-clamp-3 break-words text-sm empty:hidden">{description}</div>;
				})()}

				{footer?.render(profile())}
			</div>
		</button>
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
