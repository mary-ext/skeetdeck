import type { JSX } from 'solid-js';

import { updatePostRepost } from '~/api/mutations/repost-post.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import RepeatIcon from '../../../icons/baseline-repeat.tsx';

export interface RepostActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const RepostAction = (props: RepostActionProps) => {
	return (() => {
		const post = props.post;

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<button
								onClick={() => {
									close();
									updatePostRepost(post, !post.viewer.repost.value);
								}}
								class={/* @once */ MenuItem()}
							>
								<RepeatIcon class={/* @once */ MenuItemIcon()} />
								<span>{post.viewer.repost.value ? 'Undo repost' : 'Repost'}</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default RepostAction;
