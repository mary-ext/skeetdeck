import { type JSX, createMemo, lazy } from 'solid-js';

import type { AppBskyEmbedImages, AppBskyEmbedVideo, AppBskyFeedDefs } from '@atcute/client/lexicons';

import { ContextContentMedia, getModerationUI } from '~/api/moderation';
import { moderatePost } from '~/api/moderation/entities/post';
import type { SignalizedPost } from '~/api/stores/posts';
import { getRecordId } from '~/api/utils/misc';

import { openModal } from '~/com/globals/modals';
import { getModerationOptions } from '~/com/globals/shared';

import { isElementAltClicked, isElementClicked } from '~/utils/interaction';
import { formatCompact } from '~/utils/intl/number';
import { clsx } from '~/utils/misc';

import { LINK_POST, useLinking } from '~/com/components/Link';

import ChatBubbleIcon from '~/com/icons/baseline-chat-bubble';
import CheckboxMultipleBlankIcon from '~/com/icons/baseline-checkbox-multiple-blank';
import FavoriteIcon from '~/com/icons/baseline-favorite';
import VideocamIcon from '~/com/icons/baseline-videocam';
import VisibilityIcon from '~/com/icons/baseline-visibility';

const ImageViewerDialog = /*#__PURE__*/ lazy(() => import('~/com/components/dialogs/ImageViewerDialog'));

const isDesktop = import.meta.env.VITE_MODE === 'desktop';

export interface GalleryItemProps {
	post: SignalizedPost;
}

const GalleryItem = (props: GalleryItemProps) => {
	const linking = useLinking();

	return (() => {
		const post = props.post;
		const embed = post.embed.value;

		const image = getPostImage(embed);
		const video = getPostVideo(embed);

		if ((!image && !video) || (image && video)) {
			return null;
		}

		const shouldBlur = createMemo(() => {
			const causes = moderatePost(post, getModerationOptions());
			const ui = getModerationUI(causes, ContextContentMedia);
			return ui.b.length > 0;
		});

		const thumb = image ? image.images[0].thumb : video!.thumbnail;
		const multiple = image ? image.images.length > 1 : false;

		const handleClick = (ev: MouseEvent | KeyboardEvent) => {
			if (!isElementClicked(ev)) {
				return;
			}

			if (isDesktop && image && ev.shiftKey) {
				ev.preventDefault();

				openModal(() => <ImageViewerDialog images={/* @once */ image.images} active={0} />);
				return;
			}

			const alt = isElementAltClicked(ev);
			linking.navigate({ type: LINK_POST, actor: post.author.did, rkey: getRecordId(post.uri) }, alt);
		};

		return (
			<div
				tabindex={0}
				onClick={handleClick}
				onAuxClick={handleClick}
				onKeyDown={handleClick}
				class="group relative aspect-square w-full min-w-0 cursor-pointer select-none overflow-hidden bg-muted text-white"
			>
				<img src={thumb} class={clsx([`h-full w-full object-cover`, shouldBlur() && `scale-110 blur`])} />

				{isDesktop && (
					<div class="invisible absolute inset-0 grid place-items-center bg-black/50 group-hover:visible">
						<div class="flex flex-col gap-1 font-medium">
							<div class="flex items-center justify-center gap-2">
								<FavoriteIcon class="text-base" />
								<span class="text-sm">{formatCompact(post.likeCount.value)}</span>
							</div>
							<div class="flex items-center justify-center gap-2">
								<ChatBubbleIcon class="text-base" />
								<span class="text-sm">{formatCompact(post.replyCount.value)}</span>
							</div>
						</div>
					</div>
				)}

				<div class="absolute left-0 right-0 top-0 m-2 flex items-center justify-end gap-2 text-lg">
					{shouldBlur() && <VisibilityIcon class="drop-shadow" />}
					{video && <VideocamIcon class="drop-shadow" />}
					{multiple && <CheckboxMultipleBlankIcon class="drop-shadow" />}
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

export default GalleryItem;

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
