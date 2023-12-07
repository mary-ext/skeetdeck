import type { JSX } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import LaunchIcon from '../../../icons/baseline-launch.tsx';

export interface PostOverflowActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const PostOverflowAction = (props: PostOverflowActionProps) => {
	return (() => {
		const post = props.post;
		const author = post.author;

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
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default PostOverflowAction;
