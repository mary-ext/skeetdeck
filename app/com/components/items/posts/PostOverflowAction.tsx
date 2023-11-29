import type { JSX } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { MenuItem, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import LaunchIcon from '../../../icons/baseline-launch.tsx';

export interface PostOverflowActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const PostOverflowAction = (props: PostOverflowActionProps) => {
	return (() => {
		const post = props.post;

		if (import.meta.env.VITE_APP_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<button
								onClick={() => {
									close();
									open(`https://bsky.app/profile/${post.author.did}/post/${getRecordId(post.uri)}`, '_blank');
								}}
								class={/* @once */ MenuItem()}
							>
								<LaunchIcon class="text-lg" />
								<span>Open in Bluesky app</span>
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
