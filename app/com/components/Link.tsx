import { type JSX, createContext, useContext } from 'solid-js';

import type { DID } from '~/api/atp-schema.ts';

export const enum LinkingType {
	EXTERNAL,
	FEED_LIKED_BY,
	FEED,
	LIST,
	POST_LIKED_BY,
	POST_REPOSTED_BY,
	POST,
	PROFILE_FOLLOWERS,
	PROFILE_FOLLOWS,
	PROFILE,
	REPLY,
	TAG,
}

export interface ExternalLinking {
	type: LinkingType.EXTERNAL;
	url: string;
	valid: boolean;
}

export interface FeedLikedByLinking {
	type: LinkingType.FEED_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface FeedLinking {
	type: LinkingType.FEED;
	actor: DID;
	rkey: string;
}

export interface ListLinking {
	type: LinkingType.LIST;
	actor: DID;
	rkey: string;
}

export interface PostLikedByLinking {
	type: LinkingType.POST_LIKED_BY;
	actor: DID;
	rkey: string;
}

export interface PostRepostedByLinking {
	type: LinkingType.POST_REPOSTED_BY;
	actor: DID;
	rkey: string;
}

export interface PostLinking {
	type: LinkingType.POST;
	actor: DID;
	rkey: string;
}

export interface ProfileFollowsLinking {
	type: LinkingType.PROFILE_FOLLOWERS;
	actor: DID;
}

export interface ProfileFollowersLinking {
	type: LinkingType.PROFILE_FOLLOWS;
	actor: DID;
}

export interface ProfileLinking {
	type: LinkingType.PROFILE;
	actor: DID;
}

export interface ReplyLinking {
	type: LinkingType.REPLY;
	actor: DID;
	rkey: string;
}

export interface TagLinking {
	type: LinkingType.TAG;
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
