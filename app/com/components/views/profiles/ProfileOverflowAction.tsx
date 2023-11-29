import { type JSX, createMemo } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';
import { useSharedPreferences } from '../../SharedPreferences.tsx';

import BlockIcon from '../../../icons/baseline-block.tsx';
import LaunchIcon from '../../../icons/baseline-launch.tsx';
import PlaylistAddIcon from '../../../icons/baseline-playlist-add.tsx';
import RepeatIcon from '../../../icons/baseline-repeat.tsx';
import ReportIcon from '../../../icons/baseline-report.tsx';
import VolumeOffIcon from '../../../icons/baseline-volume-off.tsx';

export interface ProfileOverflowActionProps {
	profile: SignalizedProfile;
	children: JSX.Element;
}

const ProfileOverflowAction = (props: ProfileOverflowActionProps) => {
	const { filters } = useSharedPreferences();

	return (() => {
		const profile = props.profile;

		const isMuted = () => profile.viewer.muted.value;
		const isBlocked = () => profile.viewer.blocking.value;

		const isRepostHidden = createMemo(() => {
			const index = filters.hideReposts.indexOf(profile.did);

			if (index !== -1) {
				return { index: index };
			}
		});

		if (import.meta.env.VITE_APP_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<a
								href={`https://bsky.app/profile/${profile.did}`}
								target="_blank"
								onClick={close}
								class={/* @once */ MenuItem()}
							>
								<LaunchIcon class={/* @once */ MenuItemIcon()} />
								<span>Open in Bluesky app</span>
							</a>

							<button
								onClick={() => {
									const array = filters.hideReposts;
									const repostHidden = isRepostHidden();

									close();

									if (repostHidden) {
										array.splice(repostHidden.index, 1);
									} else {
										array.push(profile.did);
									}
								}}
								class={/* @once */ MenuItem()}
							>
								<RepeatIcon class={/* @once */ MenuItemIcon()} />
								<span>{isRepostHidden() ? `Turn on reposts` : `Turn off reposts`}</span>
							</button>

							<button class={/* @once */ MenuItem()}>
								<PlaylistAddIcon class={/* @once */ MenuItemIcon()} />
								<span>{`Add/remove @${profile.handle.value} from lists`}</span>
							</button>

							<button class={/* @once */ MenuItem()}>
								<VolumeOffIcon class={/* @once */ MenuItemIcon()} />
								<span>{isMuted() ? `Unmute @${profile.handle.value}` : `Mute @${profile.handle.value}`}</span>
							</button>

							<button class={/* @once */ MenuItem()}>
								<BlockIcon class={/* @once */ MenuItemIcon()} />
								<span>
									{isBlocked() ? `Unblock @${profile.handle.value}` : `Block @${profile.handle.value}`}
								</span>
							</button>

							<button class={/* @once */ MenuItem()}>
								<ReportIcon class={/* @once */ MenuItemIcon()} />
								<span>{`Report @${profile.handle.value}`}</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default ProfileOverflowAction;
