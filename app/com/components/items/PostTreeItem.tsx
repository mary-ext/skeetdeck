import { createEffect, createMemo } from 'solid-js';

import { getRecordId } from '~/api/utils/misc';

import type { SignalizedPost } from '~/api/stores/posts';
import { updatePostLike } from '~/api/mutations/like-post';

import { getProfileModDecision } from '../../moderation/profile';

import { formatCompact } from '~/utils/intl/number';
import { clsx } from '~/utils/misc';

import { type PostLinking, type ProfileLinking, LINK_POST, LINK_PROFILE, Link } from '../Link';
import RichTextRenderer from '../RichTextRenderer';
import { useSharedPreferences } from '../SharedPreferences';
import TimeAgo from '../TimeAgo';

import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble';
import ErrorIcon from '../../icons/baseline-error';
import FavoriteIcon from '../../icons/baseline-favorite';
import FavoriteOutlinedIcon from '../../icons/outline-favorite';
import MoreHorizIcon from '../../icons/baseline-more-horiz';
import RepeatIcon from '../../icons/baseline-repeat';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import Embed from '../embeds/Embed';
import PostWarning from '../moderation/PostWarning';

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

	const profileVerdict = createMemo(() => {
		return getProfileModDecision(author, useSharedPreferences());
	});

	return (
		<div class="flex min-w-0 gap-2">
			<div class="relative flex shrink-0 flex-col items-center">
				<Link
					tabindex={-1}
					to={authorPermalink}
					class="h-5 w-5 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
				>
					<img src={author.avatar.value || DefaultAvatar} class="h-full w-full object-cover" />
				</Link>

				{hasChildren && <div class="absolute -bottom-2 left-2 top-6 grow border-l-2 border-muted" />}

				{(() => {
					const verdict = profileVerdict();

					if (verdict) {
						return (
							<div
								class={
									/* @once */
									`absolute -right-1 top-3 rounded-full bg-background ` +
									(verdict.a ? `text-red-500` : `text-muted-fg`)
								}
							>
								<ErrorIcon class="text-sm" />
							</div>
						);
					}
				})()}
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

				<PostContent post={post} permalink={postPermalink} />

				<div class="-mb-1.5 -ml-1 mt-1.5 flex items-center gap-1 text-muted-fg">
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
}

const PostContent = ({ post, permalink }: PostContentProps) => {
	let content: HTMLDivElement | undefined;

	return (
		<PostWarning post={post}>
			{(decision) => (
				<>
					<div ref={content} class="line-clamp-[12] whitespace-pre-wrap break-words text-sm">
						<RichTextRenderer
							item={post}
							get={(item) => {
								const record = item.record.value;
								return { t: record.text, f: record.facets };
							}}
						/>
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

					{post.embed.value && <Embed post={post} decision={decision} />}
				</>
			)}
		</PostWarning>
	);
};
