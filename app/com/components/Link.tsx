import { type JSX, createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

export const LINK_EXTERNAL = 0;
export const LINK_FEED_LIKED_BY = 1;
export const LINK_FEED = 2;
export const LINK_LIST = 3;
export const LINK_POST_LIKED_BY = 4;
export const LINK_POST_REPOSTED_BY = 5;
export const LINK_POST = 6;
export const LINK_PROFILE_FOLLOWERS = 7;
export const LINK_PROFILE_FOLLOWS = 8;
export const LINK_PROFILE = 9;
export const LINK_REPLY = 10;
export const LINK_TAG = 11;

export type LinkingType =
	| typeof LINK_EXTERNAL
	| typeof LINK_FEED_LIKED_BY
	| typeof LINK_FEED
	| typeof LINK_LIST
	| typeof LINK_POST_LIKED_BY
	| typeof LINK_POST_REPOSTED_BY
	| typeof LINK_POST
	| typeof LINK_PROFILE_FOLLOWERS
	| typeof LINK_PROFILE_FOLLOWS
	| typeof LINK_PROFILE
	| typeof LINK_REPLY
	| typeof LINK_TAG;

export interface ExternalLinking {
	type: typeof LINK_EXTERNAL;
	url: string;
	valid: boolean;
}

export interface FeedLikedByLinking {
	type: typeof LINK_FEED_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface FeedLinking {
	type: typeof LINK_FEED;
	actor: DID;
	rkey: string;
}

export interface ListLinking {
	type: typeof LINK_LIST;
	actor: DID;
	rkey: string;
}

export interface PostLikedByLinking {
	type: typeof LINK_POST_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface PostRepostedByLinking {
	type: typeof LINK_POST_REPOSTED_BY;
	actor: DID;
	rkey: string;
}

export interface PostLinking {
	type: typeof LINK_POST;
	actor: DID;
	rkey: string;
}

export interface ProfileFollowsLinking {
	type: typeof LINK_PROFILE_FOLLOWERS;
	actor: DID;
}

export interface ProfileFollowersLinking {
	type: typeof LINK_PROFILE_FOLLOWS;
	actor: DID;
}

export interface ProfileLinking {
	type: typeof LINK_PROFILE;
	actor: DID;
}

export interface ReplyLinking {
	type: typeof LINK_REPLY;
	actor: DID;
	rkey: string;
}

export interface TagLinking {
	type: typeof LINK_TAG;
	tag: string;
}

export type Linking =
	| ExternalLinking
	| FeedLikedByLinking
	| FeedLinking
	| ListLinking
	| PostLikedByLinking
	| PostRepostedByLinking
	| PostLinking
	| ProfileFollowersLinking
	| ProfileFollowsLinking
	| ProfileLinking
	| ReplyLinking
	| TagLinking;

export interface LinkingProps {
	to: Linking;
	tabindex?: string | number;
	ref?: HTMLElement | ((el: HTMLElement) => void);
	dir?: 'ltr' | 'rtl' | 'auto';
	disabled?: boolean;
	class?: string;
	title?: string;
	children?: JSX.Element;
}

export interface LinkingContextObject {
	navigate(to: Linking, alt?: boolean): void;
	render(props: LinkingProps): JSX.Element;
}

export const LinkingContext = createContext<LinkingContextObject>();

/*#__NO_SIDE_EFFECTS__*/
export const useLinking = () => {
	return useContext(LinkingContext)!;
};

export const Link = (props: LinkingProps): JSX.Element => {
	const linking = useLinking();

	// @ts-expect-error
	return () => linking.render(props);
};
