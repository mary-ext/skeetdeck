import { type JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { Records, UnionOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import PostQuoteWarning from '../moderation/PostQuoteWarning.tsx';

import { Link, LinkingType } from '../Link.tsx';
import TimeAgo from '../TimeAgo.tsx';

import DefaultAvatar from '../../assets/default-avatar.svg';

import EmbedImage from './EmbedImage.tsx';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

export interface EmbedRecordProps {
	record: EmbeddedPostRecord;
	/** Whether it should show a large UI for image embeds */
	large?: boolean;
	interactive?: boolean;
}

const EmbedRecord = (props: EmbedRecordProps) => {
	const record = () => props.record;
	const interactive = () => props.interactive;

	const author = () => record().author;
	const val = () => record().value;

	// we only show image embeds
	const images = () => {
		const embeds = record().embeds;

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

	return (
		<PostQuoteWarning quote={props.record}>
			{(mod) => (
				<Dynamic
					component={interactive() ? Link : 'div'}
					to={
						interactive()
							? { type: LinkingType.POST, actor: author().did, rkey: getRecordId(record().uri) }
							: undefined
					}
					class="overflow-hidden rounded-md border border-divider text-left"
					classList={{ 'cursor-pointer hover:bg-secondary': interactive() }}
				>
					<div class="mx-3 mt-3 flex text-sm text-muted-fg">
						<div class="mr-1 h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
							<img src={author().avatar || DefaultAvatar} class="h-full w-full" />
						</div>

						<span class="flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
							<bdi class="overflow-hidden text-ellipsis">
								<span class="font-bold text-primary">{author().displayName || author().handle}</span>
							</bdi>
							<span class="block overflow-hidden text-ellipsis whitespace-nowrap">@{author().handle}</span>
						</span>

						<span class="px-1">·</span>

						<span class="whitespace-nowrap">
							<TimeAgo value={(val() as PostRecord).createdAt}>
								{(relative, _absolute) => relative as unknown as JSX.Element}
							</TimeAgo>
						</span>
					</div>

					{(() => {
						const $large = props.large;
						const $text = (val() as PostRecord).text;
						const $images = images();

						const showLargeImage = $images && ($large || !$text);

						return [
							$text && (
								<div class="flex items-start">
									{$images && !$large && (
										<div class="mb-3 ml-3 mt-2 grow basis-0">
											<EmbedImage images={$images} blur={/* @once */ mod?.m} />
										</div>
									)}

									<div class="mx-3 mb-3 mt-1 line-clamp-6 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
										{$text}
									</div>
								</div>
							),
							showLargeImage && [
								!$text && <div class="mt-3"></div>,
								<EmbedImage images={$images} blur={/* @once */ mod?.m} borderless />,
							],
						];
					})()}
				</Dynamic>
			)}
		</PostQuoteWarning>
	);
};

export default EmbedRecord;
