import { type JSX, Show } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';

import ProfileFollowButton from '../ProfileFollowButton.tsx';

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
			class="flex gap-3 px-4 py-3 hover:bg-hinted"
		>
			<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
				<Show when={profile().avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="flex items-center justify-between gap-3">
					<span class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
						<bdi class="overflow-hidden text-ellipsis group-hover:underline">
							<span class="font-bold text-primary">
								{profile().displayName.value || profile().handle.value}
							</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
							@{profile().handle.value}
						</span>
					</span>

					<div class="empty:hidden">{aside?.render(profile())}</div>
				</div>

				<Show when={profile().description.value}>
					{(desc) => <div class="line-clamp-3 break-words text-sm">{desc()}</div>}
				</Show>

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
