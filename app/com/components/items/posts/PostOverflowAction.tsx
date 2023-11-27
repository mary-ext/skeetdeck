import type { JSX } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getRecordId } from '~/api/utils/misc.ts';

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
						<div {...menuProps} class="flex flex-col overflow-hidden rounded-lg bg-background shadow-menu">
							<button
								onClick={() => {
									close();
									open(`https://bsky.app/profile/${post.author.did}/post/${getRecordId(post.uri)}`, '_blank');
								}}
								class="flex cursor-pointer items-center gap-4 px-4 py-3 text-left text-sm outline-2 -outline-offset-2 outline-primary hover:bg-secondary/10 focus-visible:outline disabled:pointer-events-none disabled:opacity-50"
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
