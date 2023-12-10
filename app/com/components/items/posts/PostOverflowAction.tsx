import { type JSX, lazy } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { openModal } from '../../../globals/modals.tsx';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';
import { isProfileTempMuted, useSharedPreferences } from '../../SharedPreferences.tsx';

import DeleteIcon from '../../../icons/baseline-delete.tsx';
import LaunchIcon from '../../../icons/baseline-launch.tsx';
import ReportIcon from '../../../icons/baseline-report.tsx';
import VolumeOffIcon from '../../../icons/baseline-volume-off.tsx';

const DeletePostConfirmDialog = lazy(() => import('../../dialogs/DeletePostConfirmDialog.tsx'));
const MuteConfirmDialog = lazy(() => import('../../dialogs/MuteConfirmDialog.tsx'));
const ReportDialog = lazy(() => import('../../dialogs/ReportDialog.tsx'));

export interface PostOverflowActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const PostOverflowAction = (props: PostOverflowActionProps) => {
	const { filters } = useSharedPreferences();

	return (() => {
		const post = props.post;
		const author = post.author;

		const isSameAuthor = post.uid === post.author.did;

		const isTempMuted = () => isProfileTempMuted(filters, author.did);
		const isMuted = () => author.viewer.muted.value || isTempMuted();

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<a
								href={`https://bsky.app/profile/${author.did}/post/${getRecordId(post.uri)}`}
								target="_blank"
								onClick={close}
								class={/* @once */ MenuItem()}
							>
								<LaunchIcon class={/* @once */ MenuItemIcon()} />
								<span>Open in Bluesky app</span>
							</a>

							{isSameAuthor && (
								<button
									onClick={() => {
										close();
										openModal(() => <DeletePostConfirmDialog post={post} />);
									}}
									class={/* @once */ MenuItem()}
								>
									<DeleteIcon class={/* @once */ MenuItemIcon()} />
									<span>Delete post</span>
								</button>
							)}

							{!isSameAuthor && (
								<button
									onClick={() => {
										close();
										openModal(() => <MuteConfirmDialog profile={author} filters={filters} />);
									}}
									class={/* @once */ MenuItem()}
								>
									<VolumeOffIcon class={/* @once */ MenuItemIcon()} />
									<span>{isMuted() ? `Unmute @${author.handle.value}` : `Mute @${author.handle.value}`}</span>
								</button>
							)}

							<button
								onClick={() => {
									close();

									openModal(() => (
										<ReportDialog
											uid={/* @once */ post.uid}
											report={/* @once */ { type: 'post', uri: post.uri, cid: post.cid.value }}
										/>
									));
								}}
								class={/* @once */ MenuItem()}
							>
								<ReportIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report post</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default PostOverflowAction;
