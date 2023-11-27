import type { JSX } from 'solid-js';

import { updatePostRepost } from '~/api/mutations/repost-post.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { Flyout } from '../../Flyout.tsx';

import RepeatIcon from '../../../icons/baseline-repeat.tsx';

export interface RepostActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const RepostAction = (props: RepostActionProps) => {
	return (() => {
		const post = props.post;

		if (import.meta.env.VITE_APP_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom">
					{({ close, menuProps }) => (
						<div {...menuProps} class="flex flex-col overflow-hidden rounded-lg bg-background shadow-menu">
							<button
								onClick={() => {
									close();
									updatePostRepost(post, !post.viewer.repost.value);
								}}
								class="flex cursor-pointer items-center gap-4 px-4 py-3 text-left text-sm outline-2 -outline-offset-2 outline-primary hover:bg-secondary/10 focus-visible:outline disabled:pointer-events-none disabled:opacity-50"
							>
								<RepeatIcon class="text-lg" />
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
