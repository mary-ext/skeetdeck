import { createMemo, type JSX } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedPost } from '~/api/stores/posts.ts';

import { getPostModDecision } from '~/api/moderation/decisions/post.ts';

import { formatCompact } from '~/utils/intl/number.ts';
import { useMediaQuery } from '~/utils/media-query.ts';

import { LINK_POST, Link } from '../Link.tsx';
import { useSharedPreferences } from '../SharedPreferences.tsx';

import CheckboxMultipleBlankIcon from '../../icons/baseline-checkbox-multiple-blank.tsx';
import FavoriteIcon from '../../icons/baseline-favorite.tsx';
import ChatBubbleIcon from '../../icons/baseline-chat-bubble.tsx';

export interface GalleryItemProps {
	post: SignalizedPost;
}

const GalleryItem = (props: GalleryItemProps) => {
	const hasHover = useMediaQuery('(hover: hover)');

	return (() => {
		const post = props.post;
		const embed = post.embed.value;

		let images: RefOf<'app.bsky.embed.images#viewImage'>[] | undefined;
		if (embed) {
			if (embed.$type === 'app.bsky.embed.images#view') {
				images = embed.images;
			} else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
				if (embed.media.$type === 'app.bsky.embed.images#view') {
					images = embed.media.images;
				}
			}
		}

		if (!images) {
			return null;
		}

		const verdict = createMemo(() => {
			const decision = getPostModDecision(post, useSharedPreferences());

			if (decision) {
				if (decision.m) {
					return decision;
				}
			}
		});

		const img = images[0];
		const multiple = images.length > 1;

		return (
			<Link
				to={/* @once */ { type: LINK_POST, actor: post.author.did, rkey: getRecordId(post.uri) }}
				class="group relative aspect-square w-full min-w-0 overflow-hidden bg-muted text-white"
			>
				<img
					src={img.thumb}
					class="h-full w-full object-cover"
					classList={{ [`scale-110 blur`]: verdict() !== undefined }}
				/>

				<div class="absolute left-0 right-0 top-0 m-2 flex items-center justify-end gap-2 text-lg">
					{multiple && <CheckboxMultipleBlankIcon class="drop-shadow" />}
				</div>

				{hasHover() && (
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
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default GalleryItem;
