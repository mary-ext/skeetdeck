import type { RefOf, UnionOf } from '../atp-schema.ts';

export type Facet = RefOf<'app.bsky.richtext.facet'>;
export type LinkFeature = UnionOf<'app.bsky.richtext.facet#link'>;
export type MentionFeature = UnionOf<'app.bsky.richtext.facet#mention'>;
export type TagFeature = UnionOf<'app.bsky.richtext.facet#tag'>;

/** This is a non-standard facet so that we don't mix up MentionFacet for unresolved handles */
export interface UnresolvedMentionFeature {
	$type: 'io.github.intrnl.langit#unresolvedMention';
	handle: string;
}

export interface RichTextSegment {
	text: string;
	link?: LinkFeature;
	mention?: MentionFeature;
	tag?: TagFeature;
}
