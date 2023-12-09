import type { JSX } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import { updatePostRepost } from '~/api/mutations/repost-post.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';
import { LINK_QUOTE, useLinking } from '../../Link.tsx';

import FormatQuoteIcon from '~/com/icons/baseline-format-quote.tsx';
import RepeatIcon from '../../../icons/baseline-repeat.tsx';

export interface RepostActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const RepostAction = (props: RepostActionProps) => {
	const linking = useLinking();

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

							<button
								onClick={() => {
									close();
									linking.navigate({ type: LINK_QUOTE, actor: post.author.did, rkey: getRecordId(post.uri) });
								}}
								class={/* @once */ MenuItem()}
							>
								<FormatQuoteIcon class={/* @once */ MenuItemIcon()} />
								<span>Quote this post</span>
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
