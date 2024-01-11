import { lazy, type JSX } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { openModal } from '../../../globals/modals.tsx';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout, offsetlessMiddlewares } from '../../Flyout.tsx';

import ContentCopyIcon from '../../../icons/baseline-content-copy.tsx';
import HistoryIcon from '../../../icons/baseline-history.tsx';

const HandleHistoryDialog = lazy(() => import('../../dialogs/HandleHistoryDialog.tsx'));

export interface ProfileHandleActionProps {
	profile: SignalizedProfile;
	children: JSX.Element;
}

const ProfileHandleAction = (props: ProfileHandleActionProps) => {
	return (() => {
		const profile = props.profile;

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-start" middleware={offsetlessMiddlewares}>
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

							<button
								onClick={() => {
									close();
									openModal(() => <HandleHistoryDialog profile={profile} />);
								}}
								class={/* @once */ MenuItem()}
							>
								<HistoryIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">View handle history</span>
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
