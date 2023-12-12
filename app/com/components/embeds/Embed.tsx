import { type Accessor, createMemo } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';
import { getCollectionId } from '~/api/utils/misc.ts';

import EmbedFeed from './EmbedFeed.tsx';
import EmbedImage from './EmbedImage.tsx';
import EmbedLink from './EmbedLink.tsx';
import EmbedList from './EmbedList.tsx';
import EmbedRecord from './EmbedRecord.tsx';
import EmbedRecordBlocked from './EmbedRecordBlocked.tsx';
import EmbedRecordNotFound from './EmbedRecordNotFound.tsx';

type BskyEmbed = NonNullable<RefOf<'app.bsky.feed.defs#postView'>['embed']>;
type EmbeddedRecord = RefOf<'app.bsky.embed.record#view'>['record'];

type EmbeddedImage = RefOf<'app.bsky.embed.images#viewImage'>;
type EmbeddedLink = RefOf<'app.bsky.embed.external#viewExternal'>;

export interface EmbedProps {
	embed: BskyEmbed;
	/** Whether it should show a large UI for certain embeds */
	large?: boolean;
}

const Embed = (props: EmbedProps) => {
	const embeds = createMemo(() => {
		const embed = props.embed;
		const type = embed.$type;

		let images: EmbeddedImage[] | undefined;
		let link: EmbeddedLink | undefined;
		let record: EmbeddedRecord | undefined;

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

		return { images, link, record };
	});

	return (
		<div class="mt-3 flex flex-col gap-3">
			{(() => {
				const { images, link, record } = embeds();

				return [
					link && <EmbedLink link={link} />,
					images && <EmbedImage images={images} />,
					record && renderRecord(record, () => props.large),
				];
			})()}
		</div>
	);
};

export default Embed;

const renderRecord = (
	record: RefOf<'app.bsky.embed.record#view'>['record'],
	large: Accessor<boolean | undefined>,
) => {
	const type = record.$type;

	if (getCollectionId(record.uri) === 'app.bsky.feed.post') {
		if (type === 'app.bsky.embed.record#viewNotFound') {
			return <EmbedRecordNotFound />;
		}

		if (type === 'app.bsky.embed.record#viewBlocked') {
			return <EmbedRecordBlocked record={record} />;
		}

		if (type === 'app.bsky.embed.record#viewRecord') {
			return <EmbedRecord record={record} large={large()} />;
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
