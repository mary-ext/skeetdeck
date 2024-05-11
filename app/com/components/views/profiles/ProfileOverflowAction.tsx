import { type JSX, createMemo, lazy } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import type { SignalizedProfile } from '~/api/stores/profiles';

import { isProfileTempMuted } from '~/api/moderation';

import { openModal } from '../../../globals/modals';
import { getModerationOptions } from '../../../globals/shared';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu';

import { Flyout } from '../../Flyout';
import { LINK_PROFILE_FEEDS, LINK_PROFILE_LISTS, useLinking } from '../../Link';

import BlockIcon from '../../../icons/baseline-block';
import LaunchIcon from '../../../icons/baseline-launch';
import ListBoxOutlinedIcon from '../../../icons/outline-list-box';
import PlaylistAddIcon from '../../../icons/baseline-playlist-add';
import PoundIcon from '../../../icons/baseline-pound';
import RepeatIcon from '../../../icons/baseline-repeat';
import RepeatOffIcon from '../../../icons/baseline-repeat-off';
import ReportProblemOutlinedIcon from '../../../icons/outline-report-problem';
import VisibilityOffOutlinedIcon from '../../../icons/outline-visibility-off';
import VisibilityOutlinedIcon from '../../../icons/outline-visibility';
import VolumeOffOutlinedIcon from '../../../icons/outline-volume-off';
import VolumeUpOutlinedIcon from '../../../icons/outline-volume-up';

const AddProfileInListDialog = lazy(() => import('../../dialogs/lists/AddProfileInListDialog'));
const BlockConfirmDialog = lazy(() => import('../../dialogs/BlockConfirmDialog'));
const MuteConfirmDialog = lazy(() => import('../../dialogs/MuteConfirmDialog'));
const ReportDialog = lazy(() => import('../../dialogs/ReportDialog'));
const SilenceConfirmDialog = lazy(() => import('../../dialogs/SilenceConfirmDialog'));

export interface ProfileOverflowActionProps {
	profile: SignalizedProfile;
	children: JSX.Element;
}

const ProfileOverflowAction = (props: ProfileOverflowActionProps) => {
	const linking = useLinking();

	return (() => {
		const profile = props.profile;
		const did = profile.did;

		const associated = profile.associated;

		const isSelf = profile.uid === did;
		const isOwnAccount = createMemo(() => multiagent.accounts.some((account) => account.did === did));

		const isTempMuted = () => isProfileTempMuted(getModerationOptions(), did);
		const isMuted = () => profile.viewer.muted.value;
		const isBlocked = () => profile.viewer.blocking.value;

		const isRepostHidden = createMemo(() => {
			const moderation = getModerationOptions();
			const index = moderation.hideReposts.indexOf(did);

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

						{associated.value?.lists && (
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

						{associated.value?.feedgens && (
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
									const moderation = getModerationOptions();
									const array = moderation.hideReposts;
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
											const Icon = !isMuted() ? VisibilityOffOutlinedIcon : VisibilityOutlinedIcon;
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
										<MuteConfirmDialog uid={/* @once */ profile.uid} did={/* @once */ profile.did} />
									));
								}}
								class={/* @once */ MenuItem()}
							>
								{(() => {
									const Icon = !isMuted() ? VolumeOffOutlinedIcon : VolumeUpOutlinedIcon;
									return <Icon class={/* @once */ MenuItemIcon()} />;
								})()}
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">
									{isMuted() ? `Unmute user` : `Mute user`}
								</span>
							</button>
						)}

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
								<ReportProblemOutlinedIcon class={/* @once */ MenuItemIcon()} />
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
