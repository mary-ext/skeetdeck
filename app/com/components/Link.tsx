import { type JSX, createContext, useContext } from 'solid-js';

import type { At } from '~/api/atp-schema';
import type { SignalizedProfile } from '~/api/stores/profiles';

export const LINK_EXTERNAL = 0;
export const LINK_FEED = 1;
export const LINK_FEED_LIKED_BY = 2;
export const LINK_LIST = 3;
export const LINK_POST = 4;
export const LINK_POST_LIKED_BY = 5;
export const LINK_POST_REPOSTED_BY = 6;
export const LINK_PROFILE = 7;
export const LINK_PROFILE_EDIT = 8;
export const LINK_PROFILE_FEEDS = 9;
export const LINK_PROFILE_FOLLOWERS = 10;
export const LINK_PROFILE_FOLLOWS = 11;
export const LINK_PROFILE_LISTS = 12;
export const LINK_QUOTE = 13;
export const LINK_REPLY = 14;
export const LINK_TAG = 15;

export interface ExternalLinking {
	type: typeof LINK_EXTERNAL;
	url: string;
	valid: boolean;
}

export interface FeedLinking {
	type: typeof LINK_FEED;
	actor: At.DID;
	rkey: string;
}

export interface FeedLikedByLinking {
	type: typeof LINK_FEED_LIKED_BY;
	actor: At.DID;
	rkey: string;
}

export interface ListLinking {
	type: typeof LINK_LIST;
	actor: At.DID;
	rkey: string;
}

export interface PostLinking {
	type: typeof LINK_POST;
	actor: At.DID;
	rkey: string;
}

export interface PostLikedByLinking {
	type: typeof LINK_POST_LIKED_BY;
	actor: At.DID;
	rkey: string;
}

export interface PostRepostedByLinking {
	type: typeof LINK_POST_REPOSTED_BY;
	actor: At.DID;
	rkey: string;
}

export interface ProfileLinking {
	type: typeof LINK_PROFILE;
	actor: At.DID;
}

export interface ProfileEditLinking {
	type: typeof LINK_PROFILE_EDIT;
	profile: SignalizedProfile;
}

export interface ProfileFeedsLinking {
	type: typeof LINK_PROFILE_FEEDS;
	actor: At.DID;
}

export interface ProfileFollowsLinking {
	type: typeof LINK_PROFILE_FOLLOWERS;
	actor: At.DID;
}

export interface ProfileFollowersLinking {
	type: typeof LINK_PROFILE_FOLLOWS;
	actor: At.DID;
}

export interface ProfileListsLinking {
	type: typeof LINK_PROFILE_LISTS;
	actor: At.DID;
}

export interface QuoteLinking {
	type: typeof LINK_QUOTE;
	actor: At.DID;
	rkey: string;
}

export interface ReplyLinking {
	type: typeof LINK_REPLY;
	actor: At.DID;
	rkey: string;
}

export interface TagLinking {
	type: typeof LINK_TAG;
	tag: string;
}

export type Linking =
	| ExternalLinking
	| FeedLinking
	| FeedLikedByLinking
	| ListLinking
	| PostLinking
	| PostLikedByLinking
	| PostRepostedByLinking
	| ProfileLinking
	| ProfileEditLinking
	| ProfileFeedsLinking
	| ProfileFollowersLinking
	| ProfileFollowsLinking
	| ProfileListsLinking
	| QuoteLinking
	| ReplyLinking
	| TagLinking;

export interface LinkingProps {
	to: Linking;
	tabindex?: string | number;
	ref?: HTMLElement | ((el: HTMLElement) => void);
	dir?: 'ltr' | 'rtl' | 'auto';
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
