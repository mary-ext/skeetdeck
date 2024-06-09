import { createMemo, createSignal, type JSX } from 'solid-js';

import type { AppBskyFeedDefs, AppBskyFeedThreadgate, At } from '~/api/atp-schema';
import { getRecordId, getRepoId } from '~/api/utils/misc';

import { updatePostLike } from '~/api/mutations/like-post';
import type { SignalizedPost } from '~/api/stores/posts';

import { ContextContentView, ContextProfileMedia, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';

import { formatCompact } from '~/utils/intl/number';
import { formatAbsDateTime } from '~/utils/intl/time';
import { clsx } from '~/utils/misc';

import { getModerationOptions, getTranslationPreferences } from '../../globals/shared';

import { LINK_LIST, LINK_POST_LIKED_BY, LINK_POST_REPOSTED_BY, LINK_PROFILE, Link } from '../Link';
import RichTextRenderer from '../RichTextRenderer';

import AccountCheckIcon from '../../icons/baseline-account-check';
import FavoriteIcon from '../../icons/baseline-favorite';
import MoreHorizIcon from '../../icons/baseline-more-horiz';
import RepeatIcon from '../../icons/baseline-repeat';
import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble';
import FavoriteOutlinedIcon from '../../icons/outline-favorite';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import Embed from '../embeds/Embed';
import ContentWarning from '../moderation/ContentWarning';

import PostOverflowAction from '../items/posts/PostOverflowAction';
import PostTag from '../items/posts/PostTag';
import ReplyAction from '../items/posts/ReplyAction';
import RepostAction from '../items/posts/RepostAction';

import LabelsOnMe from '../moderation/LabelsOnMe';
import ModerationAlerts from '../moderation/ModerationAlerts';
import PostTranslation, { needTranslation } from './posts/PostTranslation';

export interface PermalinkPostProps {
	/** Expected to be static */
	post: SignalizedPost;
}

const PermalinkPost = (props: PermalinkPostProps) => {
	const [showTl, setShowTl] = createSignal(false);

	const post = props.post;

	const author = post.author;
	const record = post.record;
	const viewer = post.viewer;

	const did = author.did;
	const uid = author.uid;

	const causes = createMemo(() => moderatePost(post, getModerationOptions()));
	const ui = createMemo(() => getModerationUI(causes(), ContextContentView));

	const shouldBlurAvatar = createMemo(() => {
		const ui = getModerationUI(causes(), ContextProfileMedia);
		return ui.b.length > 0;
	});

	const rkey = () => {
		return getRecordId(post.uri);
	};

	return (
		<div class="px-4 pt-3">
			<div class="relative mb-3 flex items-center gap-3 text-sm text-muted-fg">
				<Link
					to={{ type: LINK_PROFILE, actor: did }}
					class="pointer-events-none inline-flex min-w-0 max-w-full items-center gap-3"
				>
					<div class="relative">
						<div class="pointer-events-auto z-2 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg hover:opacity-80">
							<img
								src={author.avatar.value || DefaultAvatar}
								class={clsx(['h-full w-full', !!author.avatar.value && shouldBlurAvatar() && `blur`])}
							/>
						</div>
					</div>

					<span class="group pointer-events-auto block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
						<bdi class="overflow-hidden text-ellipsis group-hover:underline">
							<span class="font-bold text-primary">{author.displayName.value}</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">@{author.handle.value}</span>
					</span>
				</Link>
			</div>

			{did === uid && (
				<LabelsOnMe
					uid={uid}
					report={{ type: 'post', uri: post.uri, cid: post.cid.value }}
					labels={post.labels.value}
					class="mb-1"
				/>
			)}

			<ModerationAlerts ui={ui()} class="mb-2" />

			<ContentWarning ui={ui()} ignoreMute containerClass="mb-3" outerClass="mb-3" innerClass="mt-2">
				<div class="overflow-hidden whitespace-pre-wrap break-words text-base empty:hidden">
					<RichTextRenderer text={record.value.text} facets={record.value.facets} />
				</div>

				{(() => {
					if (showTl()) {
						return <PostTranslation post={post} />;
					}

					if (needTranslation(post, getTranslationPreferences())) {
						return (
							<button onClick={() => setShowTl(true)} class="mt-1 text-sm text-accent hover:underline">
								Translate post
							</button>
						);
					}

					return null;
				})()}

				{post.embed.value && <Embed post={post} causes={causes()} large />}
			</ContentWarning>

			<div class="mb-3 flex flex-wrap gap-1.5 text-de text-primary/85 empty:hidden">
				{record.value.tags?.map((tag) => <PostTag tag={tag} />)}
			</div>

			<div class="mb-3">
				<span class="text-sm text-muted-fg">{formatAbsDateTime(record.value.createdAt)}</span>
			</div>

			<hr class="border-divider" />

			<div class="flex flex-wrap gap-4 py-4 text-sm">
				<Link to={{ type: LINK_POST_REPOSTED_BY, actor: did, rkey: rkey() }} class="hover:underline">
					<span class="font-bold">{formatCompact(post.repostCount.value)}</span>{' '}
					<span class="text-muted-fg">Reposts</span>
				</Link>

				<Link to={{ type: LINK_POST_LIKED_BY, actor: did, rkey: rkey() }} class="hover:underline">
					<span class="font-bold">{formatCompact(post.likeCount.value)}</span>{' '}
					<span class="text-muted-fg">Likes</span>
				</Link>
			</div>

			<hr class="border-divider" />

			<div class="flex h-13 items-center justify-around text-muted-fg">
				<ReplyAction post={post}>
					{(disabled) => (
						<button
							class={
								/* @once */ clsx([
									`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40 disabled:pointer-events-none`,
									disabled && `opacity-50`,
								])
							}
						>
							<ChatBubbleOutlinedIcon />
						</button>
					)}
				</ReplyAction>

				<RepostAction post={post}>
					<button
						class={clsx([
							`flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40`,
							viewer.repost.value && `text-green-600`,
						])}
					>
						<RepeatIcon />
					</button>
				</RepostAction>

				<button
					onClick={() => updatePostLike(post, !post.viewer.like.value)}
					class={clsx([
						`group flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40`,
						viewer.like.value && `is-active text-red-600`,
					])}
				>
					<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
					<FavoriteIcon class="hidden group-[.is-active]:block" />
				</button>

				<PostOverflowAction post={post} onTranslate={() => setShowTl(true)}>
					<button class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary/40">
						<MoreHorizIcon />
					</button>
				</PostOverflowAction>
			</div>

			{(() => {
				const threadgate = unwrapThreadgateRecord(post.threadgate.value);
				if (threadgate) {
					const { follow, mention, lists } = threadgate;

					const nodes: JSX.Element[] = [];
					const handle = `@${author.handle.value}`;

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
							const actor = getRepoId(uri) as At.DID;
							const rkey = getRecordId(uri);

							if (idx !== 0) {
								children.push(idx !== len - 1 ? `, ` : ` and `);
							}

							children.push(
								<Link to={{ type: LINK_LIST, actor: actor, rkey: rkey }} class="font-bold hover:underline">
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

const unwrapThreadgateRecord = (threadgate?: AppBskyFeedDefs.ThreadgateView) => {
	if (!threadgate) {
		return null;
	}

	const record = threadgate.record as AppBskyFeedThreadgate.Record;
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
