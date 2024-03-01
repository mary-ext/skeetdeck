import type {
	AppBskyEmbedExternal,
	AppBskyEmbedImages,
	AppBskyFeedDefs,
	AppBskyFeedPost,
} from '../atp-schema';

type RecordEmbed = AppBskyFeedPost.Record['embed'];
type ViewEmbed = AppBskyFeedDefs.PostView['embed'];

export const unwrapPostEmbedText = (embed: RecordEmbed | ViewEmbed): string => {
	let str = '';

	let external: AppBskyEmbedExternal.External | AppBskyEmbedExternal.ViewExternal | undefined;
	let images: AppBskyEmbedImages.Image[] | AppBskyEmbedImages.ViewImage[] | undefined;

	if (embed) {
		const type = embed.$type;

		if (type === 'app.bsky.embed.external' || type === 'app.bsky.embed.external#view') {
			external = embed.external;
		} else if (type === 'app.bsky.embed.images' || type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if (type === 'app.bsky.embed.recordWithMedia' || type === 'app.bsky.embed.recordWithMedia#view') {
			const media = embed.media;
			const mediatype = media.$type;

			if (mediatype === 'app.bsky.embed.external' || mediatype === 'app.bsky.embed.external#view') {
				external = media.external;
			} else if (mediatype === 'app.bsky.embed.images' || mediatype === 'app.bsky.embed.images#view') {
				images = media.images;
			}
		}

		if (external) {
			str += ' ' + external.title;
		}

		if (images) {
			for (let i = 0, il = images.length; i < il; i++) {
				str += ' ' + images[i].alt;
			}
		}
	}

	return str;
};
