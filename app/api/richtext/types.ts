import type { AppBskyRichtextFacet } from '@atcute/client/lexicons';

type UnwrapArray<T> = T extends (infer V)[] ? V : never;

export type LinkFeature = AppBskyRichtextFacet.Link;
export type MentionFeature = AppBskyRichtextFacet.Mention;
export type TagFeature = AppBskyRichtextFacet.Tag;

export type Facet = AppBskyRichtextFacet.Main;
export type FacetFeature = UnwrapArray<Facet['features']>;
