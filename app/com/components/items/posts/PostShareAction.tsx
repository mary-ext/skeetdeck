import type { JSX } from 'solid-js';

import { serializeRichText } from '~/api/richtext/utils.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import ContentCopyIcon from '../../../icons/baseline-content-copy.tsx';
import LinkIcon from '../../../icons/baseline-link.tsx';
import ShareIcon from '../../../icons/baseline-share.tsx';

export interface PostShareActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const hasShareApi = 'share' in navigator;

const PostShareAction = (props: PostShareActionProps) => {
	return (() => {
		const post = props.post;
		const author = post.author;

		const getPostUrl = () => {
			return `https://bsky.app/profile/${author.handle.value}/post/${getRecordId(post.uri)}`;
		};

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<button
								onClick={() => {
									close();
									navigator.clipboard.writeText(getPostUrl());
								}}
								class={/* @once */ MenuItem()}
							>
								<LinkIcon class={/* @once */ MenuItemIcon()} />
								<span>Copy bsky.app link to post</span>
							</button>

							{hasShareApi && (
								<button
									onClick={() => {
										close();
										navigator.share({ url: getPostUrl() });
									}}
									class={/* @once */ MenuItem()}
								>
									<ShareIcon class={/* @once */ MenuItemIcon()} />
									<span>Share bsky.app link to post via...</span>
								</button>
							)}

							<button
								onClick={() => {
									close();

									const record = post.record.value;
									const serialized = serializeRichText(record.text, record.facets, true);

									navigator.clipboard.writeText(serialized);
								}}
								class={/* @once */ MenuItem()}
							>
								<ContentCopyIcon class={/* @once */ MenuItemIcon()} />
								<span>Copy post text</span>
							</button>

							<button
								onClick={() => {
									close();
									navigator.clipboard.writeText(post.uri);
								}}
								class={/* @once */ MenuItem()}
							>
								<LinkIcon class={/* @once */ MenuItemIcon()} />
								<span>Copy AT URI</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default PostShareAction;
