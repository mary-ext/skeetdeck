import { type JSX, createMemo, createSignal } from 'solid-js';

import type { DID, Records, RefOf } from '~/api/atp-schema.ts';
import { getRecordId, getRepoId } from '~/api/utils/misc.ts';

import { updatePostLike } from '~/api/mutations/like-post.ts';
import type { SignalizedPost } from '~/api/stores/posts.ts';

import { getPostModDecision } from '~/api/moderation/decisions/post.ts';

import { formatCompact } from '~/utils/intl/number.ts';
import { formatAbsDateTime } from '~/utils/intl/time.ts';

import { LINK_LIST, LINK_POST_LIKED_BY, LINK_POST_REPOSTED_BY, LINK_PROFILE, Link } from '../Link.tsx';
import RichTextRenderer from '../RichTextRenderer.tsx';
import { useSharedPreferences } from '../SharedPreferences.tsx';

import PostEmbedWarning from '../moderation/PostEmbedWarning.tsx';
import Embed from '../embeds/Embed.tsx';

import AccountCheckIcon from '~/com/icons/baseline-account-check.tsx';
import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble.tsx';
import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import FavoriteOutlinedIcon from '../../icons/outline-favorite.tsx';
import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';
import PoundIcon from '~/com/icons/baseline-pound.tsx';
import RepeatIcon from '../../icons/baseline-repeat.tsx';
import ShareIcon from '../../icons/baseline-share.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import PostOverflowAction from '../items/posts/PostOverflowAction.tsx';
import PostShareAction from '../items/posts/PostShareAction.tsx';
import RepostAction from '../items/posts/RepostAction.tsx';
import ReplyAction from '../items/posts/ReplyAction.tsx';

import PostTranslation, { needTranslation } from './posts/PostTranslation.tsx';

export interface PermalinkPostProps {
	post: SignalizedPost;
}

const PermalinkPost = (props: PermalinkPostProps) => {
	const preferences = useSharedPreferences();
	const [showTl, setShowTl] = createSignal(false);

	const post = () => props.post;

	const author = () => post().author;
	const record = () => post().record.value;

	const rkey = () => {
		return getRecordId(post().uri);
	};

	const decision = createMemo(() => {
		return getPostModDecision(post(), preferences);
	});

	return (
		<div class="px-4 pt-3">
			<div class="mb-3 flex items-center gap-3 text-sm text-muted-fg">
				<Link
					to={{ type: LINK_PROFILE, actor: author().did }}
					class="group pointer-events-none inline-flex max-w-full items-center overflow-hidden text-left"
				>
					<div class="pointer-events-auto z-2 mr-3 h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted-fg">
						<img src={author().avatar.value || DefaultAvatar} class="h-full w-full" />
					</div>

					<span class="pointer-events-auto block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis group-hover:underline">
							<span class="font-bold text-primary">{author().displayName.value}</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
							@{author().handle.value}
						</span>
					</span>
				</Link>

				<div class="flex shrink-0 grow justify-end">
					<PostOverflowAction post={post()} onTranslate={() => setShowTl(true)}>
						<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary/40">
							<MoreHorizIcon />
						</button>
					</PostOverflowAction>
				</div>
			</div>

			<div class="mt-3 overflow-hidden whitespace-pre-wrap break-words text-base empty:hidden">
				<RichTextRenderer
					item={post()}
					get={(item) => {
						const record = item.record.value;
						return { t: record.text, f: record.facets };
					}}
				/>
			</div>

			{(() => {
				if (showTl()) {
					return <PostTranslation post={post()} />;
				}

				if (needTranslation(post(), preferences.translation)) {
					return (
						<button onClick={() => setShowTl(true)} class="mt-1 text-sm text-accent hover:underline">
							Translate post
						</button>
					);
				}

				return null;
			})()}

			{post().embed.value && (
				<PostEmbedWarning post={post()} decision={decision()}>
					<Embed embed={post().embed.value!} large />
				</PostEmbedWarning>
			)}

			<div class="my-3 flex flex-wrap gap-1.5 text-sm empty:hidden">
				{record().tags?.map((tag) => (
					<div class="flex min-w-0 items-center gap-1 rounded-full bg-secondary/30 px-2 leading-6">
						<PoundIcon />
						<span class="overflow-hidden text-ellipsis whitespace-nowrap">{tag}</span>
					</div>
				))}
			</div>

			<div class="my-3">
				<span class="text-sm text-muted-fg">{formatAbsDateTime(record().createdAt)}</span>
			</div>

			<hr class="border-divider" />

			<div class="flex flex-wrap gap-4 py-4 text-sm">
				<Link to={{ type: LINK_POST_REPOSTED_BY, actor: author().did, rkey: rkey() }} class="hover:underline">
					<span class="font-bold">{formatCompact(post().repostCount.value)}</span>{' '}
					<span class="text-muted-fg">Reposts</span>
				</Link>

				<Link to={{ type: LINK_POST_LIKED_BY, actor: author().did, rkey: rkey() }} class="hover:underline">
					<span class="font-bold">{formatCompact(post().likeCount.value)}</span>{' '}
					<span class="text-muted-fg">Likes</span>
				</Link>
			</div>

			<hr class="border-divider" />

			<div class="flex h-13 items-center justify-around text-muted-fg">
				<ReplyAction post={post()}>
					{(disabled) => (
						<button
							class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40 disabled:pointer-events-none"
							classList={{ [`opacity-50`]: disabled }}
						>
							<ChatBubbleOutlinedIcon />
						</button>
					)}
				</ReplyAction>

				<RepostAction post={post()}>
					<button
						class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40"
						classList={{
							'text-green-600': !!post().viewer.repost.value,
						}}
					>
						<RepeatIcon />
					</button>
				</RepostAction>

				<button
					onClick={() => updatePostLike(post(), !post().viewer.like.value)}
					class="group flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40"
					classList={{ 'is-active text-red-600': !!post().viewer.like.value }}
				>
					<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
					<FavoriteIcon class="hidden group-[.is-active]:block" />
				</button>

				<PostShareAction post={post()}>
					<button class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40">
						<ShareIcon />
					</button>
				</PostShareAction>
			</div>

			{(() => {
				const threadgate = unwrapThreadgateRecord(post().threadgate.value);
				if (threadgate) {
					const { follow, mention, lists } = threadgate;

					const nodes: JSX.Element[] = [];
					const handle = `@${author().handle.value}`;

					if (follow && mention) {
						nodes.push(`Users ${handle} follows or mentioned can reply`);
					} else if (follow) {
						nodes.push(`${handle}'s follows can reply`);
					} else if (mention) {
						nodes.push(`Users mentioned can reply`);
					}

					if (lists && lists.length > 0) {
						const children: JSX.Element = [];

						for (let idx = 0, len = lists.length; idx < len; idx++) {
							const list = lists[idx];

							const uri = list.uri;
							const actor = getRepoId(uri) as DID;
							const rkey = getRecordId(uri);

							if (idx !== 0) {
								children.push(idx !== len - 1 ? `, ` : ` and `);
							}

							children.push(
								<Link
									to={{ type: LINK_LIST, actor: actor, rkey: rkey }}
									class="text-left font-bold hover:underline"
								>
									{/* @once */ list.name}
								</Link>,
							);
						}

						nodes.push([`Users in `, ...children, ` can reply`]);
					}

					if (nodes.length === 0) {
						nodes.push(`Replies to this thread are disabled`);
					}

					return (
						<div class="mb-4 flex min-w-0 gap-4 rounded bg-accent/20 px-4 py-3">
							<AccountCheckIcon class="mt-2 shrink-0 text-2xl" />

							<div class="text-sm">
								<p class="font-bold">Who can reply?</p>

								{
									/* @once */ nodes.length > 1 ? (
										<ul class="ml-4 mt-1 flex list-disc flex-col gap-1">
											{
												/* @once */ nodes.map((str) => (
													<li>{str}</li>
												))
											}
										</ul>
									) : (
										<p>{nodes[0]}</p>
									)
								}
							</div>
						</div>
					);
				}
			})()}
		</div>
	);
};

export default PermalinkPost;

const unwrapThreadgateRecord = (threadgate?: RefOf<'app.bsky.feed.defs#threadgateView'>) => {
	if (!threadgate) {
		return null;
	}

	const record = threadgate.record as Records['app.bsky.feed.threadgate'];
	const rules = record.allow;

	if (!rules) {
		return null;
	}

	let mention = false;
	let follow = false;
	let lists = threadgate.lists;

	for (let idx = 0, len = rules.length; idx < len; idx++) {
		const rule = rules[idx];
		const type = rule.$type;

		if (type === 'app.bsky.feed.threadgate#followingRule') {
			follow = true;
		} else if (type === 'app.bsky.feed.threadgate#mentionRule') {
			mention = true;
		}
	}

	return {
		mention: mention,
		follow: follow,
		lists: lists,
	};
};
