import { type Accessor, createEffect, createMemo } from 'solid-js';

import {
	ContextContentList,
	ContextProfileMedia,
	type ModerationCause,
	getModerationUI,
} from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import { updatePostLike } from '~/api/mutations/like-post';
import type { SignalizedPost } from '~/api/stores/posts';
import { getRecordId } from '~/api/utils/misc';

import { getModerationOptions } from '~/com/globals/shared';

import { formatCompact } from '~/utils/intl/number';
import { clsx } from '~/utils/misc';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';
import FavoriteIcon from '../../icons/baseline-favorite';
import MoreHorizIcon from '../../icons/baseline-more-horiz';
import RepeatIcon from '../../icons/baseline-repeat';
import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble';
import FavoriteOutlinedIcon from '../../icons/outline-favorite';
import { LINK_POST, LINK_PROFILE, Link, type PostLinking, type ProfileLinking } from '../Link';
import RichTextRenderer from '../RichTextRenderer';
import TimeAgo from '../TimeAgo';
import Embed from '../embeds/Embed';
import ContentWarning from '../moderation/ContentWarning';

import PostOverflowAction from './posts/PostOverflowAction';
import ReplyAction from './posts/ReplyAction';
import RepostAction from './posts/RepostAction';

export interface PostTreeItemProps {
	/** Expected to be static */
	post: SignalizedPost;
	/** Expected to be static */
	hasChildren: boolean;
}

const PostTreeItem = (props: PostTreeItemProps) => {
	const post = props.post;
	const hasChildren = props.hasChildren;

	const author = post.author;
	const record = post.record;
	const viewer = post.viewer;

	const authorPermalink: ProfileLinking = {
		type: LINK_PROFILE,
		actor: author.did,
	};

	const postPermalink: PostLinking = {
		type: LINK_POST,
		actor: author.did,
		rkey: getRecordId(post.uri),
	};

	const causes = createMemo(() => moderatePost(post, getModerationOptions()));
	const shouldBlurAvatar = createMemo(() => {
		const ui = getModerationUI(causes(), ContextProfileMedia);
		return ui.b.length > 0;
	});

	return (
		<div class="flex min-w-0 gap-2 py-2">
			<div class="relative flex shrink-0 flex-col items-center">
				<Link
					tabindex={-1}
					to={authorPermalink}
					class="h-5 w-5 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
				>
					<img
						src={author.avatar.value || DefaultAvatar}
						class={clsx([
							'h-full w-full object-cover',
							!!author.avatar.value && shouldBlurAvatar() && `blur`,
						])}
					/>
				</Link>

				{hasChildren && <div class="absolute -bottom-2 left-2 top-6 grow border-l-2 border-muted" />}
			</div>
			<div class="min-w-0 grow">
				<div class="mb-0.5 flex items-center justify-between gap-4">
					<div class="flex items-center overflow-hidden text-sm text-muted-fg">
						<Link
							to={authorPermalink}
							class="group flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap"
						>
							{(() => {
								const displayName = author.displayName.value;

								if (displayName) {
									return (
										<bdi class="overflow-hidden text-ellipsis group-hover:underline">
											<span class="font-bold text-primary">{displayName}</span>
										</bdi>
									);
								}

								return (
									<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
										@{/* @once */ author.handle.value}
									</span>
								);
							})()}
						</Link>

						<span aria-hidden="true" class="px-1">
							·
						</span>

						<TimeAgo value={record.value.createdAt}>
							{(relative, absolute) => (
								<Link to={postPermalink} title={absolute()} class="whitespace-nowrap hover:underline">
									{relative()}
								</Link>
							)}
						</TimeAgo>
					</div>
				</div>

				<PostContent post={post} permalink={postPermalink} causes={causes} />

				<div class="-ml-1 mt-1.5 flex items-center gap-1 text-muted-fg">
					<ReplyAction post={post}>
						{(disabled) => (
							<button class="group flex max-w-full items-center gap-0.5">
								<div
									class={
										/* @once */ clsx([
											`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40 group-disabled:opacity-50`,
											disabled && `opacity-50`,
										])
									}
								>
									<ChatBubbleOutlinedIcon />
								</div>
								<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">Reply</span>
							</button>
						)}
					</ReplyAction>

					<RepostAction post={post}>
						<button
							class={clsx([
								`group flex max-w-full basis-0 items-center gap-0.5`,
								viewer.repost.value && `text-green-600`,
							])}
						>
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
								<RepeatIcon />
							</div>

							<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
								{formatCompact(post.repostCount.value)}
							</span>
						</button>
					</RepostAction>

					<button
						onClick={() => updatePostLike(post, !post.viewer.like.value)}
						class={clsx([
							`group flex max-w-full basis-0 items-center gap-0.5`,
							viewer.like.value && `is-active text-red-600`,
						])}
					>
						<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
							<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
							<FavoriteIcon class="hidden group-[.is-active]:block" />
						</div>
						<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
							{formatCompact(post.likeCount.value)}
						</span>
					</button>

					<PostOverflowAction post={post}>
						<button class="flex h-6 w-6 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary/40">
							<MoreHorizIcon />
						</button>
					</PostOverflowAction>
				</div>
			</div>
		</div>
	);
};

export default PostTreeItem;

interface PostContentProps {
	post: SignalizedPost;
	permalink: PostLinking;
	causes: Accessor<ModerationCause[]>;
}

const PostContent = ({ post, permalink, causes }: PostContentProps) => {
	const embed = post.embed;
	const record = post.record;

	const ui = createMemo(() => getModerationUI(causes(), ContextContentList));

	return (
		<>
			<ContentWarning
				ui={ui()}
				containerClass="mt-2"
				innerClass="mt-3"
				children={(() => {
					let content: HTMLDivElement | undefined;

					return (
						<>
							<div ref={content} class="line-clamp-[12] whitespace-pre-wrap break-words text-sm">
								<RichTextRenderer text={record.value.text} facets={record.value.facets} />
							</div>

							<Link
								ref={(node) => {
									node.style.display = post.$truncated !== false ? 'block' : 'none';

									createEffect(() => {
										const delta = content!.scrollHeight - content!.clientHeight;

										const next = delta > 10 && !!post.record.value.text;

										post.$truncated = next;
										node.style.display = next ? 'block' : 'none';
									});
								}}
								to={permalink}
								class="text-sm text-accent hover:underline"
							>
								Show more
							</Link>

							{embed.value && <Embed post={post} />}
						</>
					);
				})()}
			/>
		</>
	);
};
