import { type Accessor, createEffect, createMemo } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts';
import type { SignalizedTimelineItem } from '~/api/models/timeline';
import { getRecordId } from '~/api/utils/misc';

import { updatePostLike } from '~/api/mutations/like-post';

import {
	type ModerationCause,
	ContextContentList,
	ContextProfileMedia,
	getModerationUI,
} from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';

import { formatCompact } from '~/utils/intl/number';
import { isElementClicked } from '~/utils/interaction';
import { clsx } from '~/utils/misc';

import { getModerationOptions } from '../../globals/shared';

import { type PostLinking, type ProfileLinking, LINK_PROFILE, LINK_POST, Link, useLinking } from '../Link';
import RichTextRenderer from '../RichTextRenderer';
import TimeAgo from '../TimeAgo';

import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble';
import FavoriteIcon from '../../icons/baseline-favorite';
import FavoriteOutlinedIcon from '../../icons/outline-favorite';
import MoreHorizIcon from '../../icons/baseline-more-horiz';
import PoundIcon from '../../icons/baseline-pound';
import RepeatIcon from '../../icons/baseline-repeat';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import Embed from '../embeds/Embed';
import ContentWarning from '../moderation/ContentWarning';
import LabelsOnMe from '../moderation/LabelsOnMe';
import ModerationAlerts from '../moderation/ModerationAlerts';

import PostOverflowAction from './posts/PostOverflowAction';
import ReplyAction from './posts/ReplyAction';
import RepostAction from './posts/RepostAction';

export interface PostProps {
	/** Expected to be static */
	post: SignalizedPost;
	parent?: SignalizedPost;
	reason?: SignalizedTimelineItem['reason'];
	prev?: boolean;
	next?: boolean;
	interactive?: boolean;
	highlight?: boolean;
}

const isMobile = import.meta.env.VITE_MODE === 'mobile';

const Post = (props: PostProps) => {
	const linking = useLinking();

	const post = props.post;

	const author = post.author;
	const record = post.record;
	const viewer = post.viewer;

	const uid = author.uid;
	const did = author.did;

	const authorPermalink: ProfileLinking = { type: LINK_PROFILE, actor: did };
	const postPermalink: PostLinking = { type: LINK_POST, actor: did, rkey: getRecordId(post.uri) };

	const causes = createMemo(() => moderatePost(post, getModerationOptions()));
	const shouldBlurAvatar = createMemo(() => {
		const ui = getModerationUI(causes(), ContextProfileMedia);
		return ui.b.length > 0;
	});

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		linking.navigate(postPermalink);
	};

	return (
		<div
			tabindex={props.interactive ? 0 : undefined}
			onClick={handleClick}
			onKeyDown={handleClick}
			class={clsx([
				`relative border-divider px-4 outline-2 -outline-offset-2 outline-primary focus-visible:outline`,
				!props.next && `border-b`,
			])}
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
								<div class="flex w-9 shrink-0 justify-end">
									<RepeatIcon />
								</div>
								<Link
									to={/* @once */ { type: LINK_PROFILE, actor: reason.by.did }}
									class="flex min-w-0 font-medium hover:underline"
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
									<div class="flex w-9 shrink-0 justify-end">
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
										class="flex min-w-0 font-medium hover:underline"
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
									<div class="flex w-9 shrink-0 justify-end">
										<ChatBubbleOutlinedIcon />
									</div>
									<Link to={postPermalink} class="flex min-w-0 font-medium hover:underline">
										Show full thread
									</Link>
								</div>
							);
						}
					}
				})()}
			</div>

			<div class="flex gap-3">
				<div class="relative flex shrink-0 flex-col items-center">
					<Link to={authorPermalink} class="h-9 w-9 overflow-hidden rounded-full hover:opacity-80">
						<img
							src={author.avatar.value || DefaultAvatar}
							class={clsx([`h-full w-full`, !!author.avatar.value && shouldBlurAvatar() && `blur`])}
						/>
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
							{isMobile ? (
								<span class="group flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
									{author.displayName.value && (
										<bdi class="overflow-hidden text-ellipsis group-hover:underline">
											<span class="font-bold text-primary">{author.displayName.value}</span>
										</bdi>
									)}

									<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
										@{author.handle.value}
									</span>
								</span>
							) : (
								<Link
									tabindex={-1}
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
							)}

							<span class="px-1">·</span>

							<TimeAgo value={record.value.createdAt}>
								{(relative, absolute) => (
									<Link to={postPermalink} title={absolute()} class="whitespace-nowrap hover:underline">
										{relative()}
									</Link>
								)}
							</TimeAgo>
						</div>
					</div>

					{did === uid && (
						<LabelsOnMe
							uid={uid}
							report={{ type: 'post', uri: post.uri, cid: post.cid.value }}
							labels={post.labels.value}
							class="mb-1 mt-1"
						/>
					)}

					<PostContent post={post} postPermalink={postPermalink} causes={causes} />

					<div class="mt-3 flex flex-wrap items-center gap-1.5 text-de text-primary/85 empty:hidden">
						{(() => {
							const tags = record.value.tags;

							if (!tags || tags.length === 0) {
								return null;
							}

							const length = tags.length;
							const overflowing = length > 3;
							const sliced = overflowing ? tags.slice(0, 3) : tags;

							return [
								...sliced.map((tag) => (
									<div class="flex min-w-0 items-center gap-1 rounded-full bg-secondary/30 px-2 leading-6">
										<PoundIcon />
										<span class="overflow-hidden text-ellipsis whitespace-nowrap">{tag}</span>
									</div>
								)),
								overflowing && <span class="text-muted-fg">...and {length - 3} more</span>,
							];
						})()}
					</div>

					{(() => {
						if (props.interactive) {
							return (
								<div class="mt-3 flex text-muted-fg">
									<div class="min-w-0 grow basis-0">
										<ReplyAction post={post}>
											{(disabled) => (
												<button class="group flex max-w-full items-end gap-0.5">
													<div
														class={
															/* @once */ clsx([
																`-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40 group-disabled:opacity-50`,
																disabled && `opacity-50`,
															])
														}
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
												class={clsx([
													`group flex max-w-full grow basis-0 items-end gap-0.5`,
													viewer.repost.value && `text-green-600`,
												])}
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
											class={clsx([
												`group flex max-w-full grow basis-0 items-end gap-0.5`,
												viewer.like.value && `is-active text-red-600`,
											])}
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
										<PostOverflowAction post={post}>
											<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary/40">
												<MoreHorizIcon />
											</button>
										</PostOverflowAction>
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
	causes: Accessor<ModerationCause[]>;
}

const PostContent = ({ post, postPermalink, causes }: PostContentProps) => {
	const embed = post.embed;

	const ui = createMemo(() => getModerationUI(causes(), ContextContentList));

	return (
		<>
			<ModerationAlerts ui={ui()} class="mt-1" />

			<ContentWarning
				ui={ui()}
				ignoreMute
				containerClass="mt-2"
				innerClass="mt-3"
				children={(() => {
					let content: HTMLDivElement | undefined;

					return (
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

							{embed.value && <Embed post={post} causes={causes()} />}
						</>
					);
				})()}
			/>
		</>
	);
};
