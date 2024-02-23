import { type Accessor, createMemo } from 'solid-js';

import type { AppBskyEmbedExternal, AppBskyEmbedImages, AppBskyEmbedRecord } from '~/api/atp-schema';
import { getCollectionId } from '~/api/utils/misc';

import type { ModerationDecision } from '~/api/moderation/action';

import type { SignalizedPost } from '~/api/stores/posts';

import PostEmbedWarning from '../moderation/PostEmbedWarning';

import EmbedFeed from './EmbedFeed';
import EmbedImage from './EmbedImage';
import EmbedLink from './EmbedLink';
import EmbedList from './EmbedList';
import EmbedQuote from './EmbedQuote';
import EmbedRecordBlocked from './EmbedRecordBlocked';
import EmbedRecordNotFound from './EmbedRecordNotFound';

type EmbeddedRecord = AppBskyEmbedRecord.View['record'];

type EmbeddedImage = AppBskyEmbedImages.ViewImage;
type EmbeddedLink = AppBskyEmbedExternal.ViewExternal;

export interface EmbedProps {
	/** Expected to be static */
	post: SignalizedPost;
	decision: () => ModerationDecision | null;
	/** Whether it should show a large UI for certain embeds */
	large?: boolean;
}

const Embed = (props: EmbedProps) => {
	const post = props.post;
	const decision = props.decision;

	const embeds = createMemo(() => {
		const embed = post.embed.value;

		let images: EmbeddedImage[] | undefined;
		let link: EmbeddedLink | undefined;
		let record: EmbeddedRecord | undefined;

		if (embed) {
			const type = embed.$type;

			if (type === 'app.bsky.embed.external#view') {
				link = embed.external;
			} else if (type === 'app.bsky.embed.images#view') {
				images = embed.images;
			} else if (type === 'app.bsky.embed.record#view') {
				record = embed.record;
			} else if (type === 'app.bsky.embed.recordWithMedia#view') {
				const rec = embed.record.record;

				const media = embed.media;
				const mediatype = media.$type;

				record = rec;

				if (mediatype === 'app.bsky.embed.external#view') {
					link = media.external;
				} else if (mediatype === 'app.bsky.embed.images#view') {
					images = media.images;
				}
			}
		}

		return { images, link, record };
	});

	return (
		<div class="mt-3 flex flex-col gap-3">
			{(() => {
				const { images, link, record } = embeds();

				return [
					(link || images) && (
						<PostEmbedWarning
							post={post}
							decision={decision()}
							children={(() => {
								return [
									link && <EmbedLink link={link} />,
									images && <EmbedImage images={images} interactive />,
								];
							})()}
						/>
					),
					record && renderRecord(record, () => props.large),
				];
			})()}
		</div>
	);
};

export default Embed;

const renderRecord = (record: AppBskyEmbedRecord.View['record'], large: Accessor<boolean | undefined>) => {
	const type = record.$type;

	if (getCollectionId(record.uri) === 'app.bsky.feed.post') {
		if (type === 'app.bsky.embed.record#viewNotFound') {
			return <EmbedRecordNotFound />;
		}

		if (type === 'app.bsky.embed.record#viewBlocked') {
			return <EmbedRecordBlocked record={record} />;
		}

		if (type === 'app.bsky.embed.record#viewRecord') {
			return <EmbedQuote record={record} large={large()} />;
		}
	}

	if (type === 'app.bsky.feed.defs#generatorView') {
		return <EmbedFeed feed={record} />;
	}

	if (type === 'app.bsky.graph.defs#listView') {
		return <EmbedList list={record} />;
	}

	return null;
};
