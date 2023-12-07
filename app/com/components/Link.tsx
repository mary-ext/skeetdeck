import { type JSX, createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';

export const LINK_EXTERNAL = 0;
export const LINK_FEED = 1;
export const LINK_FEED_LIKED_BY = 2;
export const LINK_LIST = 3;
export const LINK_POST = 4;
export const LINK_POST_LIKED_BY = 5;
export const LINK_POST_REPOSTED_BY = 6;
export const LINK_PROFILE = 7;
export const LINK_PROFILE_EDIT = 8;
export const LINK_PROFILE_FOLLOWERS = 9;
export const LINK_PROFILE_FOLLOWS = 10;
export const LINK_REPLY = 11;
export const LINK_TAG = 12;

export type LinkingType =
	| typeof LINK_EXTERNAL
	| typeof LINK_FEED
	| typeof LINK_FEED_LIKED_BY
	| typeof LINK_LIST
	| typeof LINK_POST
	| typeof LINK_POST_LIKED_BY
	| typeof LINK_POST_REPOSTED_BY
	| typeof LINK_PROFILE
	| typeof LINK_PROFILE_EDIT
	| typeof LINK_PROFILE_FOLLOWERS
	| typeof LINK_PROFILE_FOLLOWS
	| typeof LINK_REPLY
	| typeof LINK_TAG;

export interface ExternalLinking {
	type: typeof LINK_EXTERNAL;
	url: string;
	valid: boolean;
}

export interface FeedLinking {
	type: typeof LINK_FEED;
	actor: DID;
	rkey: string;
}

export interface FeedLikedByLinking {
	type: typeof LINK_FEED_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface ListLinking {
	type: typeof LINK_LIST;
	actor: DID;
	rkey: string;
}

export interface PostLinking {
	type: typeof LINK_POST;
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

export interface ProfileLinking {
	type: typeof LINK_PROFILE;
	actor: DID;
}

export interface ProfileEditLinking {
	type: typeof LINK_PROFILE_EDIT;
	profile: SignalizedProfile;
}

export interface ProfileFollowsLinking {
	type: typeof LINK_PROFILE_FOLLOWERS;
	actor: DID;
}

export interface ProfileFollowersLinking {
	type: typeof LINK_PROFILE_FOLLOWS;
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
	| FeedLinking
	| FeedLikedByLinking
	| ListLinking
	| PostLinking
	| PostLikedByLinking
	| PostRepostedByLinking
	| ProfileLinking
	| ProfileEditLinking
	| ProfileFollowersLinking
	| ProfileFollowsLinking
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
