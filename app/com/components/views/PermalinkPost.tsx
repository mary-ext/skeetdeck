import { Show } from 'solid-js';

import type { SignalizedPost } from '~/api/stores/posts.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { formatAbsDateTime } from '~/utils/intl/time.ts';

import PostEmbedWarning from '~/com/components/moderation/PostEmbedWarning.tsx';
import Embed from '~/com/components/embeds/Embed.tsx';
import { Link, LinkingType } from '~/com/components/Link.tsx';

import ChatBubbleOutlinedIcon from '~/com/icons/outline-chat-bubble.tsx';
import FavoriteIcon from '~/com/icons/baseline-favorite.tsx';
import FavoriteOutlinedIcon from '~/com/icons/outline-favorite.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/com/icons/baseline-repeat.tsx';
import ShareIcon from '~/com/icons/baseline-share.tsx';

export interface PermalinkPostProps {
	post: SignalizedPost;
}

const PermalinkPost = (props: PermalinkPostProps) => {
	const post = () => props.post;

	const author = () => post().author;
	const record = () => post().record.value;

	const rkey = () => {
		return getRecordId(post().uri);
	};

	return (
		<div class="px-4 pt-3">
			<div class="mb-3 flex items-center text-sm text-muted-fg">
				<Link
					to={{ type: LinkingType.PROFILE, actor: author().did }}
					class="group pointer-events-none inline-flex max-w-full items-start overflow-hidden text-left"
				>
					<div class="pointer-events-auto z-2 mr-3 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted-fg">
						<Show when={author().avatar.value}>
							{(avatar) => <img src={avatar()} class="h-full w-full" />}
						</Show>
					</div>

					<span class="pointer-events-auto block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis group-hover:underline">
							<span class="font-bold text-primary">
								{author().displayName.value || author().handle.value}
							</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
							@{author().handle.value}
						</span>
					</span>
				</Link>

				<div class="flex shrink-0 grow justify-end">
					<button
						onClick={() => {}}
						class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
					>
						<MoreHorizIcon />
					</button>
				</div>
			</div>

			<div class="mt-3 overflow-hidden whitespace-pre-wrap break-words text-base empty:hidden">
				{record().text}
			</div>

			<Show when={post().embed.value}>
				{(embed) => (
					<PostEmbedWarning post={post()}>
						<Embed embed={embed()} large />
					</PostEmbedWarning>
				)}
			</Show>

			<div class="my-3">
				<span class="text-sm text-muted-fg">{formatAbsDateTime(record().createdAt)}</span>
			</div>

			<hr class="border-divider" />

			<div class="flex flex-wrap gap-4 py-4 text-sm">
				<Link
					to={/* @once  */ { type: LinkingType.POST_LIKED_BY, actor: author().did, rkey: rkey() }}
					class="hover:underline"
				>
					<span class="font-bold">{post().repostCount.value}</span> <span class="text-muted-fg">Reposts</span>
				</Link>

				<Link
					to={/* @once */ { type: LinkingType.POST_REPOSTED_BY, actor: author().did, rkey: rkey() }}
					class="hover:underline"
				>
					<span class="font-bold">{post().likeCount.value}</span> <span class="text-muted-fg">Likes</span>
				</Link>
			</div>

			<hr class="border-divider" />

			<div class="flex h-13 items-center justify-around text-muted-fg">
				<Link
					to={/* @once */ { type: LinkingType.REPLY, actor: author().did, rkey: rkey() }}
					class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
				>
					<ChatBubbleOutlinedIcon />
				</Link>

				<button
					class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
					classList={{
						'text-green-600': !!post().viewer.repost.value,
					}}
					onClick={() => {}}
				>
					<RepeatIcon />
				</button>

				<button
					class="group flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
					classList={{ 'is-active text-red-600': !!post().viewer.like.value }}
					onClick={() => {}}
				>
					<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
					<FavoriteIcon class="hidden group-[.is-active]:block" />
				</button>

				<button
					class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
					onClick={() => {}}
				>
					<ShareIcon />
				</button>
			</div>
		</div>
	);
};

export default PermalinkPost;
