import { type Accessor, Match, Show, Switch, createEffect } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import type { SignalizedTimelineItem } from '~/api/models/timeline.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { updatePostLike } from '~/api/mutations/like-post.ts';

import { isElementAltClicked, isElementClicked } from '~/utils/interaction.ts';

import { type PostLinking, type ProfileLinking, Link, LinkingType, useLinking } from '../Link.tsx';
import { Flyout } from '../Flyout.tsx';
import RichTextRenderer from '../RichTextRenderer.tsx';
import TimeAgo from '../TimeAgo.tsx';

import PostWarning from '../moderation/PostWarning.tsx';
import PostEmbedWarning from '../moderation/PostEmbedWarning.tsx';
import Embed from '../embeds/Embed.tsx';

import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';
import RepeatIcon from '../../icons/baseline-repeat.tsx';
import ShareIcon from '../../icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '../../icons/outline-favorite.tsx';

import RepostAction from './posts/RepostAction.tsx';

export interface PostProps {
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

	const post = () => props.post;
	const parent = () => props.parent;
	const interactive = () => props.interactive;
	const reason = () => props.reason;
	const prev = () => props.prev;

	const author = () => post().author;
	const record = () => post().record.value;

	const authorPermalink = (): ProfileLinking => {
		return { type: LinkingType.PROFILE, actor: author().did };
	};

	const postPermalink = (): PostLinking => {
		return { type: LinkingType.POST, actor: author().did, rkey: getRecordId(post().uri) };
	};

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		const alt = isElementAltClicked(ev);
		linking.navigate(postPermalink(), alt);
	};

	return (
		<div
			tabindex={interactive() ? 0 : undefined}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="relative border-divider px-4 outline-2 -outline-offset-2 outline-primary focus-visible:outline"
			classList={{
				'border-b': !props.next,
				'hover:bg-hinted': interactive(),
				'bg-accent/20': props.highlight,
			}}
		>
			<div class="flex flex-col gap-1 pt-3">
				<Show
					when={(() => {
						const $reason = reason();

						if ($reason && $reason.$type === 'app.bsky.feed.defs#reasonRepost') {
							return $reason;
						}
					})()}
					keyed
				>
					{(reason) => (
						<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
							<div class="flex w-10 shrink-0 justify-end">
								<RepeatIcon />
							</div>
							<div class="min-w-0">
								<Link
									to={{ type: LinkingType.PROFILE, actor: reason.by.did }}
									class="flex font-medium hover:underline"
								>
									<span dir="auto" class="line-clamp-1 break-words">
										{/* @once */ reason.by.displayName || reason.by.handle}
									</span>
									<span class="whitespace-pre"> Reposted</span>
								</Link>
							</div>
						</div>
					)}
				</Show>

				<Switch>
					<Match when={!prev() && parent()} keyed>
						{(parent) => (
							<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
								<div class="flex w-10 shrink-0 justify-end">
									<ChatBubbleOutlinedIcon />
								</div>
								<div class="min-w-0">
									<Link
										to={{ type: LinkingType.POST, actor: parent.author.did, rkey: getRecordId(parent.uri) }}
										class="flex font-medium hover:underline"
									>
										<span class="whitespace-pre">Replying to </span>
										<span dir="auto" class="line-clamp-1 break-words">
											{parent.author.displayName.value || parent.author.handle.value}
										</span>
									</Link>
								</div>
							</div>
						)}
					</Match>

					<Match when={!prev() && post().record.value.reply}>
						<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
							<div class="flex w-10 shrink-0 justify-end">
								<ChatBubbleOutlinedIcon />
							</div>
							<div class="min-w-0">
								<Link to={postPermalink()} class="flex font-medium hover:underline">
									Show full thread
								</Link>
							</div>
						</div>
					</Match>
				</Switch>
			</div>

			<div class="flex gap-3">
				<div class="flex shrink-0 flex-col items-center">
					<Link
						to={authorPermalink()}
						class="h-10 w-10 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
					>
						<Show when={author().avatar.value}>
							{(avatar) => <img src={avatar()} class="h-full w-full" />}
						</Show>
					</Link>

					<Show when={props.next}>
						<div class="mt-3 grow border-l-2 border-divider" />
					</Show>
				</div>

				<div class="min-w-0 grow pb-3">
					<div class="mb-0.5 flex items-center justify-between gap-4">
						<div class="flex items-center overflow-hidden text-sm text-muted-fg">
							<Link
								to={authorPermalink()}
								class="group flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
							>
								<bdi class="overflow-hidden text-ellipsis group-hover:underline">
									<span class="font-bold text-primary">
										{author().displayName.value || author().handle.value}
									</span>
								</bdi>
								<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
									@{author().handle.value}
								</span>
							</Link>

							<span class="px-1">·</span>

							<TimeAgo value={record().createdAt}>
								{(relative, absolute) => (
									<Link to={postPermalink()} title={absolute()} class="whitespace-nowrap hover:underline">
										{relative()}
									</Link>
								)}
							</TimeAgo>
						</div>

						<Show when={interactive()}>
							<div class="shrink-0">
								<Flyout
									button={
										<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary">
											<MoreHorizIcon />
										</button>
									}
									placement="bottom-end"
								>
									{({ close, menuProps }) => (
										<div
											{...menuProps}
											class="flex flex-col overflow-hidden rounded-lg bg-background shadow-menu"
										>
											<div class="px-4 py-2">is it working now</div>
										</div>
									)}
								</Flyout>
							</div>
						</Show>
					</div>

					<PostContent post={post} postPermalink={postPermalink} timelineDid={() => props.timelineDid} />

					<Show when={interactive()}>
						<div class="mt-3 flex text-muted-fg">
							<div class="flex grow basis-0 items-end gap-0.5">
								<Link
									to={{ type: LinkingType.REPLY, actor: author().did, rkey: getRecordId(post().uri) }}
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
								>
									<ChatBubbleOutlinedIcon />
								</Link>
								<span class="text-[0.8125rem]">{post().replyCount.value}</span>
							</div>

							<div
								class="flex grow basis-0 items-end gap-0.5"
								classList={{ 'text-green-600': !!post().viewer.repost.value }}
							>
								<RepostAction post={post()}>
									<button class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary">
										<RepeatIcon />
									</button>
								</RepostAction>

								<span class="text-[0.8125rem]">{post().repostCount.value}</span>
							</div>

							<div
								onClick={() => updatePostLike(post(), !post().viewer.like.value)}
								class="group flex grow basis-0 items-end gap-0.5"
								classList={{ 'is-active text-red-600': !!post().viewer.like.value }}
							>
								<button class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary">
									<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
									<FavoriteIcon class="hidden group-[.is-active]:block" />
								</button>
								<span class="text-[0.8125rem]">{post().likeCount.value}</span>
							</div>

							<div class="shrink-0">
								<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary">
									<ShareIcon />
								</button>
							</div>
						</div>
					</Show>
				</div>
			</div>
		</div>
	);
};

export default Post;

// <PostContent />
interface PostContentProps {
	post: Accessor<SignalizedPost>;
	postPermalink: Accessor<PostLinking>;
	timelineDid: Accessor<DID | undefined>;
}

const PostContent = ({ post, postPermalink, timelineDid }: PostContentProps) => {
	let content: HTMLDivElement | undefined;

	return (
		<PostWarning post={post()} timelineDid={timelineDid()}>
			<div ref={content} class="line-clamp-[12] whitespace-pre-wrap break-words text-sm">
				<RichTextRenderer
					item={post()}
					get={(item) => {
						const record = item.record.value;
						return { t: record.text, f: record.facets };
					}}
				/>
			</div>

			<Link
				ref={(node) => {
					node.style.display = post().$truncated !== false ? 'block' : 'none';

					createEffect(() => {
						const $post = post();
						const delta = content!.scrollHeight - content!.clientHeight;

						const next = delta > 10 && !!$post.record.value.text;

						$post.$truncated = next;
						node.style.display = next ? 'block' : 'none';
					});
				}}
				to={postPermalink()}
				class="text-sm text-accent hover:underline"
			>
				Show more
			</Link>

			<Show when={post().embed.value}>
				{(embed) => (
					<PostEmbedWarning post={post()}>
						<Embed embed={embed()} />
					</PostEmbedWarning>
				)}
			</Show>
		</PostWarning>
	);
};
