import type { AppBskyRichtextFacet } from '../atp-schema';

export type Facet = AppBskyRichtextFacet.Main;
export type LinkFeature = AppBskyRichtextFacet.Link;
export type MentionFeature = AppBskyRichtextFacet.Mention;
export type TagFeature = AppBskyRichtextFacet.Tag;

export interface RichTextSegment {
	text: string;
	link?: LinkFeature;
	mention?: MentionFeature;
	tag?: TagFeature;
}
