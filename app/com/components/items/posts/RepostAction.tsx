import type { JSX } from 'solid-js';

import { updatePostRepost } from '~/api/mutations/repost-post';
import type { SignalizedPost } from '~/api/stores/posts';
import { getRecordId } from '~/api/utils/misc';

import FormatQuoteIcon from '~/com/icons/baseline-format-quote';
import RepeatIcon from '../../../icons/baseline-repeat';
import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu';
import { Flyout } from '../../Flyout';
import { LINK_QUOTE, useLinking } from '../../Link';

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
