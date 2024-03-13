import { type JSX, createMemo, lazy } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import type { SignalizedProfile } from '~/api/stores/profiles';

import { openModal } from '../../../globals/modals';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu';

import { Flyout } from '../../Flyout';
import { LINK_PROFILE_FEEDS, LINK_PROFILE_LISTS, useLinking } from '../../Link';
import { isProfileTempMuted, useSharedPreferences } from '../../SharedPreferences';

import BlockIcon from '../../../icons/baseline-block';
import LaunchIcon from '../../../icons/baseline-launch';
import ListBoxOutlinedIcon from '../../../icons/outline-list-box';
import PlaylistAddIcon from '../../../icons/baseline-playlist-add';
import PoundIcon from '../../../icons/baseline-pound';
import RepeatIcon from '../../../icons/baseline-repeat';
import RepeatOffIcon from '../../../icons/baseline-repeat-off';
import ReportIcon from '../../../icons/baseline-report';
import VisibilityIcon from '../../../icons/baseline-visibility';
import VisibilityOffIcon from '../../../icons/baseline-visibility-off';
import VolumeOffIcon from '../../../icons/baseline-volume-off';
import VolumeUpIcon from '../../../icons/baseline-volume-up';

const AddProfileInListDialog = lazy(() => import('../../dialogs/lists/AddProfileInListDialog'));
const BlockConfirmDialog = lazy(() => import('../../dialogs/BlockConfirmDialog'));
const MuteConfirmDialog = lazy(() => import('../../dialogs/MuteConfirmDialog'));
const ReportDialog = lazy(() => import('../../dialogs/ReportDialog'));
const SilenceConfirmDialog = lazy(() => import('../../dialogs/SilenceConfirmDialog'));

export interface ProfileOverflowActionProps {
	profile: SignalizedProfile;
	children: JSX.Element;
}

const isDesktop = import.meta.env.VITE_MODE === 'desktop';

const ProfileOverflowAction = (props: ProfileOverflowActionProps) => {
	const linking = useLinking();
	const { filters } = useSharedPreferences();

	return (() => {
		const profile = props.profile;
		const did = profile.did;

		const isSelf = profile.uid === did;
		const isOwnAccount = createMemo(() => multiagent.accounts.some((account) => account.did === did));

		const isTempMuted = () => isProfileTempMuted(filters, did);
		const isMuted = () => profile.viewer.muted.value;
		const isBlocked = () => profile.viewer.blocking.value;

		const isRepostHidden = createMemo(() => {
			const index = filters.hideReposts.indexOf(did);

			if (index !== -1) {
				return { index: index };
			}
		});

		return (
			<Flyout button={props.children} placement="bottom-end">
				{({ close, menuProps }) => (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<a
							href={`https://bsky.app/profile/${did}`}
							target="_blank"
							onClick={close}
							class={/* @once */ MenuItem()}
						>
							<LaunchIcon class={/* @once */ MenuItemIcon()} />
							<span>Open in Bluesky app</span>
						</a>

						{isDesktop && (
							<button
								onClick={() => {
									close();
									linking.navigate({ type: LINK_PROFILE_LISTS, actor: did });
								}}
								class={/* @once */ MenuItem()}
							>
								<ListBoxOutlinedIcon class={/* @once */ MenuItemIcon()} />
								<span>View lists</span>
							</button>
						)}

						{isDesktop && (
							<button
								onClick={() => {
									close();
									linking.navigate({ type: LINK_PROFILE_FEEDS, actor: did });
								}}
								class={/* @once */ MenuItem()}
							>
								<PoundIcon class={/* @once */ MenuItemIcon()} />
								<span>View feeds</span>
							</button>
						)}

						<hr class="mx-2 my-1 border-divider" />

						{!isSelf && (
							<button
								onClick={() => {
									const array = filters.hideReposts;
									const repostHidden = isRepostHidden();

									close();

									if (repostHidden) {
										array.splice(repostHidden.index, 1);
									} else {
										array.push(did);
									}
								}}
								class={/* @once */ MenuItem()}
							>
								{(() => {
									const Icon = !isRepostHidden() ? RepeatOffIcon : RepeatIcon;
									return <Icon class={/* @once */ MenuItemIcon()} />;
								})()}
								<span>{isRepostHidden() ? `Turn on reposts` : `Turn off reposts`}</span>
							</button>
						)}

						<button
							onClick={() => {
								close();
								openModal(() => <AddProfileInListDialog profile={profile} />);
							}}
							class={/* @once */ MenuItem()}
						>
							<PlaylistAddIcon class={/* @once */ MenuItemIcon()} />
							<span class="overflow-hidden text-ellipsis whitespace-nowrap">{`Add/remove from lists`}</span>
						</button>

						{!isSelf && (
							<button
								onClick={() => {
									close();
									openModal(() => (
										<MuteConfirmDialog uid={/* @once */ profile.uid} did={/* @once */ profile.did} />
									));
								}}
								class={/* @once */ MenuItem()}
							>
								{(() => {
									const Icon = !isMuted() ? VolumeOffIcon : VolumeUpIcon;
									return <Icon class={/* @once */ MenuItemIcon()} />;
								})()}
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">
									{isMuted() ? `Unmute user` : `Mute user`}
								</span>
							</button>
						)}

						{(() => {
							if (!isOwnAccount()) {
								return (
									<button
										onClick={() => {
											close();
											openModal(() => <SilenceConfirmDialog profile={profile} />);
										}}
										class={/* @once */ MenuItem()}
									>
										{(() => {
											const Icon = !isMuted() ? VisibilityOffIcon : VisibilityIcon;
											return <Icon class={/* @once */ MenuItemIcon()} />;
										})()}
										<span>{!isTempMuted() ? `Silence user` : `Unsilence user`}</span>
									</button>
								);
							}
						})()}

						{!isSelf && (
							<button
								onClick={() => {
									close();
									openModal(() => (
										<BlockConfirmDialog uid={/* @once */ profile.uid} did={/* @once */ profile.did} />
									));
								}}
								class={/* @once */ MenuItem()}
							>
								<BlockIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">
									{isBlocked() ? `Unblock user` : `Block user`}
								</span>
							</button>
						)}

						{!isSelf && (
							<button
								onClick={() => {
									close();

									openModal(() => (
										<ReportDialog
											uid={/* @once */ profile.uid}
											report={/* @once */ { type: 'profile', did: did }}
										/>
									));
								}}
								class={/* @once */ MenuItem()}
							>
								<ReportIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">{`Report user`}</span>
							</button>
						)}
					</div>
				)}
			</Flyout>
		);
	}) as unknown as JSX.Element;
};

export default ProfileOverflowAction;
