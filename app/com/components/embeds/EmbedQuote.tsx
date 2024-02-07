import { type JSX } from 'solid-js';

import type { Records, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import type { ModerationDecision } from '~/api/moderation/action.ts';

import { clsx } from '~/utils/misc.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_POST, Link } from '../Link.tsx';
import TimeAgo from '../TimeAgo.tsx';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import PostQuoteWarning from '../moderation/PostQuoteWarning.tsx';
import EmbedImage from './EmbedImage.tsx';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

export interface EmbedQuoteProps {
	record: EmbeddedPostRecord;
	/** Whether it should show a large UI for image embeds */
	large?: boolean;
}

export interface EmbedQuoteContentProps extends EmbedQuoteProps {
	mod: ModerationDecision | null;
}

const getPostImages = (post: EmbeddedPostRecord) => {
	const embeds = post.embeds;

	if (embeds && embeds.length > 0) {
		const val = embeds[0];

		if (val.$type === 'app.bsky.embed.images#view') {
			return val.images;
		} else if (val.$type === 'app.bsky.embed.recordWithMedia#view') {
			const media = val.media;

			if (media.$type === 'app.bsky.embed.images#view') {
				return media.images;
			}
		}
	}
};

const embedQuoteInteractive = Interactive({ variant: 'muted', class: `w-full rounded-md` });

export const EmbedQuoteContent = (props: EmbedQuoteContentProps, interactive?: boolean) => {
	return (() => {
		const post = props.record;
		const large = props.large;
		const mod = props.mod;

		const author = post.author;
		const val = post.value as PostRecord;

		const text = val.text;
		const images = getPostImages(post);

		const showLargeImages = images && (large || !text);

		return (
			<div
				class={
					/* @once */ clsx([
						`overflow-hidden rounded-md border border-divider`,
						interactive && `hover:bg-secondary/10`,
					])
				}
			>
				<div class="mx-3 mt-3 flex text-sm text-muted-fg">
					<div class="mr-1 h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
						<img src={author.avatar || DefaultAvatar} class="h-full w-full" />
					</div>

					<span class="flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
						<bdi class="overflow-hidden text-ellipsis">
							<span class="font-bold text-primary">{author.displayName || author.handle}</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">@{author.handle}</span>
					</span>

					<span class="px-1">·</span>

					<span class="whitespace-nowrap">
						<TimeAgo value={/* @once */ val.createdAt}>
							{(relative, _absolute) => relative as unknown as JSX.Element}
						</TimeAgo>
					</span>
				</div>

				{text ? (
					<div class="flex items-start">
						{images && !large && (
							<div class="mb-3 ml-3 mt-2 grow basis-0">
								<EmbedImage images={images} blur={/* @once */ mod?.m} />
							</div>
						)}

						<div class="mx-3 mb-3 mt-1 line-clamp-6 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
							{text}
						</div>
					</div>
				) : (
					<div class="mt-3"></div>
				)}

				{showLargeImages && <EmbedImage images={images} blur={/* @once */ mod?.m} borderless />}
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedQuote = (props: EmbedQuoteProps) => {
	return (() => {
		const post = props.record;
		const author = post.author;

		return (
			<PostQuoteWarning quote={post}>
				{(mod) => (
					<Link
						to={{ type: LINK_POST, actor: author.did, rkey: getRecordId(post.uri) }}
						class={embedQuoteInteractive}
					>
						{/* @once */ EmbedQuoteContent({ ...props, mod: mod }, true)}
					</Link>
				)}
			</PostQuoteWarning>
		);
	}) as unknown as JSX.Element;
};

export default EmbedQuote;
