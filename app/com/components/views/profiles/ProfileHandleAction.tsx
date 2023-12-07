import { type JSX } from 'solid-js';

import { flip, shift } from '@floating-ui/dom';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import ContentCopyIcon from '~/com/icons/baseline-content-copy.tsx';

export interface ProfileHandleActionProps {
	profile: SignalizedProfile;
	children: JSX.Element;
}

const ProfileHandleAction = (props: ProfileHandleActionProps) => {
	return (() => {
		const profile = props.profile;

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout
					button={props.children}
					placement="bottom-start"
					middleware={[shift({ padding: 16 }), flip()]}
				>
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<button
								onClick={() => {
									close();
									navigator.clipboard.writeText(profile.handle.value);
								}}
								class={/* @once */ MenuItem()}
							>
								<ContentCopyIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">Copy handle</span>
							</button>

							<button
								onClick={() => {
									close();
									navigator.clipboard.writeText(profile.did);
								}}
								class={/* @once */ MenuItem()}
							>
								<ContentCopyIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">Copy DID</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default ProfileHandleAction;
