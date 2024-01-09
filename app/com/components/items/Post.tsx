import { type Accessor, createEffect } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import type { SignalizedTimelineItem } from '~/api/models/timeline.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { updatePostLike } from '~/api/mutations/like-post.ts';

import { formatCompact } from '~/utils/intl/number.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';

import {
	type PostLinking,
	type ProfileLinking,
	LINK_PROFILE,
	LINK_POST,
	Link,
	useLinking,
} from '../Link.tsx';
import RichTextRenderer from '../RichTextRenderer.tsx';
import TimeAgo from '../TimeAgo.tsx';

import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';
import RepeatIcon from '../../icons/baseline-repeat.tsx';
import ShareIcon from '../../icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '../../icons/outline-favorite.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import PostWarning from '../moderation/PostWarning.tsx';
import Embed from '../embeds/Embed.tsx';

import PostOverflowAction from './posts/PostOverflowAction.tsx';
import PostShareAction from './posts/PostShareAction.tsx';
import ReplyAction from './posts/ReplyAction.tsx';
import RepostAction from './posts/RepostAction.tsx';

export interface PostProps {
	/** Expected to be static */
	post: SignalizedPost;
	parent?: SignalizedPost;
	reason?: SignalizedTimelineItem['reason'];
	prev?: boolean;
	next?: boolean;
	interactive?: boolean;
	highlight?: boolean;
	timelineDid?: DID;
}

const Post = (props: PostProps) => {
	const linking = useLinking();

	const post = props.post;

	const author = post.author;
	const record = post.record;
	const viewer = post.viewer;

	const authorPermalink: ProfileLinking = { type: LINK_PROFILE, actor: author.did };
	const postPermalink: PostLinking = { type: LINK_POST, actor: author.did, rkey: getRecordId(post.uri) };

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		const alt = isElementAltClicked(ev);
		linking.navigate(postPermalink, alt);
	};

	return (
		<div
			tabindex={props.interactive ? 0 : undefined}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="relative border-divider px-4 outline-2 -outline-offset-2 outline-primary focus-visible:outline"
			classList={{
				'border-b': !props.next,
				'hover:bg-secondary/10': props.interactive,
			}}
		>
			{(() => {
				if (props.highlight) {
					return <div class="absolute bottom-0 left-0 top-0 w-1 bg-accent/60"></div>;
				}
			})()}

			<div class="flex flex-col gap-1 pt-3">
				{(() => {
					const reason = props.reason;

					if (reason) {
						return (
							<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
								<div class="flex w-10 shrink-0 justify-end">
									<RepeatIcon />
								</div>
								<Link
									to={{ type: LINK_PROFILE, actor: reason.by.did }}
									class="flex min-w-0 text-left font-medium hover:underline"
								>
									<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap">
										{/* @once */ reason.by.displayName || reason.by.handle}
									</span>
									<span class="shrink-0 whitespace-pre"> Reposted</span>
								</Link>
							</div>
						);
					}
				})()}

				{(() => {
					const prev = props.prev;
					const parent = props.parent;

					if (!prev) {
						if (parent) {
							return (
								<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
									<div class="flex w-10 shrink-0 justify-end">
										<ChatBubbleOutlinedIcon />
									</div>
									<Link
										to={
											/* @once */ {
												type: LINK_POST,
												actor: parent.author.did,
												rkey: getRecordId(parent.uri),
											}
										}
										class="flex min-w-0 text-left font-medium hover:underline"
									>
										<span class="shrink-0 whitespace-pre">Replying to </span>
										<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap">
											{(() => {
												const author = parent.author;
												return author.displayName.value || '@' + author.handle.value;
											})()}
										</span>
									</Link>
								</div>
							);
						}

						if (record.value.reply) {
							return (
								<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
									<div class="flex w-10 shrink-0 justify-end">
										<ChatBubbleOutlinedIcon />
									</div>
									<Link to={postPermalink} class="flex min-w-0 text-left font-medium hover:underline">
										Show full thread
									</Link>
								</div>
							);
						}
					}
				})()}
			</div>

			<div class="flex gap-3">
				<div class="flex shrink-0 flex-col items-center">
					<Link
						tabindex={-1}
						to={authorPermalink}
						class="h-10 w-10 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
					>
						<img src={author.avatar.value || DefaultAvatar} class="h-full w-full" />
					</Link>

					{(() => {
						if (props.next) {
							return <div class="mt-3 grow border-l-2 border-divider" />;
						}
					})()}
				</div>

				<div class="min-w-0 grow pb-3">
					<div class="mb-0.5 flex items-center justify-between gap-4">
						<div class="flex items-center overflow-hidden text-sm text-muted-fg">
							<Link
								to={authorPermalink}
								class="group flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
							>
								{author.displayName.value && (
									<bdi class="overflow-hidden text-ellipsis group-hover:underline">
										<span class="font-bold text-primary">{author.displayName.value}</span>
									</bdi>
								)}

								<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
									@{author.handle.value}
								</span>
							</Link>

							<span class="px-1">·</span>

							<TimeAgo value={record.value.createdAt}>
								{(relative, absolute) => (
									<Link to={postPermalink} title={absolute()} class="whitespace-nowrap hover:underline">
										{relative()}
									</Link>
								)}
							</TimeAgo>
						</div>

						{(() => {
							if (props.interactive) {
								return (
									<div class="shrink-0">
										<PostOverflowAction post={post}>
											<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary/40">
												<MoreHorizIcon />
											</button>
										</PostOverflowAction>
									</div>
								);
							}
						})()}
					</div>

					<PostContent post={post} postPermalink={postPermalink} timelineDid={() => props.timelineDid} />

					{(() => {
						if (props.interactive) {
							return (
								<div class="mt-3 flex text-muted-fg">
									<div class="min-w-0 grow basis-0">
										<ReplyAction post={post}>
											{(disabled) => (
												<button class="group flex max-w-full items-end gap-0.5">
													<div
														class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40 group-disabled:opacity-50"
														classList={{ [`opacity-50`]: disabled }}
													>
														<ChatBubbleOutlinedIcon />
													</div>
													<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
														{formatCompact(post.replyCount.value)}
													</span>
												</button>
											)}
										</ReplyAction>
									</div>

									<div class="min-w-0 grow basis-0">
										<RepostAction post={post}>
											<button
												class="group flex max-w-full grow basis-0 items-end gap-0.5"
												classList={{ 'text-green-600': !!viewer.repost.value }}
											>
												<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
													<RepeatIcon />
												</div>

												<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
													{formatCompact(post.repostCount.value)}
												</span>
											</button>
										</RepostAction>
									</div>

									<div class="min-w-0 grow basis-0">
										<button
											onClick={() => updatePostLike(post, !viewer.like.value)}
											class="group flex max-w-full grow basis-0 items-end gap-0.5"
											classList={{ 'is-active text-red-600': !!viewer.like.value }}
										>
											<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
												<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
												<FavoriteIcon class="hidden group-[.is-active]:block" />
											</div>
											<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
												{formatCompact(post.likeCount.value)}
											</span>
										</button>
									</div>

									<div class="shrink-0">
										<PostShareAction post={post}>
											<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary/40">
												<ShareIcon />
											</button>
										</PostShareAction>
									</div>
								</div>
							);
						}
					})()}
				</div>
			</div>
		</div>
	);
};

export default Post;

// <PostContent />
interface PostContentProps {
	post: SignalizedPost;
	postPermalink: PostLinking;
	timelineDid: Accessor<DID | undefined>;
}

const PostContent = ({ post, postPermalink, timelineDid }: PostContentProps) => {
	const embed = post.embed;

	let content: HTMLDivElement | undefined;

	return (
		<PostWarning post={post} timelineDid={timelineDid()}>
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
						to={postPermalink}
						class="text-sm text-accent hover:underline"
					>
						Show more
					</Link>

					{embed.value && <Embed post={post} decision={decision} />}
				</>
			)}
		</PostWarning>
	);
};
