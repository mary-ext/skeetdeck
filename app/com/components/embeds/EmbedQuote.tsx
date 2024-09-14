import { type JSX } from 'solid-js';

import type {
	AppBskyEmbedImages,
	AppBskyEmbedRecord,
	AppBskyEmbedVideo,
	AppBskyFeedDefs,
	AppBskyFeedPost,
} from '@atcute/client/lexicons';

import {
	ContextContentList,
	ContextContentMedia,
	type ModerationCause,
	getModerationUI,
} from '~/api/moderation';
import { decideQuote } from '~/api/moderation/entities/quote';
import { getRecordId } from '~/api/utils/misc';

import { clsx } from '~/utils/misc';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';
import { getModerationOptions } from '../../globals/shared';
import { Interactive } from '../../primitives/interactive';
import { LINK_POST, Link } from '../Link';
import TimeAgo from '../TimeAgo';
import ContentWarning from '../moderation/ContentWarning';

import EmbedImage from './EmbedImage';
import EmbedVideo from './EmbedVideo';

type EmbeddedPostRecord = AppBskyEmbedRecord.ViewRecord;
type PostRecord = AppBskyFeedPost.Record;

export interface EmbedQuoteProps {
	record: EmbeddedPostRecord;
	/** Whether it should show a large UI for image embeds */
	large?: boolean;
}

export interface EmbedQuoteContentProps extends EmbedQuoteProps {
	causes?: ModerationCause[];
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

const embedQuoteInteractive = Interactive({ variant: 'muted', class: `w-full rounded-md`, userSelect: true });

export const EmbedQuoteContent = (props: EmbedQuoteContentProps, interactive?: boolean) => {
	return (() => {
		const post = props.record;
		const causes = props.causes;
		const large = props.large;

		const author = post.author;
		const val = post.value as PostRecord;

		const text = val.text.trim();
		const embed = post.embeds?.[0];
		const image = getPostImage(embed);
		const video = getPostVideo(embed);

		const shouldBlurMedia = (image || video) && causes && !!getModerationUI(causes, ContextContentMedia).b[0];

		return (
			<div
				class={
					/* @once */ clsx([
						`overflow-hidden rounded-md border border-divider`,
						interactive && `hover:bg-secondary/10`,
					])
				}
			>
				<div class="mx-3 mt-3 flex min-w-0 text-sm text-muted-fg">
					<div class="mr-2 h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
						<img src={/* @once */ author.avatar || DefaultAvatar} class="h-full w-full" />
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
						{!large ? (
							image ? (
								<div class="mb-3 ml-3 mt-2 grow basis-0">
									<EmbedImage embed={image} blur={shouldBlurMedia} />
								</div>
							) : video ? (
								<div class="mb-3 ml-3 mt-2 grow basis-0">
									<EmbedVideo embed={video} blur={shouldBlurMedia} />
								</div>
							) : null
						) : null}

						<div class="mx-3 mb-3 mt-2 line-clamp-6 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
							{text}
						</div>
					</div>
				) : (
					<div class="mt-3"></div>
				)}

				{large || !text ? (
					image ? (
						<EmbedImage embed={image} borderless blur={shouldBlurMedia} />
					) : video ? (
						<EmbedVideo embed={video} borderless blur={shouldBlurMedia} />
					) : null
				) : null}
			</div>
		);
	}) as unknown as JSX.Element;
};

const EmbedQuote = (props: EmbedQuoteProps) => {
	return (() => {
		const post = props.record;
		const author = post.author;

		const causes = decideQuote(post, getModerationOptions());

		return (
			<ContentWarning ui={getModerationUI(causes, ContextContentList)} innerClass="mt-2">
				<Link
					to={{ type: LINK_POST, actor: author.did, rkey: getRecordId(post.uri) }}
					class={embedQuoteInteractive}
				>
					{/* @once */ EmbedQuoteContent({ ...props, causes }, true)}
				</Link>
			</ContentWarning>
		);
	}) as unknown as JSX.Element;
};

export default EmbedQuote;

const getPostImage = (embed: AppBskyFeedDefs.PostView['embed']): AppBskyEmbedImages.View | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.images#view') {
			return embed;
		}

		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return getPostImage(embed.media);
		}
	}
};

const getPostVideo = (embed: AppBskyFeedDefs.PostView['embed']): AppBskyEmbedVideo.View | undefined => {
	if (embed) {
		if (embed.$type === 'app.bsky.embed.video#view') {
			return embed;
		}

		if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
			return getPostVideo(embed.media);
		}
	}
};
