import type { JSX } from 'solid-js';

import { isLinkValid } from '~/api/richtext/renderer.ts';
import { segmentRichText } from '~/api/richtext/segmentize.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu.ts';

import { Flyout } from '../../Flyout.tsx';

import ContentCopyIcon from '~/com/icons/baseline-content-copy.tsx';
import LinkIcon from '~/com/icons/baseline-link.tsx';
import ShareIcon from '~/com/icons/baseline-share.tsx';

export interface PostShareActionProps {
	post: SignalizedPost;
	children: JSX.Element;
}

const hasShareApi = 'share' in navigator;

const PostShareAction = (props: PostShareActionProps) => {
	return (() => {
		const post = props.post;
		const author = post.author;

		const url = `https://bsky.app/profile/${author.did}/post/${getRecordId(post.uri)}`;

		const getPostText = () => {
			const record = post.record.peek();

			const text = record.text;
			const facets = record.facets;

			if (facets) {
				const segments = segmentRichText(text, facets);

				let result = '';

				for (let idx = 0, len = segments.length; idx < len; idx++) {
					const segment = segments[idx];

					const text = segment.text;
					const link = segment.link;

					if (link) {
						if (isLinkValid(link.uri, text)) {
							result += link.uri;
						} else {
							result += `[${text}](${link.uri})`;
						}
					} else {
						result += text;
					}
				}

				return result;
			} else {
				return text;
			}
		};

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<button
								onClick={() => {
									close();
									navigator.clipboard.writeText(url);
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
										navigator.share({ url: url });
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
									navigator.clipboard.writeText(getPostText());
								}}
								class={/* @once */ MenuItem()}
							>
								<ContentCopyIcon class={/* @once */ MenuItemIcon()} />
								<span>Copy post text</span>
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
